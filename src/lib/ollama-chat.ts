const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'
const OLLAMA_CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL ?? 'deepseek-r1:8b'

export interface OllamaChatMessage {
    role: 'system' | 'user' | 'assistant'
    content: string
}

// Extrait de assistant.service.ts (US-042) au moment où un deuxième appelant (rapports IA,
// US-043) en a eu besoin — même modèle de chat local, mêmes contraintes de latence (20-100s+
// selon que le modèle est déjà chargé), même repli silencieux si Ollama est indisponible.
//
// Timeout relevé à 240s (initialement 120s) après qu'un rapport avec un prompt plus long
// (contexte RAG + faits + consignes de structure) ait mesurément dépassé 120s et déclenché ce
// repli — pas une panne d'Ollama, juste un délai insuffisant pour un prompt plus lourd que celui
// de l'assistant conversationnel.
export async function ollamaChat(messages: OllamaChatMessage[]): Promise<string | null> {
    try {
        const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ model: OLLAMA_CHAT_MODEL, messages, stream: false, think: false }),
            signal: AbortSignal.timeout(240_000),
        })
        if (!res.ok) return null

        const data = await res.json()
        const content = data.message?.content
        return typeof content === 'string' ? content.trim() : null
    } catch {
        return null
    }
}
