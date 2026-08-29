import { prisma } from '@/src/lib/prisma'
import type { Role, TaskPriority, TaskStatus } from '@/generated/enums'
import { CLOSED_TASK_STATUSES } from '@/src/services/dashboard.service'

export type TeamStatus = 'overdue' | 'active' | 'idle' | 'empty'

export interface TeamMemberSummary {
    id: string
    firstName: string
    lastName: string
    role: Role
}

export interface TeamSummary {
    id: string
    name: string
    description: string | null
    leader: { id: string; firstName: string; lastName: string } | null
    members: { id: string; firstName: string; lastName: string }[]
    activeTaskCount: number
    overdueTaskCount: number
    status: TeamStatus
}

export interface TeamDetailTask {
    id: string
    title: string
    status: TaskStatus
    priority: TaskPriority
    dueDate: Date | null
    project: { id: string; name: string } | null
    assignees: { id: string; firstName: string; lastName: string }[]
}

export interface TeamDetail {
    id: string
    name: string
    description: string | null
    leader: TeamMemberSummary | null
    members: TeamMemberSummary[]
    tasks: TeamDetailTask[]
}

// "Statut" n'est pas un champ stocké sur Team (contrairement à Project) : il n'a de sens que
// dérivé de la charge réelle, cohérent avec l'objectif de la story ("évaluer la charge de
// chaque équipe"). Priorité : une équipe avec au moins une tâche en retard est "overdue" même
// si elle a aussi des tâches à jour — le signal le plus actionnable l'emporte.
function computeTeamStatus(memberCount: number, activeTaskCount: number, overdueTaskCount: number): TeamStatus {
    if (memberCount === 0) return 'empty'
    if (overdueTaskCount > 0) return 'overdue'
    if (activeTaskCount > 0) return 'active'
    return 'idle'
}

export async function getTeamSummaries(organisationId: string): Promise<TeamSummary[]> {
    const teams = await prisma.team.findMany({
        where: { organisationId },
        include: {
            leader: { select: { id: true, firstName: true, lastName: true } },
            members: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { name: 'asc' },
    })

    const now = new Date()

    // Une requête pour toute l'organisation plutôt que 2 count() par équipe (2N requêtes pour N
    // équipes) — même pattern que statistics.service.ts (US-037) : les tâches actives sont
    // chargées une fois, puis réparties par équipe en mémoire. Un `some()` par tâche/équipe pour
    // préserver la sémantique d'origine (une tâche compte une fois par équipe dès qu'un de ses
    // assignés en fait partie, jamais une fois par assigné).
    const activeTasks = await prisma.task.findMany({
        where: { organisationId, status: { notIn: CLOSED_TASK_STATUSES } },
        select: { dueDate: true, assignees: { select: { id: true } } },
    })

    return teams.map((team) => {
        const memberIds = new Set(team.members.map((member) => member.id))

        let activeTaskCount = 0
        let overdueTaskCount = 0
        for (const task of activeTasks) {
            if (!task.assignees.some((assignee) => memberIds.has(assignee.id))) continue
            activeTaskCount += 1
            if (task.dueDate && task.dueDate < now) overdueTaskCount += 1
        }

        return {
            id: team.id,
            name: team.name,
            description: team.description,
            leader: team.leader,
            members: team.members,
            activeTaskCount,
            overdueTaskCount,
            status: computeTeamStatus(memberIds.size, activeTaskCount, overdueTaskCount),
        }
    })
}

export async function getTeamDetail(teamId: string, organisationId: string): Promise<TeamDetail | null> {
    const team = await prisma.team.findFirst({
        where: { id: teamId, organisationId },
        include: {
            leader: { select: { id: true, firstName: true, lastName: true, role: true } },
            members: { select: { id: true, firstName: true, lastName: true, role: true } },
        },
    })
    if (!team) return null

    const memberIds = team.members.map((member) => member.id)

    const tasks =
        memberIds.length === 0
            ? []
            : await prisma.task.findMany({
                  where: { assignees: { some: { id: { in: memberIds } } } },
                  include: {
                      project: { select: { id: true, name: true } },
                      assignees: { select: { id: true, firstName: true, lastName: true } },
                  },
                  orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
              })

    return {
        id: team.id,
        name: team.name,
        description: team.description,
        leader: team.leader,
        members: team.members,
        tasks,
    }
}
