'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUserSession, canAccessProject } from '@/src/lib/rbac'
import { noteSchema, NoteFormValues } from '@/src/validations/note.schema'
import { revalidatePath } from 'next/cache'

export async function createProjectNote(projectId: string, data: NoteFormValues, orgSlug: string) {
    try {
        const user = await getCurrentUserSession()
        if (!user) {
            throw new Error('Non authentifié')
        }

        const parsedData = noteSchema.safeParse(data)
        if (!parsedData.success) {
            return { error: parsedData.error.issues[0]?.message || 'Données invalides' }
        }

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { members: { select: { id: true } } },
        })

        if (!project || project.organisationId !== user.organisationId) {
            throw new Error('Projet introuvable ou accès refusé')
        }

        if (!canAccessProject(user, project.members.map((m) => m.id))) {
            throw new Error("Vous n'êtes pas membre de ce projet")
        }

        await prisma.projectNote.create({
            data: {
                content: parsedData.data.content,
                projectId,
                authorId: user.id,
            },
        })

        revalidatePath(`/org/${orgSlug}/projects/${projectId}`)

        return { success: true }
    } catch (error: any) {
        return { error: error.message || "Une erreur est survenue lors de l'envoi du message." }
    }
}
