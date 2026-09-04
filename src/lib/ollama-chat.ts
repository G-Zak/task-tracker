const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'
const OLLAMA_CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL ?? 'llama3.2:3b'
const CHAT_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS ?? 240_000)

export interface OllamaChatMessage {
    role: 'system' | 'user' | 'assistant'
    content: string
}

export type OllamaFailureReason = 'unreachable' | 'timeout' | 'model_missing' | 'error'

export type OllamaChatResult =
    | { ok: true; content: string }
    | { ok: false; reason: OllamaFailureReason; detail?: string }

export function isAiEnabled(): boolean {
    if (process.env.AI_ASSISTANT_ENABLED === 'false') return false
    return Boolean(process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434')
}

export const AI_DISABLED_MESSAGE =
    "L'assistant IA n'est pas disponible dans cet environnement : il s'appuie sur un modèle exécuté localement, qui ne peut pas tourner sur un hébergement serverless."

export async function ollamaChatDetailed(messages: OllamaChatMessage[]): Promise<OllamaChatResult> {
    let res: Response

    try {
        res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ model: OLLAMA_CHAT_MODEL, messages, stream: false, think: false }),
            signal: AbortSignal.timeout(CHAT_TIMEOUT_MS),
        })
    } catch (error) {
        const isTimeout = error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')

        if (isTimeout) {
            console.error(`[ollama] timeout après ${CHAT_TIMEOUT_MS} ms (modèle ${OLLAMA_CHAT_MODEL})`)
            return { ok: false, reason: 'timeout' }
        }

        console.error('[ollama] injoignable sur', OLLAMA_BASE_URL, error)
        return { ok: false, reason: 'unreachable' }
    }

    if (!res.ok) {
        const body = await res.text().catch(() => '')

        if (res.status === 404 || /model .*not found/i.test(body)) {
            console.error(`[ollama] modèle "${OLLAMA_CHAT_MODEL}" absent`)
            return { ok: false, reason: 'model_missing', detail: OLLAMA_CHAT_MODEL }
        }

        console.error(`[ollama] réponse HTTP ${res.status}`, body.slice(0, 300))
        return { ok: false, reason: 'error', detail: `HTTP ${res.status}` }
    }

    const data = await res.json().catch(() => null)
    const content = data?.message?.content

    if (typeof content !== 'string' || content.trim() === '') {
        return { ok: false, reason: 'error', detail: 'réponse vide' }
    }

    return { ok: true, content: content.trim() }
}

export function describeOllamaFailure(reason: OllamaFailureReason, detail?: string): string {
    switch (reason) {
        case 'timeout':
            return "L'assistant a mis trop de temps à répondre. Sur un modèle exécuté sur CPU, une réponse peut demander plusieurs minutes : réessayez, ou choisissez un modèle plus léger via OLLAMA_CHAT_MODEL."
        case 'model_missing':
            return `Le modèle « ${detail ?? 'configuré'} » n'est pas installé sur le serveur Ollama. Lancez : ollama pull ${detail ?? '<modèle>'}`
        case 'unreachable':
            return "Le serveur Ollama n'est pas joignable. Vérifiez qu'il est démarré et que OLLAMA_BASE_URL est correct."
        default:
            return `L'assistant IA a rencontré une erreur${detail ? ` (${detail})` : ''}. Réessayez dans un instant.`
    }
}

export async function ollamaChat(messages: OllamaChatMessage[]): Promise<string | null> {
    const result = await ollamaChatDetailed(messages)
    return result.ok ? result.content : null
}
