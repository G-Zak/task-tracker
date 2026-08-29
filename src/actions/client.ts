'use server'

import { prisma } from '@/lib/prisma'
import { Role } from '@/generated/client'
import { authorizeRole } from '@/lib/rbac'
import { isOwnedByOrg, ownershipErrorMessage } from '@/lib/ownership'
import { catchActionError } from '@/lib/action-error'
import { clientSchema, ClientFormValues } from '@/validations/client.schema'
import { revalidatePath } from 'next/cache'


                                        //Server Actions: upsert & delete

export async function upsertClient(data: ClientFormValues, orgSlug: string) {
    try {
        const user = await authorizeRole(Role.PROJECT_MANAGER)

        const parsedData = clientSchema.safeParse(data)
        if (!parsedData.success) {
            return { error: 'Données invalides.'} 
        }


        const { id, name, email } = parsedData.data

        if (id) {
            const existing = await prisma.client.findUnique({ where: { id } })
            if (!isOwnedByOrg(existing, user.organisationId)) return { error: ownershipErrorMessage('Client') }

            await prisma.client.update({
                where: {id},
                data: {name, email}
            })
            revalidatePath(`/org/${orgSlug}/clients/${id}`)
        } else {
            await prisma.client.create({
                data: {name: parsedData.data.name,
                        email: parsedData.data.email,
                        organisationId: user.organisationId}
            })
        }
         revalidatePath(`/org/${orgSlug}/clients`)
         return {success: true}
    } catch (error) {
        return catchActionError(error, "Une erreur est survenue lors de l'enregistrement du client.")
    }
}


export async function deleteClient(clientId: string, orgSlug: string) {
    try {
        const user = await authorizeRole(Role.PROJECT_MANAGER)

        const client = await prisma.client.findUnique({
            where: {id: clientId},
            include: {projects: true}
        })

        if (!isOwnedByOrg(client, user.organisationId)) return { error: ownershipErrorMessage('Client') }

        if (client.projects.length > 0){
            return { error: 'Impossible de supprimer un client qui a des projets associés.' }
        }
        
        await prisma.client.delete({
            where: { id: clientId }
        })

        revalidatePath(`/org/${orgSlug}/clients`)
        return {success: true}
    } catch (error) {
        return catchActionError(error, 'Une erreur est survenue lors de la suppression du client.')
    }
}