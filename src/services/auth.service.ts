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

    const {passwordHash, ...userWithoutPassword} = user

    return userWithoutPassword

}