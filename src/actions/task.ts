'use server'

import { prisma } from '@/lib/prisma'
import { authorizeRole, getCurrentUserSession } from '@/src/lib/rbac'
import { isOwnedByOrg, ownershipErrorMessage } from '@/src/lib/ownership'
import { catchActionError } from '@/src/lib/action-error'
import { Role, TaskStatus } from '@/src/generated/client'
import { taskSchema, TaskFormValues, updateTaskMetricsSchema, UpdateTaskMetricsValues } from '@/src/validations/task.schema'
import { computeTaskTimestampUpdates } from '@/src/lib/task-timestamps'
import { indexTask, removeFromIndex } from '@/src/services/rag.service'
import { revalidatePath } from 'next/cache'
import { after } from 'next/server'

function revalidateTaskViews(orgSlug: string, taskId?: string, projectId?: string | null) {
    revalidatePath(`/org/${orgSlug}/dashboard`)
    revalidatePath(`/org/${orgSlug}/tasks`)
    if (projectId) revalidatePath(`/org/${orgSlug}/projects/${projectId}`)
}

export async function createTask(values: TaskFormValues, orgSlug: string): Promise<{ success: true; action: 'create'; data: { id: string } } | { error: string }> {
    try {
        const user = await authorizeRole(Role.PROJECT_MANAGER)

        const parsed = taskSchema.safeParse(values)
        if (!parsed.success) {
            return { error: parsed.error.issues[0]?.message || 'Données invalides.' }
        }

        const { title, description, status, priority, projectId, taskTypeId, dueDate, assigneeIds } = parsed.data

        const project = await prisma.project.findFirst({
            where: { id: projectId, organisationId: user.organisationId },
            select: { id: true, name: true },
        })
        if (!project) return { error: 'Projet introuvable ou accès refusé.' }

        const timestampUpdates = computeTaskTimestampUpdates({
            previousStatus: TaskStatus.TODO,
            nextStatus: status,
            startedAt: null,
        })

        const task = await prisma.task.create({
            data: {
                title,
                description: description || null,
                status,
                priority,
                projectId,
                taskTypeId: taskTypeId || null,
                dueDate: dueDate ? new Date(dueDate) : null,
                organisationId: user.organisationId,
                assignees: {
                    connect: (assigneeIds ?? []).map((id) => ({ id })),
                },
                ...timestampUpdates,
            },
        })

        revalidateTaskViews(orgSlug, task.id, projectId)
        // after() plutôt que await : l'indexation RAG (appel réseau à Ollama pour l'embedding)
        // n'a pas besoin de retarder la réponse envoyée au client — même mécanique appliquée dans
        // project.ts et note.ts (voir Application-Analysis-2026-08-28.md §4.1).
        after(() => indexTask(task.id))

        return { success: true, action: 'create', data: { id: task.id } }
    } catch (error) {
        return catchActionError(error, 'Une erreur est survenue lors de la création de la tâche.')
    }
}

export async function updateTask(taskId: string, values: TaskFormValues, orgSlug: string): Promise<{ success: true; action: 'update' } | { error: string }> {
    try {
        const user = await authorizeRole(Role.PROJECT_MANAGER)

        const parsed = taskSchema.safeParse(values)
        if (!parsed.success) {
            return { error: parsed.error.issues[0]?.message || 'Données invalides.' }
        }

        const { title, description, status, priority, projectId, taskTypeId, dueDate, assigneeIds } = parsed.data

        const task = await prisma.task.findFirst({
            where: { id: taskId, organisationId: user.organisationId },
            select: { id: true, projectId: true, status: true, startedAt: true },
        })
        if (!task) return { error: 'Tâche introuvable ou accès refusé.' }

        const timestampUpdates = computeTaskTimestampUpdates({
            previousStatus: task.status,
            nextStatus: status,
            startedAt: task.startedAt,
        })

        await prisma.task.update({
            where: { id: taskId },
            data: {
                title,
                description: description || null,
                status,
                priority,
                projectId,
                taskTypeId: taskTypeId || null,
                dueDate: dueDate ? new Date(dueDate) : null,
                assignees: {
                    set: (assigneeIds ?? []).map((id) => ({ id })),
                },
                ...timestampUpdates,
            },
        })

        revalidateTaskViews(orgSlug, taskId, projectId)
        after(() => indexTask(taskId))

        return { success: true, action: 'update' }
    } catch (error) {
        return catchActionError(error, 'Une erreur est survenue lors de la mise à jour de la tâche.')
    }
}

export async function updateTaskMetrics(values: UpdateTaskMetricsValues, orgSlug: string): Promise<{ success: true } | { error: string }> {
    try {
        const user = await getCurrentUserSession()
        if (!user) return { error: 'Non authentifié.' }

        const parsed = updateTaskMetricsSchema.safeParse(values)
        if (!parsed.success) {
            return { error: parsed.error.issues[0]?.message || 'Données de mise à jour invalides.' }
        }

        const { taskId, status, priority } = parsed.data

        const task = await prisma.task.findFirst({
            where: { id: taskId, organisationId: user.organisationId },
            select: { id: true, projectId: true, status: true, startedAt: true, assignees: { select: { id: true } } },
        })
        if (!task) return { error: 'Tâche introuvable ou accès refusé.' }

        const isAssignee = task.assignees.some((assignee) => assignee.id === user.id)
        const isManager = user.role === Role.ADMIN || user.role === Role.PROJECT_MANAGER

        if (!isAssignee && !isManager) {
            return { error: "Vous n'êtes pas autorisé à modifier cette tâche." }
        }

        if (priority && !isManager) {
            return { error: 'Seuls les administrateurs et chefs de projet peuvent modifier la priorité.' }
        }

        const timestampUpdates = computeTaskTimestampUpdates({
            previousStatus: task.status,
            nextStatus: status,
            startedAt: task.startedAt,
        })

        await prisma.task.update({
            where: { id: taskId },
            data: {
                ...(status && { status }),
                ...(priority && { priority }),
                ...timestampUpdates,
            },
        })

        revalidateTaskViews(orgSlug, taskId, task.projectId)
        after(() => indexTask(taskId))

        return { success: true }
    } catch (error) {
        return catchActionError(error, 'Impossible de mettre à jour la tâche.')
    }
}

export async function deleteTask(taskId: string, orgSlug: string): Promise<{ success: true } | { error: string }> {
    try {
        const user = await authorizeRole(Role.PROJECT_MANAGER)

        const task = await prisma.task.findUnique({
            where: { id: taskId },
        })

        if (!isOwnedByOrg(task, user.organisationId)) return { error: ownershipErrorMessage('Tâche') }

        await prisma.task.delete({
            where: { id: taskId },
        })

        revalidateTaskViews(orgSlug, taskId, task.projectId)
        after(() => removeFromIndex('TASK', taskId))

        return { success: true }
    } catch (error) {
        return catchActionError(error, 'Une erreur est survenue lors de la suppression de la tâche.')
    }
}
