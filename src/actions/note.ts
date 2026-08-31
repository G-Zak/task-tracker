'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUserSession, canAccessProject } from '@/src/lib/rbac'
import { isOwnedByOrg, ownershipErrorMessage } from '@/src/lib/ownership'
import { catchActionError } from '@/src/lib/action-error'
import { noteSchema, NoteFormValues } from '@/src/validations/note.schema'
import { Role } from '@/generated/client'
import { indexProjectNote, removeFromIndex } from '@/src/services/rag.service'
import { revalidatePath } from 'next/cache'
import { after } from 'next/server'

async function notifyRealtime(projectId: string, type: 'note:created' | 'note:deleted') {
    try {
        const port = process.env.WS_PORT ?? '4001'
        await fetch(`http://localhost:${port}/broadcast`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'x-ws-broadcast-secret': process.env.WS_BROADCAST_SECRET ?? '',
            },
            body: JSON.stringify({ projectId, type }),
            signal: AbortSignal.timeout(1500),
        })
    } catch {}
}

export async function createProjectNote(projectId: string, data: NoteFormValues, orgSlug: string) {
    try {
        const user = await getCurrentUserSession()
        if (!user) {
            throw new Error('Non authentifié')
        }

        const parsedData = noteSchema.safeParse(data)
        if (!parsedData.success) {
            const message: string = parsedData.error.issues[0]?.message ?? 'Données invalides'
            return { error: message }
        }

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { members: { select: { id: true } } },
        })

        if (!isOwnedByOrg(project, user.organisationId)) throw new Error(ownershipErrorMessage('Projet'))

        if (!canAccessProject(user, project.members.map((m) => m.id))) {
            throw new Error("Vous n'êtes pas membre de ce projet")
        }

        const note = await prisma.projectNote.create({
            data: {
                content: parsedData.data.content,
                projectId,
                authorId: user.id,
            },
        })

        revalidatePath(`/org/${orgSlug}/projects/${projectId}`)
        await notifyRealtime(projectId, 'note:created')
        after(() => indexProjectNote(note.id))

        return { success: true }
    } catch (error) {
        return catchActionError(error, "Une erreur est survenue lors de l'envoi du message.")
    }
}

export async function deleteProjectNote(noteId: string, orgSlug: string) {
    try {
        const user = await getCurrentUserSession()
        if (!user) {
            throw new Error('Non authentifié')
        }

        const note = await prisma.projectNote.findUnique({
            where: { id: noteId },
            include: { project: true },
        })

        if (!note) throw new Error(ownershipErrorMessage('Message'))
        if (!isOwnedByOrg(note.project, user.organisationId)) throw new Error(ownershipErrorMessage('Message'))

        const isAuthor = note.authorId === user.id
        const canModerate = user.role === Role.ADMIN || user.role === Role.PROJECT_MANAGER

        if (!isAuthor && !canModerate) {
            throw new Error("Vous n'avez pas la permission de supprimer ce message")
        }

        await prisma.projectNote.delete({ where: { id: noteId } })

        revalidatePath(`/org/${orgSlug}/projects/${note.project.id}`)
        await notifyRealtime(note.project.id, 'note:deleted')
        after(() => removeFromIndex('PROJECT_NOTE', noteId))

        return { success: true }
    } catch (error) {
        return catchActionError(error, 'Une erreur est survenue lors de la suppression du message.')
    }
}
