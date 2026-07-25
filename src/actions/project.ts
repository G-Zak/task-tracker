'use server'

import { Role } from "@/src/generated/client"
import { authorizeRole } from "@/src/lib/rbac" // Utilise authorizeRole partout !
import { prisma } from "@/lib/prisma"
import { projectSchema, ProjectFormValues } from "@/src/validations/project.schema"
import { revalidatePath } from 'next/cache'

export async function createProject(data: ProjectFormValues, orgName: string) {
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

        revalidatePath(`/org/${orgName}/projects`)

        return { success: true, project: newProject }
    } catch (error: any) {
        // Utilise error.message plutôt que error brut pour éviter les soucis de sérialisation
        return { error: error.message || 'Une erreur est survenue lors de la création du projet.' } 
    }
}


export async function updateProject(projectId: string, data: ProjectFormValues, orgName: string) {
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

        if (!existing || existing.organisationId !== user.organisationId) {
            throw new Error('Projet introuvable ou accès refusé')
        }

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

        revalidatePath(`/org/${orgName}/projects/${projectId}`)
        revalidatePath(`/org/${orgName}/projects`)

        return { success: true, project: updated }
    } catch (error: any) {
        return { error: error.message || 'Une erreur est survenue lors de la modification du projet.' }
    }
}


export async function addMemberToProject(projectId: string, userId: string, orgName: string) {
    try {
        const user = await authorizeRole(Role.PROJECT_MANAGER)

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { members: true }
        })

        if (!project || project.organisationId !== user.organisationId) {
            throw new Error('Projet introuvable ou accès refusé')
        }

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

        revalidatePath(`/org/${orgName}/projects/${projectId}`)

        return { success: true }
    } catch (error: any) {
        return { error: error.message || "Une erreur est survenue lors de l'ajout du membre." }
    }
}


export async function removeMemberFromProject(projectId: string, userId: string, orgName: string) {
    try {
        const user = await authorizeRole(Role.PROJECT_MANAGER)

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { members: true }
        })

        if (!project || project.organisationId !== user.organisationId) {
            throw new Error('Projet introuvable ou accès refusé')
        }

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

        revalidatePath(`/org/${orgName}/projects/${projectId}`)

        return { success: true }
    } catch (error: any) {
        return { error: error.message || "Une erreur est survenue lors de la suppression du membre." }
    }
}

export async function deleteProject(projectId: string, orgName: string) {
    try {
        const user = await authorizeRole(Role.PROJECT_MANAGER) 

        const project = await prisma.project.findUnique({
            where: { id: projectId }
        })

        if (!project || project.organisationId !== user.organisationId) {
            throw new Error('Projet introuvable ou accès refusé')
        }

        await prisma.project.delete({
            where: { id: projectId },
        })

        revalidatePath(`/org/${orgName}/projects`)

        return { success: true }
    } catch (error: any) {
        return { error: error.message || 'Une erreur est survenue lors de la suppression du projet.' }
    }
}