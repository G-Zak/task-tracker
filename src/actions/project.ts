'use server'

import { Role } from "@/generated/client"
import { authorizeRole } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { projectSchema, ProjectFormValues } from "@/validations/project.schema"
import {revalidatePath} from 'next/cache'

export async function createProject(data: ProjectFormValues, orgName: string){
    try {
        const user = await authorizeRole(Role.PROJECT_MANAGER)

        const parsedData = projectSchema.safeParse(data)
        if (!parsedData.success) {
            return { error: 'Données invalides'}
        }

        const {name, description, startDate, endDate, status, clientId, memberIds} = parsedData.data
        
        const newProject = await prisma.project.create({
            data: {
                name,
                description,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                status,
                clientId,
                organisationId: user.organisationId,
                members: {
                    connect: memberIds.map((memberId) => ({ id: memberId })),
                },
            },
        })


        revalidatePath(`/org/${orgName}/projects`)

        return { success: true, project: newProject }
    } catch (error: any) {
        return { error: error || 'Une erreur est survenue lors de la création du projet.' }
    }
}


