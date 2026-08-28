'use server'

import { getCurrentUserSession } from '@/src/lib/rbac'
import { askAssistant, computeAssistantScope, type AssistantMessage } from '@/src/services/assistant.service'

export async function askAssistantAction(question: string, history: AssistantMessage[]) {
    try {
        const user = await getCurrentUserSession()
        if (!user) return { error: 'Non authentifié.' }

        const trimmed = question.trim()
        if (!trimmed) return { error: 'Veuillez poser une question.' }

        const scope = await computeAssistantScope(user)

        const result = await askAssistant({
            organisationId: user.organisationId,
            question: trimmed,
            history,
            scope,
        })

        return { success: true as const, ...result }
    } catch (error: any) {
        return { error: error.message || "Une erreur est survenue lors de l'interrogation de l'assistant." }
    }
}
