import { prisma } from '@/lib/prisma'
import * as bcrypt from 'bcrypt'



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

    const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
    })

    const {passwordHash, ...userWithoutPassword} = updatedUser

    return userWithoutPassword

}