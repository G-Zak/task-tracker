const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'
const OLLAMA_CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL ?? 'deepseek-r1:8b'

export interface OllamaChatMessage {
    role: 'system' | 'user' | 'assistant'
    content: string
}

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
