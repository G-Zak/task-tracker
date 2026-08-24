import { prisma } from '@/src/lib/prisma'
import { Prisma } from '@/generated/client'
import { ProjectStatus, TaskStatus } from '@/generated/enums'
import { taskStatusOptions } from '@/src/lib/labels'

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
