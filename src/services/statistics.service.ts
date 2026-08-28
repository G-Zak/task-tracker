import { prisma } from '@/src/lib/prisma'
import { Prisma } from '@/generated/client'
import { TaskStatus } from '@/generated/enums'
import { taskStatusOptions } from '@/src/lib/labels'
import { CLOSED_TASK_STATUSES } from '@/src/services/dashboard.service'
import { periodStart, type Period } from '@/src/lib/period'

export interface TeamWorkloadStat {
    id: string
    name: string
    activeTaskCount: number
}

export interface OrgStatistics {
    tasksByStatus: Record<TaskStatus, number>
    totalTasks: number
    onTimeCount: number
    lateCount: number
    onTimeRate: number | null
    teamWorkload: TeamWorkloadStat[]
}

interface StatisticsFilters {
    organisationId: string
    period: Period
    projectId?: string
    clientId?: string
}

export async function getOrgStatistics(filters: StatisticsFilters): Promise<OrgStatistics> {
    const { organisationId, period, projectId, clientId } = filters

    const where: Prisma.TaskWhereInput = { organisationId }

    const start = periodStart(period)
    if (start) where.createdAt = { gte: start }

    if (projectId) where.projectId = projectId
    else if (clientId) where.project = { clientId }

    const [tasks, teams] = await Promise.all([
        prisma.task.findMany({
            where,
            select: {
                status: true,
                dueDate: true,
                approvedAt: true,
                assignees: { select: { id: true } },
            },
        }),
        prisma.team.findMany({
            where: { organisationId },
            select: { id: true, name: true, members: { select: { id: true } } },
            orderBy: { name: 'asc' },
        }),
    ])

    const tasksByStatus = taskStatusOptions.reduce((acc, status) => {
        acc[status] = 0
        return acc
    }, {} as Record<TaskStatus, number>)

    // "Respect des délais" : parmi les tâches TERMINÉES qui avaient une échéance, combien ont été
    // validées (approvedAt, US-030) avant ou à cette échéance. Une tâche sans dueDate n'entre dans
    // aucun des deux compteurs — impossible de juger un respect de délai sans délai à respecter.
    let onTimeCount = 0
    let lateCount = 0

    for (const task of tasks) {
        tasksByStatus[task.status] = (tasksByStatus[task.status] ?? 0) + 1

        if (task.status === TaskStatus.DONE && task.dueDate) {
            if (task.approvedAt && task.approvedAt <= task.dueDate) onTimeCount++
            else lateCount++
        }
    }

    const ratedTotal = onTimeCount + lateCount
    const onTimeRate = ratedTotal === 0 ? null : Math.round((onTimeCount / ratedTotal) * 100)

    // Charge par équipe : réutilise le même ensemble de tâches déjà filtré (période/projet/client)
    // plutôt que de relancer une requête par équipe — possible ici parce que les tâches sont déjà
    // chargées en mémoire pour la répartition par statut ci-dessus.
    const teamWorkload: TeamWorkloadStat[] = teams
        .map((team) => {
            const memberIds = new Set(team.members.map((member) => member.id))
            const activeTaskCount = tasks.filter(
                (task) => !CLOSED_TASK_STATUSES.includes(task.status) && task.assignees.some((assignee) => memberIds.has(assignee.id))
            ).length

            return { id: team.id, name: team.name, activeTaskCount }
        })
        .sort((a, b) => b.activeTaskCount - a.activeTaskCount)

    return {
        tasksByStatus,
        totalTasks: tasks.length,
        onTimeCount,
        lateCount,
        onTimeRate,
        teamWorkload,
    }
}
