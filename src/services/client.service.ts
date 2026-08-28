import { prisma } from '@/src/lib/prisma'
import { ProjectStatus } from '@/generated/enums'
import { ACTIVE_PROJECT_STATUSES } from '@/src/services/dashboard.service'

export interface ClientSummary {
    id: string
    name: string
    email: string | null
    phone: string | null
    projectCount: number
    activeProjectCount: number
    completedProjectCount: number
    overdueProjectCount: number
}

export interface ClientProjectSummary {
    id: string
    name: string
    status: ProjectStatus
    startDate: Date | null
    endDate: Date | null
    isOverdue: boolean
    taskCount: number
}

export interface ClientDetail {
    id: string
    name: string
    email: string | null
    phone: string | null
    projects: ClientProjectSummary[]
    activeProjectCount: number
    completedProjectCount: number
    nextDeadline: { projectId: string; projectName: string; endDate: Date } | null
    totalTimeSpentMs: number
}

// Un projet "en retard" au sens client : sa date de fin est dépassée sans qu'il soit
// terminé/annulé — même logique que "tâche en retard" côté dashboard (US-027), transposée
// au seul champ de délai que porte Project (endDate). Exportée : réutilisée telle quelle par
// les rapports IA (US-043) plutôt que redéfinie une deuxième fois.
export function isProjectOverdue(status: ProjectStatus, endDate: Date | null, now: Date): boolean {
    return !!endDate && endDate < now && status !== ProjectStatus.COMPLETED && status !== ProjectStatus.CANCELLED
}

export async function getClientSummaries(organisationId: string, searchQuery?: string): Promise<ClientSummary[]> {
    const clients = await prisma.client.findMany({
        where: {
            organisationId,
            ...(searchQuery
                ? {
                      OR: [
                          { name: { contains: searchQuery, mode: 'insensitive' } },
                          { email: { contains: searchQuery, mode: 'insensitive' } },
                      ],
                  }
                : {}),
        },
        include: { projects: { select: { status: true, endDate: true } } },
        orderBy: { name: 'asc' },
    })

    const now = new Date()

    return clients.map((client) => {
        const activeProjectCount = client.projects.filter((project) => ACTIVE_PROJECT_STATUSES.includes(project.status)).length
        const completedProjectCount = client.projects.filter((project) => project.status === ProjectStatus.COMPLETED).length
        const overdueProjectCount = client.projects.filter((project) => isProjectOverdue(project.status, project.endDate, now)).length

        return {
            id: client.id,
            name: client.name,
            email: client.email,
            phone: client.phone,
            projectCount: client.projects.length,
            activeProjectCount,
            completedProjectCount,
            overdueProjectCount,
        }
    })
}

export async function getClientDetail(clientId: string, organisationId: string): Promise<ClientDetail | null> {
    const client = await prisma.client.findFirst({
        where: { id: clientId, organisationId },
        include: {
            projects: {
                include: { tasks: { select: { startedAt: true, approvedAt: true } } },
                orderBy: { name: 'asc' },
            },
        },
    })
    if (!client) return null

    const now = new Date()

    const projects: ClientProjectSummary[] = client.projects.map((project) => ({
        id: project.id,
        name: project.name,
        status: project.status,
        startDate: project.startDate,
        endDate: project.endDate,
        isOverdue: isProjectOverdue(project.status, project.endDate, now),
        taskCount: project.tasks.length,
    }))

    const activeProjectCount = projects.filter((project) => ACTIVE_PROJECT_STATUSES.includes(project.status)).length
    const completedProjectCount = projects.filter((project) => project.status === ProjectStatus.COMPLETED).length

    // Prochaine échéance : le endDate le plus proche parmi les projets non terminés/annulés,
    // dans le futur — la deadline "compte client" est celle d'un projet, pas d'une tâche
    // individuelle (trop granulaire pour une vue de compte).
    const upcoming = projects
        .filter((project) => project.endDate && project.endDate >= now && project.status !== ProjectStatus.COMPLETED && project.status !== ProjectStatus.CANCELLED)
        .sort((a, b) => a.endDate!.getTime() - b.endDate!.getTime())

    const nextDeadline = upcoming[0]
        ? { projectId: upcoming[0].id, projectName: upcoming[0].name, endDate: upcoming[0].endDate! }
        : null

    // Temps total passé : somme des durées (startedAt → approvedAt ou maintenant) de toutes
    // les tâches démarrées sur tous les projets de ce client — même calcul que US-032, agrégé
    // au niveau client plutôt que par utilisateur/projet.
    let totalTimeSpentMs = 0
    for (const project of client.projects) {
        for (const task of project.tasks) {
            if (!task.startedAt) continue
            const end = task.approvedAt ?? now
            totalTimeSpentMs += Math.max(0, end.getTime() - task.startedAt.getTime())
        }
    }

    return {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        projects,
        activeProjectCount,
        completedProjectCount,
        nextDeadline,
        totalTimeSpentMs,
    }
}
