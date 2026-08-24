'use server'

import { cookies } from 'next/headers'
import * as bcrypt from 'bcrypt'
import { prisma } from '@/lib/prisma'
import { getCurrentUserSession } from '@/lib/rbac'
import { profileSchema, ProfileFormValues } from '@/src/validations/profile.schema'
import { revalidatePath } from 'next/cache'

export async function updateProfile(data: ProfileFormValues, orgSlug: string) {
    try {
        const session = await getCurrentUserSession()
        if (!session) {
            throw new Error('Non authentifié')
        }

        const parsed = profileSchema.safeParse(data)
        if (!parsed.success) {
            return { error: parsed.error.issues[0]?.message || 'Données invalides' }
        }

        const { firstName, lastName, email, currentPassword, newPassword } = parsed.data

        const user = await prisma.user.findUnique({ where: { id: session.id } })
        if (!user) {
            throw new Error('Utilisateur introuvable')
        }

        let newPasswordHash: string | undefined
        if (newPassword) {
            const isCurrentPasswordValid = await bcrypt.compare(currentPassword || '', user.passwordHash)
            if (!isCurrentPasswordValid) {
                return { error: 'Mot de passe actuel incorrect' }
            }
            const salt = await bcrypt.genSalt(10)
            newPasswordHash = await bcrypt.hash(newPassword, salt)
        }

        const updated = await prisma.user.update({
            where: { id: session.id },
            data: {
                firstName,
                lastName,
                email,
                ...(newPasswordHash ? { passwordHash: newPasswordHash } : {}),
            },
        })

        // Le cookie de session porte une copie de firstName/lastName/email/role (US-006) :
        // sans le rafraîchir ici, le reste de l'app (header, sidebar...) afficherait les
        // anciennes valeurs jusqu'à la prochaine connexion.
        const { passwordHash, ...userWithoutPassword } = updated
        const cookieStore = await cookies()
        cookieStore.set('session_user', JSON.stringify(userWithoutPassword), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24,
            sameSite: 'strict',
            path: '/',
        })

        revalidatePath(`/org/${orgSlug}/profile`)

        return { success: true }
    } catch (error: any) {
        if (error.code === 'P2002') {
            return { error: 'Cet e-mail est déjà utilisé par un autre compte.' }
        }
        return { error: error.message || 'Une erreur est survenue lors de la mise à jour du profil.' }
    }
}
