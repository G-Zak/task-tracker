'use server'

import crypto from 'node:crypto'
import * as bcrypt from 'bcrypt'

import { prisma } from '@/lib/prisma'
import { Role } from '@/src/generated/client'
import { authorizeRole } from '@/src/lib/rbac'
import { inviteUserSchema, InviteUserFormValues } from '@/src/validations/user.schema'
import { revalidatePath } from 'next/cache'

function generateTemporaryPassword(): string {
    return crypto.randomBytes(9).toString('base64url')
}

// Invitation "minimale" (US-039) : pas d'envoi d'e-mail réel (explicitement hors périmètre de
// cette story), pas de lien de token à activer — le compte est créé directement avec un mot de
// passe temporaire généré, affiché une seule fois à l'ADMIN pour transmission manuelle. Même
// logique que les comptes de démonstration du seed (mot de passe partagé, communiqué hors app).
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
            },
        })

        revalidatePath(`/org/${orgSlug}/users`)

        return { success: true, temporaryPassword }
    } catch (error: any) {
        return { error: error.message || "Une erreur est survenue lors de l'invitation." }
    }
}

export async function updateUserRole(userId: string, role: Role, orgSlug: string) {
    try {
        const admin = await authorizeRole(Role.ADMIN)

        if (userId === admin.id) {
            return { error: 'Vous ne pouvez pas modifier votre propre rôle.' }
        }

        const target = await prisma.user.findUnique({ where: { id: userId } })
        if (!target || target.organisationId !== admin.organisationId) {
            return { error: 'Utilisateur introuvable ou accès refusé.' }
        }

        await prisma.user.update({ where: { id: userId }, data: { role } })

        revalidatePath(`/org/${orgSlug}/users`)

        return { success: true }
    } catch (error: any) {
        return { error: error.message || 'Une erreur est survenue lors de la modification du rôle.' }
    }
}

export async function setUserActive(userId: string, isActive: boolean, orgSlug: string) {
    try {
        const admin = await authorizeRole(Role.ADMIN)

        if (userId === admin.id) {
            return { error: 'Vous ne pouvez pas désactiver votre propre compte.' }
        }

        const target = await prisma.user.findUnique({ where: { id: userId } })
        if (!target || target.organisationId !== admin.organisationId) {
            return { error: 'Utilisateur introuvable ou accès refusé.' }
        }

        await prisma.user.update({ where: { id: userId }, data: { isActive } })

        revalidatePath(`/org/${orgSlug}/users`)

        return { success: true }
    } catch (error: any) {
        return { error: error.message || "Une erreur est survenue lors de la mise à jour du compte." }
    }
}
