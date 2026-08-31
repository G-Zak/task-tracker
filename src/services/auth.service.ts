import { prisma } from '@/lib/prisma'
import { Role } from '@/generated/enums'
import * as bcrypt from 'bcrypt'

export const SELF_SERVICE_ROLES = [Role.USER, Role.VIEWER] as const

export interface RegisterAccountInput {
    firstName: string
    lastName: string
    email: string
    password: string
    role: (typeof SELF_SERVICE_ROLES)[number]
}

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

    if (!user.isActive) {
        throw new Error('Ce compte a été désactivé. Contactez un administrateur.')
    }

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