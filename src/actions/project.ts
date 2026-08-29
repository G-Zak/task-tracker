'use server'

import { Role } from "@/src/generated/client"
import { authorizeRole } from "@/src/lib/rbac" // Utilise authorizeRole partout !
import { isOwnedByOrg, ownershipErrorMessage } from "@/src/lib/ownership"
import { catchActionError } from "@/src/lib/action-error"
import { prisma } from "@/lib/prisma"
import { projectSchema, ProjectFormValues } from "@/src/validations/project.schema"
import { indexProject, removeFromIndex } from "@/src/services/rag.service"
import { revalidatePath } from 'next/cache'
import { after } from 'next/server'

export async function createProject(data: ProjectFormValues, orgSlug: string) {
    try {
        // authorizeRole vérifie déjà si l'user est connecté ET s'il est au moins PM
        const user = await authorizeRole(Role.PROJECT_MANAGER)

        const parsedData = projectSchema.safeParse(data)
        if (!parsedData.success) {
            return { error: 'Données invalides' }
        }

        const { name, description, startDate, endDate, status, clientId, memberIds } = parsedData.data
        
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

        revalidatePath(`/org/${orgSlug}/projects`)
        after(() => indexProject(newProject.id))

        return { success: true, project: newProject }
    } catch (error) {
        return catchActionError(error, 'Une erreur est survenue lors de la création du projet.')
    }
}


export async function updateProject(projectId: string, data: ProjectFormValues, orgSlug: string) {
    try {
        const user = await authorizeRole(Role.PROJECT_MANAGER)

        const parsedData = projectSchema.safeParse(data)
        if (!parsedData.success) {
            return { error: 'Données invalides' }
        }

        const { name, description, startDate, endDate, status, clientId, memberIds } = parsedData.data

        const existing = await prisma.project.findUnique({
            where: { id: projectId },
        })

        if (!isOwnedByOrg(existing, user.organisationId)) throw new Error(ownershipErrorMessage('Projet'))

        const updated = await prisma.project.update({
            where: { id: projectId },
            data: {
                name,
                description,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                status,
                clientId,
                members: {
                    set: memberIds.map((memberId) => ({ id: memberId })),
                },
            },
        })

        revalidatePath(`/org/${orgSlug}/projects/${projectId}`)
        revalidatePath(`/org/${orgSlug}/projects`)
        after(() => indexProject(projectId))

        return { success: true, project: updated }
    } catch (error) {
        return catchActionError(error, 'Une erreur est survenue lors de la modification du projet.')
    }
}


export async function addMemberToProject(projectId: string, userId: string, orgSlug: string) {
    try {
        const user = await authorizeRole(Role.PROJECT_MANAGER)

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { members: true }
        })

        if (!isOwnedByOrg(project, user.organisationId)) throw new Error(ownershipErrorMessage('Projet'))

        const isAlreadyMember = project.members.some(m => m.id === userId)
        if (isAlreadyMember) {
            throw new Error("L'utilisateur est déjà membre de ce projet")
        }

        await prisma.project.update({
            where: { id: projectId },
            data: {
                members: {
                    connect: { id: userId }
                }
            }
        })

        revalidatePath(`/org/${orgSlug}/projects/${projectId}`)

        return { success: true }
    } catch (error) {
        return catchActionError(error, "Une erreur est survenue lors de l'ajout du membre.")
    }
}


export async function removeMemberFromProject(projectId: string, userId: string, orgSlug: string) {
    try {
        const user = await authorizeRole(Role.PROJECT_MANAGER)

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { members: true }
        })

        if (!isOwnedByOrg(project, user.organisationId)) throw new Error(ownershipErrorMessage('Projet'))

        const isMember = project.members.some(m => m.id === userId)
        if (!isMember) {
            throw new Error("L'utilisateur n'est pas membre de ce projet")
        }

        await prisma.project.update({
            where: { id: projectId },
            data: {
                members: {
                    disconnect: { id: userId }
                }
            }
        })

        revalidatePath(`/org/${orgSlug}/projects/${projectId}`)

        return { success: true }
    } catch (error) {
        return catchActionError(error, "Une erreur est survenue lors de la suppression du membre.")
    }
}

export async function deleteProject(projectId: string, orgSlug: string) {
    try {
        const user = await authorizeRole(Role.PROJECT_MANAGER) 

        const project = await prisma.project.findUnique({
            where: { id: projectId }
        })

        if (!isOwnedByOrg(project, user.organisationId)) throw new Error(ownershipErrorMessage('Projet'))

        await prisma.project.delete({
            where: { id: projectId },
        })

        revalidatePath(`/org/${orgSlug}/projects`)
        after(() => removeFromIndex('PROJECT', projectId))

        return { success: true }
    } catch (error) {
        return catchActionError(error, 'Une erreur est survenue lors de la suppression du projet.')
    }
}