'use server'

import { prisma } from '@/lib/prisma'
import { authorizeRole } from '@/src/lib/rbac'
import { Role } from '@/src/generated/client'
import { taskSchema, TaskFormValues } from '@/src/validations/task.schema'
import { revalidatePath } from 'next/cache'

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
            },
        })

        revalidateTaskViews(orgSlug, task.id, projectId)

        return { success: true, action: 'create', data: { id: task.id } }
    } catch (error: any) {
        return { error: 'Une erreur est survenue lors de la création de la tâche.' }
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
            select: { id: true, projectId: true },
        })
        if (!task) return { error: 'Tâche introuvable ou accès refusé.' }

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
            },
        })

        revalidateTaskViews(orgSlug, taskId, projectId)

        return { success: true, action: 'update' }
    } catch (error: any) {
        return { error: 'Une erreur est survenue lors de la mise à jour de la tâche.' }
    }
}