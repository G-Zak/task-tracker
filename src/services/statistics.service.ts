import { prisma } from '@/src/lib/prisma'
import { Prisma } from '@/generated/client'
import { TaskStatus } from '@/generated/enums'
import { taskStatusOptions } from '@/src/lib/labels'
import { CLOSED_TASK_STATUSES } from '@/src/services/dashboard.service'
import { periodStart } from '@/src/lib/period'

// Options distinctes de `Period` (src/lib/period.ts) : cette story (US-038) remplace "Toute la
// période" par une plage personnalisée, un choix propre aux statistiques — les Feuilles de
// temps (US-032) gardent leurs quatre options d'origine, inchangées.
export type StatisticsPeriod = 'week' | 'month' | 'quarter' | 'custom'

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
    period: StatisticsPeriod
    customFrom?: Date
    customTo?: Date
    projectId?: string
    clientId?: string
    teamId?: string
}

function resolvePeriodRange(period: StatisticsPeriod, customFrom?: Date, customTo?: Date): { start: Date | null; end: Date | null } {
    if (period === 'custom') {
        // Borne de fin exclusive fixée au lendemain pour inclure toute la journée "to"
        // (un <input type="date"> ne porte que la date, pas d'heure).
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

    // Charge par équipe : réutilise le même ensemble de tâches déjà filtré (période/projet/client/
    // équipe) plutôt que de relancer une requête par équipe — possible ici parce que les tâches
    // sont déjà chargées en mémoire pour la répartition par statut ci-dessus.
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
