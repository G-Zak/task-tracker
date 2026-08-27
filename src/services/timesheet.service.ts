import { prisma } from '@/src/lib/prisma'
import { Prisma } from '@/generated/client'
import { TaskStatus } from '@/generated/enums'

export type TimesheetPeriod = 'week' | 'month' | 'quarter' | 'all'
export type TimesheetGroupBy = 'user' | 'project'

export interface TimesheetEntry {
    id: string
    title: string
    status: TaskStatus
    startedAt: Date
    approvedAt: Date | null
    durationMs: number
    project: { id: string; name: string } | null
    assignees: { id: string; firstName: string; lastName: string }[]
}

export interface TimesheetGroup {
    key: string
    label: string
    totalMs: number
    entries: TimesheetEntry[]
}

export interface TimesheetResult {
    groups: TimesheetGroup[]
    totalMs: number
}

interface TimesheetFilters {
    organisationId: string
    period: TimesheetPeriod
    projectId?: string
    userId?: string
    groupBy: TimesheetGroupBy
    restrictToUserId?: string
}

function periodStart(period: TimesheetPeriod): Date | null {
    if (period === 'all') return null

    const days = period === 'week' ? 7 : period === 'month' ? 30 : 90
    const start = new Date()
    start.setDate(start.getDate() - days)
    return start
}

export async function getTimesheet(filters: TimesheetFilters): Promise<TimesheetResult> {
    const { organisationId, period, projectId, userId, groupBy, restrictToUserId } = filters

    const where: Prisma.TaskWhereInput = {
        organisationId,
        startedAt: { not: null },
    }

    const start = periodStart(period)
    if (start) where.startedAt = { not: null, gte: start }

    if (projectId) where.projectId = projectId

    if (userId) {
        where.assignees = { some: { id: userId } }
    } else if (restrictToUserId) {
        where.OR = [
            { assignees: { some: { id: restrictToUserId } } },
            { project: { members: { some: { id: restrictToUserId } } } },
        ]
    }

    const tasks = await prisma.task.findMany({
        where,
        include: {
            project: { select: { id: true, name: true } },
            assignees: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { startedAt: 'desc' },
    })

    const now = new Date()
    const entries: TimesheetEntry[] = tasks.map((task) => {
        const end = task.approvedAt ?? now
        const durationMs = Math.max(0, end.getTime() - task.startedAt!.getTime())

        return {
            id: task.id,
            title: task.title,
            status: task.status,
            startedAt: task.startedAt!,
            approvedAt: task.approvedAt,
            durationMs,
            project: task.project ? { id: task.project.id, name: task.project.name } : null,
            assignees: task.assignees,
        }
    })

    const groupsByKey = new Map<string, TimesheetGroup>()

    function addToGroup(key: string, label: string, entry: TimesheetEntry) {
        const existing = groupsByKey.get(key)
        if (existing) {
            existing.entries.push(entry)
            existing.totalMs += entry.durationMs
        } else {
            groupsByKey.set(key, { key, label, totalMs: entry.durationMs, entries: [entry] })
        }
    }

    for (const entry of entries) {
        if (groupBy === 'project') {
            addToGroup(entry.project?.id ?? 'none', entry.project?.name ?? 'Sans projet', entry)
            continue
        }

        if (entry.assignees.length === 0) {
            addToGroup('none', 'Non assignée', entry)
        } else {
            for (const assignee of entry.assignees) {
                addToGroup(assignee.id, `${assignee.firstName} ${assignee.lastName}`, entry)
            }
        }
    }

    const groups = [...groupsByKey.values()].sort((a, b) => b.totalMs - a.totalMs)
    const totalMs = entries.reduce((sum, entry) => sum + entry.durationMs, 0)

    return { groups, totalMs }
}
