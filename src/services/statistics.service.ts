import { prisma } from '@/src/lib/prisma'
import { Prisma } from '@/generated/client'
import { TaskStatus, TaskPriority } from '@/generated/enums'
import { taskStatusOptions, taskPriorityOptions } from '@/src/lib/labels'
import { CLOSED_TASK_STATUSES } from '@/src/services/dashboard.service'
import { periodStart } from '@/src/lib/period'

export type StatisticsPeriod = 'week' | 'month' | 'quarter' | 'custom'

export interface TeamWorkloadStat {
    id: string
    name: string
    activeTaskCount: number
}

export interface ProjectVolumeStat {
    id: string | null
    name: string
    count: number
}

export interface OrgStatistics {
    tasksByStatus: Record<TaskStatus, number>
    tasksByPriority: Record<TaskPriority, number>
    totalTasks: number
    onTimeCount: number
    lateCount: number
    onTimeRate: number | null
    overdueCount: number
    avgCompletionMs: number | null
    teamWorkload: TeamWorkloadStat[]
    projectVolume: ProjectVolumeStat[]
}

interface StatisticsFilters {
    organisationId: string
    period: StatisticsPeriod
    customFrom?: Date
    customTo?: Date
    projectId?: string
    clientId?: string
    teamId?: string
}

function resolvePeriodRange(period: StatisticsPeriod, customFrom?: Date, customTo?: Date): { start: Date | null; end: Date | null } {
    if (period === 'custom') {
        const end = customTo ? new Date(customTo.getTime() + 24 * 60 * 60 * 1000) : null
        return { start: customFrom ?? null, end }
    }
    return { start: periodStart(period), end: null }
}

export async function getOrgStatistics(filters: StatisticsFilters): Promise<OrgStatistics> {
    const { organisationId, period, customFrom, customTo, projectId, clientId, teamId } = filters

    let teamMemberIds: string[] | null = null
    if (teamId) {
        const team = await prisma.team.findFirst({
            where: { id: teamId, organisationId },
            select: { members: { select: { id: true } } },
        })
        teamMemberIds = team ? team.members.map((member) => member.id) : []
    }

    const where: Prisma.TaskWhereInput = { organisationId }

    const { start, end } = resolvePeriodRange(period, customFrom, customTo)
    if (start || end) {
        where.createdAt = {}
        if (start) where.createdAt.gte = start
        if (end) where.createdAt.lt = end
    }

    if (projectId) where.projectId = projectId
    else if (clientId) where.project = { clientId }

    if (teamMemberIds) where.assignees = { some: { id: { in: teamMemberIds } } }

    const [tasks, teams] = await Promise.all([
        prisma.task.findMany({
            where,
            select: {
                status: true,
                priority: true,
                dueDate: true,
                approvedAt: true,
                startedAt: true,
                assignees: { select: { id: true } },
                project: { select: { id: true, name: true } },
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

    const tasksByPriority = taskPriorityOptions.reduce((acc, priority) => {
        acc[priority] = 0
        return acc
    }, {} as Record<TaskPriority, number>)

    let onTimeCount = 0
    let lateCount = 0
    let overdueCount = 0
    let completionMsTotal = 0
    let completedWithDuration = 0
    const now = new Date()
    const projectVolumeMap = new Map<string, ProjectVolumeStat>()

    for (const task of tasks) {
        tasksByStatus[task.status] = (tasksByStatus[task.status] ?? 0) + 1
        tasksByPriority[task.priority] = (tasksByPriority[task.priority] ?? 0) + 1

        if (task.status === TaskStatus.DONE && task.dueDate) {
            if (task.approvedAt && task.approvedAt <= task.dueDate) onTimeCount++
            else lateCount++
        }

        if (task.dueDate && task.dueDate < now && !CLOSED_TASK_STATUSES.includes(task.status)) {
            overdueCount++
        }

        if (task.status === TaskStatus.DONE && task.startedAt && task.approvedAt) {
            completionMsTotal += task.approvedAt.getTime() - task.startedAt.getTime()
            completedWithDuration++
        }

        const key = task.project?.id ?? '__none__'
        const existing = projectVolumeMap.get(key)
        if (existing) {
            existing.count++
        } else {
            projectVolumeMap.set(key, { id: task.project?.id ?? null, name: task.project?.name ?? 'Sans projet', count: 1 })
        }
    }

    const ratedTotal = onTimeCount + lateCount
    const onTimeRate = ratedTotal === 0 ? null : Math.round((onTimeCount / ratedTotal) * 100)
    const avgCompletionMs = completedWithDuration === 0 ? null : Math.round(completionMsTotal / completedWithDuration)

    const teamWorkload: TeamWorkloadStat[] = teams
        .map((team) => {
            const memberIds = new Set(team.members.map((member) => member.id))
            const activeTaskCount = tasks.filter(
                (task) => !CLOSED_TASK_STATUSES.includes(task.status) && task.assignees.some((assignee) => memberIds.has(assignee.id))
            ).length

            return { id: team.id, name: team.name, activeTaskCount }
        })
        .sort((a, b) => b.activeTaskCount - a.activeTaskCount)

    const projectVolume = Array.from(projectVolumeMap.values()).sort((a, b) => b.count - a.count)

    return {
        tasksByStatus,
        tasksByPriority,
        totalTasks: tasks.length,
        onTimeCount,
        lateCount,
        onTimeRate,
        overdueCount,
        avgCompletionMs,
        teamWorkload,
        projectVolume,
    }
}
