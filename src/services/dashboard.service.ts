import { prisma } from '@/src/lib/prisma'
import { Prisma } from '@/generated/client'
import { ProjectStatus, TaskStatus } from '@/generated/enums'
import { taskStatusOptions } from '@/src/lib/labels'

export interface MyTask {
    id: string
    title: string
    status: TaskStatus
    dueDate: Date | null
    project: { id: string; name: string } | null
}

export interface ActivityItem {
    type: 'task' | 'note'
    id: string
    timestamp: Date
    projectName: string | null
    // 'task'
    title?: string
    status?: TaskStatus
    // 'note'
    content?: string
    authorName?: string | null
}

export interface OrgActivitySummary {
    tasksUpdatedToday: number
    notesPostedToday: number
}

export interface WeeklyTrendPoint {
    weekStart: string // ISO date (lundi de la semaine)
    created: number
    completed: number
}

export interface MemberWorkload {
    userId: string
    name: string
    activeTaskCount: number
}

function startOfWeek(date: Date): Date {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    const day = d.getDay() // 0 = dimanche
    const diffToMonday = (day + 6) % 7
    d.setDate(d.getDate() - diffToMonday)
    return d
}

interface DashboardScope {
    organisationId: string
    restrictToUserId?: string
}

export interface DashboardKpis {
    activeProjects: number
    overdueTasks: number
    tasksByStatus: Record<TaskStatus, number>
    totalTasks: number
}

const ACTIVE_PROJECT_STATUSES: ProjectStatus[] = [ProjectStatus.PLANNING, ProjectStatus.IN_PROGRESS]
export const CLOSED_TASK_STATUSES: TaskStatus[] = [TaskStatus.DONE, TaskStatus.CANCELLED]

export async function getDashboardKpis({ organisationId, restrictToUserId }: DashboardScope): Promise<DashboardKpis> {
    const projectWhere: Prisma.ProjectWhereInput = {
        organisationId,
        status: { in: ACTIVE_PROJECT_STATUSES },
    }

    const taskWhere: Prisma.TaskWhereInput = { organisationId }

    if (restrictToUserId) {
        projectWhere.members = { some: { id: restrictToUserId } }
        taskWhere.OR = [
            { assignees: { some: { id: restrictToUserId } } },
            { project: { members: { some: { id: restrictToUserId } } } },
        ]
    }

    const overdueWhere = {
        ...taskWhere,
        dueDate: { lt: new Date() },
        status: { notIn: CLOSED_TASK_STATUSES },
    }

    const [activeProjects, overdueTasks, statusGroups] = await Promise.all([
        prisma.project.count({ where: projectWhere }),
        prisma.task.count({ where: overdueWhere }),
        prisma.task.groupBy({
            by: ['status'],
            where: taskWhere,
            _count: { _all: true },
        }),
    ])

    const tasksByStatus = taskStatusOptions.reduce((acc, status) => {
        acc[status] = 0
        return acc
    }, {} as Record<TaskStatus, number>)

    let totalTasks = 0
    for (const group of statusGroups) {
        tasksByStatus[group.status as TaskStatus] = group._count._all
        totalTasks += group._count._all
    }

    return { activeProjects, overdueTasks, tasksByStatus, totalTasks }
}

// Tâches assignées à l'utilisateur, encore actives, triées par échéance.
// PostgreSQL place les NULL après les valeurs sur un tri ASC par défaut : les tâches
// sans échéance se retrouvent naturellement en fin de liste, sans config supplémentaire.
export async function getMyAssignedTasks(organisationId: string, userId: string, limit = 5): Promise<MyTask[]> {
    const tasks = await prisma.task.findMany({
        where: {
            organisationId,
            assignees: { some: { id: userId } },
            status: { notIn: [TaskStatus.DONE, TaskStatus.CANCELLED] },
        },
        include: { project: { select: { id: true, name: true } } },
        orderBy: { dueDate: 'asc' },
        take: limit,
    })

    return tasks.map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        dueDate: task.dueDate,
        project: task.project,
    }))
}

