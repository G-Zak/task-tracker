'use server'

import crypto from 'node:crypto'
import * as bcrypt from 'bcrypt'

import { prisma } from '@/lib/prisma'
import { Role } from '@/src/generated/client'
import { authorizeRole } from '@/src/lib/rbac'
import { isOwnedByOrg, ownershipErrorMessage } from '@/src/lib/ownership'
import { catchActionError } from '@/src/lib/action-error'
import { inviteUserSchema, InviteUserFormValues } from '@/src/validations/user.schema'
import { revalidatePath } from 'next/cache'

function generateTemporaryPassword(): string {
    return crypto.randomBytes(9).toString('base64url')
}

export async function inviteUser(data: InviteUserFormValues, orgSlug: string) {
    try {
        const admin = await authorizeRole(Role.ADMIN)

        const parsed = inviteUserSchema.safeParse(data)
        if (!parsed.success) {
            return { error: parsed.error.issues[0]?.message || 'Données invalides.' }
        }

        const { firstName, lastName, email, role } = parsed.data

        const existing = await prisma.user.findUnique({ where: { email } })
        if (existing) {
            return { error: 'Un compte existe déjà avec cette adresse e-mail.' }
        }

        const temporaryPassword = generateTemporaryPassword()
        const passwordHash = await bcrypt.hash(temporaryPassword, 10)

        await prisma.user.create({
            data: {
                firstName,
                lastName,
                email,
                role,
                passwordHash,
                organisationId: admin.organisationId,
                isApproved: true, // créé directement par un ADMIN — pas de passage par la file d'approbation
            },
        })

        revalidatePath(`/org/${orgSlug}/users`)

        return { success: true, temporaryPassword }
    } catch (error) {
        return catchActionError(error, "Une erreur est survenue lors de l'invitation.")
    }
}

export async function updateUserRole(userId: string, role: Role, orgSlug: string) {
    try {
        const admin = await authorizeRole(Role.ADMIN)

        if (userId === admin.id) {
            return { error: 'Vous ne pouvez pas modifier votre propre rôle.' }
        }

        const target = await prisma.user.findUnique({ where: { id: userId } })
        if (!isOwnedByOrg(target, admin.organisationId)) return { error: ownershipErrorMessage('Utilisateur') }

        await prisma.user.update({ where: { id: userId }, data: { role } })

        revalidatePath(`/org/${orgSlug}/users`)

        return { success: true }
    } catch (error) {
        return catchActionError(error, 'Une erreur est survenue lors de la modification du rôle.')
    }
}

export async function setUserActive(userId: string, isActive: boolean, orgSlug: string) {
    try {
        const admin = await authorizeRole(Role.ADMIN)

        if (userId === admin.id) {
            return { error: 'Vous ne pouvez pas désactiver votre propre compte.' }
        }

        const target = await prisma.user.findUnique({ where: { id: userId } })
        if (!isOwnedByOrg(target, admin.organisationId)) return { error: ownershipErrorMessage('Utilisateur') }

        await prisma.user.update({ where: { id: userId }, data: { isActive } })

        revalidatePath(`/org/${orgSlug}/users`)

        return { success: true }
    } catch (error) {
        return catchActionError(error, "Une erreur est survenue lors de la mise à jour du compte.")
    }
}

export async function approveUser(userId: string, orgSlug: string) {
    try {
        const admin = await authorizeRole(Role.ADMIN)

        const target = await prisma.user.findUnique({ where: { id: userId } })
        if (!isOwnedByOrg(target, admin.organisationId)) return { error: ownershipErrorMessage('Utilisateur') }

        await prisma.user.update({ where: { id: userId }, data: { isApproved: true } })

        revalidatePath(`/org/${orgSlug}/users`)

        return { success: true }
    } catch (error) {
        return catchActionError(error, "Une erreur est survenue lors de l'approbation du compte.")
    }
}

export async function rejectUser(userId: string, orgSlug: string) {
    try {
        const admin = await authorizeRole(Role.ADMIN)

        const target = await prisma.user.findUnique({ where: { id: userId } })
        if (!isOwnedByOrg(target, admin.organisationId)) return { error: ownershipErrorMessage('Utilisateur') }
        if (target.isApproved) {
            return { error: 'Ce compte est déjà approuvé.' }
        }

        await prisma.user.delete({ where: { id: userId } })

        revalidatePath(`/org/${orgSlug}/users`)

        return { success: true }
    } catch (error) {
        return catchActionError(error, "Une erreur est survenue lors du rejet du compte.")
    }
}
