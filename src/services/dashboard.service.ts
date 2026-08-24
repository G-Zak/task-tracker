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
const CLOSED_TASK_STATUSES: TaskStatus[] = [TaskStatus.DONE, TaskStatus.CANCELLED]

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