// Fil d'activité personnel : tâches récemment modifiées + messages postés, sur le
// périmètre de l'utilisateur (tâches qui lui sont assignées, projets dont il est membre).
export async function getRecentActivity(organisationId: string, userId: string, limit = 6): Promise<ActivityItem[]> {
    const scopeOr: Prisma.TaskWhereInput['OR'] = [
        { assignees: { some: { id: userId } } },
        { project: { members: { some: { id: userId } } } },
    ]

    const [recentTasks, recentNotes] = await Promise.all([
        prisma.task.findMany({
            where: { organisationId, OR: scopeOr },
            include: { project: { select: { id: true, name: true } } },
            orderBy: { updatedAt: 'desc' },
            take: limit,
        }),
        prisma.projectNote.findMany({
            where: { project: { organisationId, members: { some: { id: userId } } } },
            include: {
                author: { select: { firstName: true, lastName: true } },
                project: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        }),
    ])

    const merged: ActivityItem[] = [
        ...recentTasks.map((task): ActivityItem => ({
            type: 'task',
            id: task.id,
            timestamp: task.updatedAt,
            projectName: task.project?.name ?? null,
            title: task.title,
            status: task.status,
        })),
        ...recentNotes.map((note): ActivityItem => ({
            type: 'note',
            id: note.id,
            timestamp: note.createdAt,
            projectName: note.project?.name ?? null,
            content: note.content,
            authorName: note.author ? `${note.author.firstName} ${note.author.lastName}` : null,
        })),
    ]

    merged.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    return merged.slice(0, limit)
}

// Résumé additionnel réservé à ADMIN (US-028) : activité du jour sur toute l'organisation,
// au-delà du périmètre personnel de getRecentActivity.
export async function getOrgActivitySummary(organisationId: string): Promise<OrgActivitySummary> {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const [tasksUpdatedToday, notesPostedToday] = await Promise.all([
        prisma.task.count({ where: { organisationId, updatedAt: { gte: startOfDay } } }),
        prisma.projectNote.count({ where: { project: { organisationId }, createdAt: { gte: startOfDay } } }),
    ])

    return { tasksUpdatedToday, notesPostedToday }
}

// Tendance hebdomadaire (créées vs. terminées) sur les `weeks` dernières semaines, pour le
// graphique du dashboard. « Terminées » est une approximation : faute d'horodatage dédié
// (startedAt/approvedAt, prévu en US-030/US-031), on retient updatedAt des tâches déjà DONE —
// juste tant qu'une tâche terminée n'est pas ré-éditée pour une autre raison ensuite.
export async function getWeeklyTaskTrend(
    organisationId: string,
    restrictToUserId?: string,
    weeks = 8
): Promise<WeeklyTrendPoint[]> {
    const scopeWhere: Prisma.TaskWhereInput = { organisationId }
    if (restrictToUserId) {
        scopeWhere.OR = [
            { assignees: { some: { id: restrictToUserId } } },
            { project: { members: { some: { id: restrictToUserId } } } },
        ]
    }

    const currentWeekStart = startOfWeek(new Date())
    const windowStart = new Date(currentWeekStart)
    windowStart.setDate(windowStart.getDate() - (weeks - 1) * 7)

    const [createdTasks, completedTasks] = await Promise.all([
        prisma.task.findMany({
            where: { ...scopeWhere, createdAt: { gte: windowStart } },
            select: { createdAt: true },
        }),
        prisma.task.findMany({
            where: { ...scopeWhere, status: TaskStatus.DONE, updatedAt: { gte: windowStart } },
            select: { updatedAt: true },
        }),
    ])

    const points: WeeklyTrendPoint[] = []
    for (let i = 0; i < weeks; i++) {
        const weekStart = new Date(windowStart)
        weekStart.setDate(weekStart.getDate() + i * 7)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 7)

        points.push({
            weekStart: weekStart.toISOString().slice(0, 10),
            created: createdTasks.filter((t) => t.createdAt >= weekStart && t.createdAt < weekEnd).length,
            completed: completedTasks.filter((t) => t.updatedAt >= weekStart && t.updatedAt < weekEnd).length,
        })
    }

    return points
}

// Charge de travail par membre (tâches actives, non DONE/CANCELLED) — vue organisation,
// réservée à ADMIN/PROJECT_MANAGER (même esprit que getOrgActivitySummary).
export async function getWorkloadByMember(organisationId: string, limit = 8): Promise<MemberWorkload[]> {
    const users = await prisma.user.findMany({
        where: { organisationId },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            _count: {
                select: {
                    tasks: { where: { status: { notIn: [TaskStatus.DONE, TaskStatus.CANCELLED] } } },
                },
            },
        },
    })

    return users
        .map((u) => ({
            userId: u.id,
            name: `${u.firstName} ${u.lastName}`,
            activeTaskCount: u._count.tasks,
        }))
        .filter((u) => u.activeTaskCount > 0)
        .sort((a, b) => b.activeTaskCount - a.activeTaskCount)
        .slice(0, limit)
}
