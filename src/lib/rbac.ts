import {cookies} from 'next/headers'
import { Role } from '@/generated/client'

const ROLE_HIERARCHY: Record<Role, number> = {
    [Role.ADMIN]: 4,
    [Role.PROJECT_MANAGER]: 3,
    [Role.TEAM_LEADER]: 2,
    [Role.USER]: 1,
    [Role.VIEWER]: 0,
}

export async function getCurrentUserSession(){
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session_user')

    if(!sessionCookie) return null

    try{
        return JSON.parse(sessionCookie.value)
    }catch{
        return null
    }
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