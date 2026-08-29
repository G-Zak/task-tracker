const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'
const OLLAMA_CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL ?? 'deepseek-r1:8b'

export interface OllamaChatMessage {
    role: 'system' | 'user' | 'assistant'
    content: string
}

// Extrait de assistant.service.ts (US-042) au moment où un deuxième appelant (rapports IA,
// US-043) en a eu besoin — même modèle de chat local, même repli silencieux si Ollama est
// indisponible.
//
// Modèle passé de deepseek-r1:8b à mistral (Application-Analysis-2026-08-28.md §3.7/§4.4) :
// deepseek-r1 est un modèle de raisonnement (20s-4min par réponse, temps passé à "penser" avant de
// répondre) ; mistral n'a pas cette étape. Mesuré directement sur cette machine : ~2-20s pour une
// question courte (assistant), mais jusqu'à ~90s pour le prompt plus long d'un rapport (contexte
// RAG + faits + consignes de structure) — la longueur du prompt/de la sortie pèse plus que le
// choix du modèle une fois le raisonnement retiré. Timeout ramené de 240s à 150s (au lieu d'un
// ajustement au plus juste sur les 90s mesurés) après avoir vu un rapport terminer à 89.3s, trop
// proche d'un timeout à 90s pour être fiable sur une machine plus chargée.
// `think: false` reste envoyé : ignoré sans erreur par un modèle qui n'a pas de mode raisonnement,
// vérifié directement (réponse `mistral` normale avec ce paramètre présent).
export async function ollamaChat(messages: OllamaChatMessage[]): Promise<string | null> {
    try {
        const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ model: OLLAMA_CHAT_MODEL, messages, stream: false, think: false }),
            signal: AbortSignal.timeout(150_000),
        })
        if (!res.ok) return null

        const data = await res.json()
        const content = data.message?.content
        return typeof content === 'string' ? content.trim() : null
    } catch {
        return null
    }
}
