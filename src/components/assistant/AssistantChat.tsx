'use client'

import { useRef, useState, useTransition } from 'react'
import { Send, Sparkles, FolderKanban, CheckSquare, MessageSquare, Loader2 } from 'lucide-react'
import { askAssistantAction } from '@/src/actions/assistant'
import type { AssistantSource } from '@/src/services/assistant.service'

interface ChatMessage {
    role: 'user' | 'assistant'
    content: string
    sources?: AssistantSource[]
    isError?: boolean
}

const EXAMPLE_QUESTIONS = [
    'Quels projets risquent de dépasser leur échéance ?',
    'Quelles sont mes tâches en retard ?',
    "Fais-moi un résumé de l'activité récente sur mes projets.",
]

const sourceIcons: Record<AssistantSource['sourceType'], typeof FolderKanban> = {
    PROJECT: FolderKanban,
    TASK: CheckSquare,
    PROJECT_NOTE: MessageSquare,
}

const sourceLabels: Record<AssistantSource['sourceType'], string> = {
    PROJECT: 'Projet',
    TASK: 'Tâche',
    PROJECT_NOTE: 'Message',
}

export function AssistantChat() {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [input, setInput] = useState('')
    const [isPending, startTransition] = useTransition()
    const bottomRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }))
    }

    const send = (question: string) => {
        const trimmed = question.trim()
        if (!trimmed || isPending) return

        const history = messages.map((m) => ({ role: m.role, content: m.content }))
        setMessages((current) => [...current, { role: 'user', content: trimmed }])
        setInput('')
        scrollToBottom()

        startTransition(async () => {
            const result = await askAssistantAction(trimmed, history)

            if ('error' in result) {
                setMessages((current) => [...current, { role: 'assistant', content: result.error, isError: true }])
            } else {
                setMessages((current) => [...current, { role: 'assistant', content: result.answer, sources: result.sources }])
            }
            scrollToBottom()
        })
    }

    return (
        <div className="flex h-[calc(100vh-13rem)] flex-col rounded-2xl border border-zinc-200/80 bg-white shadow-sm overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                        <div className="rounded-full bg-violet-50 p-3 text-violet-600 mb-3">
                            <Sparkles className="h-6 w-6" />
                        </div>
                        <h3 className="font-semibold text-zinc-900">Posez une question sur votre organisation</h3>
                        <p className="mt-1 max-w-sm text-sm text-zinc-500">
                            L&apos;assistant répond uniquement à partir des projets, tâches et messages auxquels vous avez accès.
                        </p>
                        <div className="mt-5 flex flex-col gap-2">
                            {EXAMPLE_QUESTIONS.map((question) => (
                                <button
                                    key={question}
                                    onClick={() => send(question)}
                                    className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 transition-colors"
                                >
                                    {question}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    messages.map((message, index) => (
                        <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] space-y-2 ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                                <div
                                    className={`rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                                        message.role === 'user'
                                            ? 'bg-primary text-primary-foreground'
                                            : message.isError
                                              ? 'bg-red-50 text-red-700 border border-red-200'
                                              : 'bg-zinc-100 text-zinc-900'
                                    }`}
                                >
                                    {message.content}
                                </div>

                                {message.sources && message.sources.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {message.sources.map((source, sourceIndex) => {
                                            const Icon = sourceIcons[source.sourceType]
                                            return (
                                                <span
                                                    key={`${source.sourceType}-${source.sourceId}-${sourceIndex}`}
                                                    title={source.label}
                                                    className="flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[11px] text-zinc-500"
                                                >
                                                    <Icon className="h-3 w-3 text-zinc-400" />
                                                    {sourceLabels[source.sourceType]}
                                                </span>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}

                {isPending && (
                    <div className="flex justify-start">
                        <div className="flex items-center gap-2 rounded-2xl bg-zinc-100 px-4 py-2.5 text-sm text-zinc-500">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            L&apos;assistant réfléchit... (modèle local, jusqu&apos;à une minute)
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    send(input)
                }}
                className="flex items-center gap-2 border-t border-zinc-100 p-4"
            >
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isPending}
                    placeholder="Posez votre question..."
                    className="flex-1 rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 disabled:opacity-50"
                />
                <button
                    type="submit"
                    disabled={isPending || !input.trim()}
                    className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                    <Send className="h-4 w-4" />
                </button>
            </form>
        </div>
    )
}
