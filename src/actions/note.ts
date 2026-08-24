'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUserSession, canAccessProject } from '@/src/lib/rbac'
import { noteSchema, NoteFormValues } from '@/src/validations/note.schema'
import { Role } from '@/generated/client'
import { revalidatePath } from 'next/cache'

// Notifie le serveur temps réel (US-033) après une écriture réussie. Ce serveur est un
// process séparé et optionnel : son indisponibilité ne doit jamais faire échouer la
// création/suppression d'un message, d'où le try/catch qui avale silencieusement l'erreur.
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
    } catch {
        // Serveur temps réel indisponible : les autres membres verront le message au
        // prochain chargement de la page, mais l'écriture elle-même a déjà réussi.
    }
}

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
        await notifyRealtime(projectId, 'note:created')

        return { success: true }
    } catch (error: any) {
        return { error: error.message || "Une erreur est survenue lors de l'envoi du message." }
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

        if (!note || !note.project || note.project.organisationId !== user.organisationId) {
            throw new Error('Message introuvable ou accès refusé')
        }

        const isAuthor = note.authorId === user.id
        const canModerate = user.role === Role.ADMIN || user.role === Role.PROJECT_MANAGER

        if (!isAuthor && !canModerate) {
            throw new Error("Vous n'avez pas la permission de supprimer ce message")
        }

        await prisma.projectNote.delete({ where: { id: noteId } })

        revalidatePath(`/org/${orgSlug}/projects/${note.project.id}`)
        await notifyRealtime(note.project.id, 'note:deleted')

        return { success: true }
    } catch (error: any) {
        return { error: error.message || 'Une erreur est survenue lors de la suppression du message.' }
    }
}
