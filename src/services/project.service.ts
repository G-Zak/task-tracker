import {prisma} from '@/src/lib/prisma'
import type { ProjectStatus } from '@/generated/enums'

interface FilterParams{
    searchQuery?: string
    status?: ProjectStatus
    clientId?: string
    page?: number
    pageSize?: number
}

export async function getFilteredProjects(organizationId: string, filters: FilterParams){
    
    const {searchQuery = '', status, clientId, page = 1, pageSize = 10} = filters

    const whereClause: any = {
        organisationId: organizationId,
    }

    if (searchQuery) {
        whereClause.name = {
            contains: searchQuery,
            mode: 'insensitive',
        }
    }

    if (status) {
        whereClause.status = status
    }

    if (clientId) {
        whereClause.clientId = clientId
    }

    const totalProjects = await prisma.project.count({
        where: whereClause,
    })
    
    const projects = await prisma.project.findMany({
        where: whereClause,
        include: {
            client: { select: { id: true, name: true } },
            members: { select: { id: true, firstName: true, lastName: true } },
            tasks: { select: { id: true, status: true } },
        },
        orderBy: { startDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
    })


    const totalPages = Math.ceil(totalProjects / pageSize)

    return {
        projects,
        pagination: {
            current: page,
            total: totalPages,
            count: totalProjects,
            perPage: pageSize,
        },
    }
}