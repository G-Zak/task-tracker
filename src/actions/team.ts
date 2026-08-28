'use server'

import { prisma } from '@/lib/prisma'
import { Role } from '@/src/generated/client'
import { authorizeRole } from '@/src/lib/rbac'
import { teamSchema, TeamFormValues } from '@/src/validations/team.schema'
import { revalidatePath } from 'next/cache'

// Un chef d'équipe désigné qui ne figurerait pas dans la liste des membres cochés serait
// une incohérence silencieuse (une équipe dirigée par quelqu'un qui n'en fait pas partie) :
// on le rattache donc automatiquement plutôt que de rejeter le formulaire.
function resolveMemberIds(memberIds: string[] | undefined, leaderId?: string): string[] {
    const ids = memberIds ?? []
    if (!leaderId) return ids
    return Array.from(new Set([...ids, leaderId]))
}

export async function createTeam(data: TeamFormValues, orgSlug: string) {
    try {
        const user = await authorizeRole(Role.PROJECT_MANAGER)

        const parsed = teamSchema.safeParse(data)
        if (!parsed.success) {
            return { error: parsed.error.issues[0]?.message || 'Données invalides.' }
        }

        const { name, description, leaderId, memberIds } = parsed.data

        await prisma.team.create({
            data: {
                name,
                description: description || null,
                organisationId: user.organisationId,
                leaderId: leaderId || null,
                members: { connect: resolveMemberIds(memberIds, leaderId).map((id) => ({ id })) },
            },
        })

        revalidatePath(`/org/${orgSlug}/teams`)
        return { success: true }
    } catch (error: any) {
        return { error: error.message || "Une erreur est survenue lors de la création de l'équipe." }
    }
}

export async function updateTeam(teamId: string, data: TeamFormValues, orgSlug: string) {
    try {
        const user = await authorizeRole(Role.PROJECT_MANAGER)

        const parsed = teamSchema.safeParse(data)
        if (!parsed.success) {
            return { error: parsed.error.issues[0]?.message || 'Données invalides.' }
        }

        const existing = await prisma.team.findUnique({ where: { id: teamId } })
        if (!existing || existing.organisationId !== user.organisationId) {
            throw new Error('Équipe introuvable ou accès refusé')
        }

        const { name, description, leaderId, memberIds } = parsed.data

        await prisma.team.update({
            where: { id: teamId },
            data: {
                name,
                description: description || null,
                leaderId: leaderId || null,
                members: { set: resolveMemberIds(memberIds, leaderId).map((id) => ({ id })) },
            },
        })

        revalidatePath(`/org/${orgSlug}/teams`)
        return { success: true }
    } catch (error: any) {
        return { error: error.message || "Une erreur est survenue lors de la modification de l'équipe." }
    }
}

export async function deleteTeam(teamId: string, orgSlug: string) {
    try {
        const user = await authorizeRole(Role.PROJECT_MANAGER)

        const existing = await prisma.team.findUnique({ where: { id: teamId } })
        if (!existing || existing.organisationId !== user.organisationId) {
            throw new Error('Équipe introuvable ou accès refusé')
        }

        await prisma.team.delete({ where: { id: teamId } })

        revalidatePath(`/org/${orgSlug}/teams`)
        return { success: true }
    } catch (error: any) {
        return { error: error.message || "Une erreur est survenue lors de la suppression de l'équipe." }
    }
}
