import { prisma } from '@/src/lib/prisma'
import { TaskStatus, ProjectStatus } from '@/generated/enums'
import { taskStatusOptions } from '@/src/lib/labels'
import { CLOSED_TASK_STATUSES } from '@/src/services/dashboard.service'
import { isProjectOverdue } from '@/src/services/client.service'
import { searchKnowledge, type KnowledgeScope } from '@/src/services/rag.service'
import { describeOllamaFailure, ollamaChatDetailed, type OllamaChatMessage } from '@/src/lib/ollama-chat'

export interface ProjectReportRiskItem {
    title: string
    detail: string
}

export interface ProjectReport {
    projectId: string
    projectName: string
    projectStatus: ProjectStatus
    clientName: string | null
    generatedAt: Date

    totalTasks: number
    tasksByStatus: Record<TaskStatus, number>
    progressRate: number | null
    startDate: Date | null
    endDate: Date | null
    isProjectOverdue: boolean

    overdueTasks: ProjectReportRiskItem[]
    blockedTasks: ProjectReportRiskItem[]
    onTimeRate: number | null

    recommendations: string
}

function formatDate(date: Date): string {
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

async function generateRecommendations(params: {
    organisationId: string
    projectId: string
    projectName: string
    taskIds: string[]
    factsBlock: string
}): Promise<string> {
    const notes = await prisma.projectNote.findMany({
        where: { projectId: params.projectId },
        select: { id: true },
    })

    const scope: KnowledgeScope = {
        projectIds: [params.projectId],
        taskIds: params.taskIds,
        noteIds: notes.map((note) => note.id),
    }

    const matches = await searchKnowledge(params.organisationId, `avancement et risques du projet ${params.projectName}`, 8, scope)
    const contextBlock = matches.length > 0 ? matches.map((match) => match.content).join('\n\n') : '(aucun contexte indexé pour ce projet)'

    const messages: OllamaChatMessage[] = [
        {
            role: 'system',
            content: [
                "Tu rédiges la section \"Recommandations\" d'un rapport de projet destiné à un client ou à la direction.",
                "Base-toi UNIQUEMENT sur les faits et le contexte fournis ci-dessous — ne les répète pas dans ta réponse,",
                "n'invente aucun chiffre qui n'y figure pas. Si le contexte est insuffisant pour une recommandation",
                'précise, propose une recommandation générale prudente plutôt qu\'un chiffre inventé.',
                'Rédige 3 à 5 recommandations concrètes et actionnables, en français, au format liste à puces Markdown.',
                `Faits :\n${params.factsBlock}`,
                `Contexte du projet :\n${contextBlock}`,
            ].join('\n\n'),
        },
        { role: 'user', content: 'Rédige les recommandations.' },
    ]

    const result = await ollamaChatDetailed(messages)
    return result.ok ? result.content : `_${describeOllamaFailure(result.reason, result.detail)}_`
}

export async function generateProjectReport(projectId: string, organisationId: string): Promise<ProjectReport | null> {
    const project = await prisma.project.findFirst({
        where: { id: projectId, organisationId },
        include: {
            client: { select: { name: true } },
            tasks: { select: { id: true, title: true, status: true, dueDate: true, approvedAt: true } },
        },
    })
    if (!project) return null

    const now = new Date()

    const tasksByStatus = taskStatusOptions.reduce((acc, status) => {
        acc[status] = 0
        return acc
    }, {} as Record<TaskStatus, number>)
    for (const task of project.tasks) tasksByStatus[task.status]++

    const totalTasks = project.tasks.length
    const progressRate = totalTasks === 0 ? null : Math.round((tasksByStatus[TaskStatus.DONE] / totalTasks) * 100)

    const overdueTasks: ProjectReportRiskItem[] = project.tasks
        .filter((task) => task.dueDate && task.dueDate < now && !CLOSED_TASK_STATUSES.includes(task.status))
        .map((task) => ({ title: task.title, detail: `Échéance dépassée le ${formatDate(task.dueDate!)}` }))

    const blockedTasks: ProjectReportRiskItem[] = project.tasks
        .filter((task) => task.status === TaskStatus.BLOCKED)
        .map((task) => ({ title: task.title, detail: 'Statut : Bloquée' }))

    let onTimeCount = 0
    let lateCount = 0
    for (const task of project.tasks) {
        if (task.status === TaskStatus.DONE && task.dueDate) {
            if (task.approvedAt && task.approvedAt <= task.dueDate) onTimeCount++
            else lateCount++
        }
    }
    const ratedTotal = onTimeCount + lateCount
    const onTimeRate = ratedTotal === 0 ? null : Math.round((onTimeCount / ratedTotal) * 100)

    const factsBlock = [
        `Projet : ${project.name} (statut : ${project.status})`,
        `Avancement : ${progressRate === null ? 'aucune tâche' : `${progressRate}% des tâches terminées`} (${totalTasks} tâche(s) au total)`,
        `Tâches en retard : ${overdueTasks.length}`,
        `Tâches bloquées : ${blockedTasks.length}`,
        `Taux de respect des délais : ${onTimeRate === null ? 'aucune donnée' : `${onTimeRate}%`}`,
    ].join('\n')

    const recommendations = await generateRecommendations({
        organisationId,
        projectId: project.id,
        projectName: project.name,
        taskIds: project.tasks.map((task) => task.id),
        factsBlock,
    })

    return {
        projectId: project.id,
        projectName: project.name,
        projectStatus: project.status,
        clientName: project.client?.name ?? null,
        generatedAt: now,
        totalTasks,
        tasksByStatus,
        progressRate,
        startDate: project.startDate,
        endDate: project.endDate,
        isProjectOverdue: isProjectOverdue(project.status, project.endDate, now),
        overdueTasks,
        blockedTasks,
        onTimeRate,
        recommendations,
    }
}
