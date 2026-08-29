import {cookies} from 'next/headers'
import { cache } from 'react'
import { Role } from '@/generated/client'
import { prisma } from '@/lib/prisma'
import { decodeSession } from '@/lib/session'

const ROLE_HIERARCHY: Record<Role, number> = {
    [Role.ADMIN]: 4,
    [Role.PROJECT_MANAGER]: 3,
    [Role.TEAM_LEADER]: 2,
    [Role.USER]: 1,
    [Role.VIEWER]: 0,
}

// Un seul aller-retour DB par requête même si getCurrentUserSession() est appelé plusieurs fois
// dans le même arbre de rendu (layout + page, par exemple) — cache() de React dédoublonne par
// requête serveur, pas au-delà.
const fetchLiveUser = cache((userId: string) =>
    prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            organisationId: true,
            isActive: true,
            isApproved: true,
        },
    })
)

export async function getCurrentUserSession(){
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session_user')

    if(!sessionCookie) return null

    const payload = decodeSession(sessionCookie.value)
    if (!payload?.id) return null

    // Revérifié contre la base à chaque requête plutôt que de faire confiance au cookie : un
    // compte désactivé ou pas encore approuvé perd l'accès immédiatement, pas seulement à la
    // prochaine connexion (voir Application-Analysis-2026-08-28.md §1.2).
    const liveUser = await fetchLiveUser(payload.id)
    if (!liveUser || !liveUser.isActive || !liveUser.isApproved) return null

    const { isActive, isApproved, ...user } = liveUser
    return user
}

export function canAccessProject(user: { id: string; role: Role }, memberIds: string[]) {
    if (user.role === Role.ADMIN || user.role === Role.PROJECT_MANAGER) return true
    return memberIds.includes(user.id)
}

export async function authorizeRole(requiredRole: Role){
    const user = await getCurrentUserSession()
    if (!user || !user.role) {
        throw new Error('Non authentifié')
    }

    const userWeight = ROLE_HIERARCHY[user.role as Role] ?? 0
    const requiredWeight = ROLE_HIERARCHY[requiredRole]

    if (userWeight < requiredWeight) {
        throw new Error('Accès refusé: rôle insuffisant')
    }

    return user
}
