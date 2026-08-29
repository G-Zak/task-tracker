import { prisma } from '@/lib/prisma'
import { Role } from '@/generated/enums'
import * as bcrypt from 'bcrypt'

// Rôles ouverts à l'inscription libre — un compte ADMIN/PROJECT_MANAGER/TEAM_LEADER ne peut être
// créé que par un ADMIN via inviteUser (src/actions/user.ts), jamais via ce formulaire public.
export const SELF_SERVICE_ROLES = [Role.USER, Role.VIEWER] as const

export interface RegisterAccountInput {
    firstName: string
    lastName: string
    email: string
    password: string
    role: (typeof SELF_SERVICE_ROLES)[number]
}

// Inscription libre : le compte est créé immédiatement mais `isApproved: false` l'empêche de se
// connecter (voir validateCredentials ci-dessous) tant qu'un ADMIN ne l'a pas approuvé depuis la
// page Utilisateurs. L'app n'a qu'une seule organisation en pratique (même hypothèse déjà faite
// par loginAction/proxy.ts) — le nouveau compte y est rattaché directement.
export async function registerAccount(input: RegisterAccountInput) {
    const email = input.email.toLowerCase().trim()

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
        throw new Error('Un compte existe déjà avec cette adresse e-mail.')
    }

    const organisation = await prisma.organisation.findFirst()
    if (!organisation) {
        throw new Error("Aucune organisation n'est configurée. Contactez un administrateur.")
    }

    const passwordHash = await bcrypt.hash(input.password, 10)

    await prisma.user.create({
        data: {
            firstName: input.firstName,
            lastName: input.lastName,
            email,
            passwordHash,
            role: input.role,
            organisationId: organisation.id,
            isApproved: false,
        },
    })
}

export async function validateCredentials(email: string, passwordPlain: string){
    const user = await prisma.user.findUnique({
        where:{email},
    })

    if(!user){
        return null
    }

    const isPasswordValid = await bcrypt.compare(passwordPlain, user.passwordHash)

    if(!isPasswordValid){
        return null
    }

    // Vérifié après le mot de passe, pas avant : un identifiant/mot de passe correct sur un
    // compte désactivé doit produire un message explicite plutôt que "identifiants incorrects".
    if (!user.isActive) {
        throw new Error('Ce compte a été désactivé. Contactez un administrateur.')
    }

    // Comptes issus de l'inscription libre (registerAccount) : bloqués tant qu'un ADMIN ne les a
    // pas approuvés (voir approveUser/rejectUser dans src/actions/user.ts). Les comptes créés par
    // un ADMIN via inviteUser sont approuvés d'office.
    if (!user.isApproved) {
        throw new Error("Votre compte est en attente d'approbation par un administrateur.")
    }

    const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
    })

    const {passwordHash, ...userWithoutPassword} = updatedUser

    return userWithoutPassword

}