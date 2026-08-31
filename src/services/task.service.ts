import { prisma } from '@/src/lib/prisma'
import type { TaskStatus, TaskPriority } from '@/generated/enums'

interface TaskFilterParams {
    searchQuery?: string
    status?: TaskStatus
    priority?: TaskPriority
    projectId?: string
    page?: number
    pageSize?: number
    restrictToUserId?: string
}

export async function getFilteredTasks(organisationId: string, filters: TaskFilterParams) {
    const { searchQuery = '', status, priority, projectId, page = 1, pageSize = 10, restrictToUserId } = filters

    const whereClause: any = {
        organisationId,
    }

    if (searchQuery) {
        whereClause.title = {
            contains: searchQuery,
            mode: 'insensitive',
        }
    }

    if (status) {
        whereClause.status = status
    }

    if (priority) {
        whereClause.priority = priority
    }

    if (projectId) {
        whereClause.projectId = projectId
    }

    if (restrictToUserId) {
        whereClause.OR = [
            { assignees: { some: { id: restrictToUserId } } },
            { project: { members: { some: { id: restrictToUserId } } } },
        ]
    }

    const [totalTasks, tasks] = await Promise.all([
        prisma.task.count({ where: whereClause }),
        prisma.task.findMany({
            where: whereClause,
            include: {
                project: { select: { id: true, name: true } },
                taskType: { select: { id: true, name: true, color: true } },
                assignees: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
    ])

    const totalPages = Math.max(1, Math.ceil(totalTasks / pageSize))

    return {
        tasks,
        pagination: {
            current: page,
            total: totalPages,
            count: totalTasks,
            perPage: pageSize,
        },
    }
}
