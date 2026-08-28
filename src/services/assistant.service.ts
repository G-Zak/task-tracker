import { prisma } from '@/src/lib/prisma'
import { Role } from '@/generated/enums'
import { searchKnowledge, type KnowledgeSourceType } from '@/src/services/rag.service'

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'
const OLLAMA_CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL ?? 'deepseek-r1:8b'

export interface AssistantMessage {
    role: 'user' | 'assistant'
    content: string
}

export interface AssistantSource {
    sourceType: KnowledgeSourceType
    sourceId: string
    label: string
}

export interface AssistantAnswer {
    answer: string
    sources: AssistantSource[]
}

const SYSTEM_PROMPT = [
    "Tu es l'assistant IA de TaskTracker (ABA Technology), un outil de gestion de projets.",
    'Tu réponds UNIQUEMENT à partir du contexte fourni ci-dessous, extrait des projets, tâches et',
    "messages de l'organisation de la personne qui te parle. Si ce contexte ne permet pas de",
    "répondre à la question, dis-le clairement plutôt que d'inventer une réponse.",
    'Réponds en français, de façon concise et factuelle.',
].join(' ')

// Même règle de visibilité que `task.service.ts` (`restrictToUserId`) et le dashboard
// personnel : ADMIN/PROJECT_MANAGER voient tout ; les autres rôles ne voient que leurs tâches
// assignées et les projets dont ils sont membres. US-026 ("contrôle d'accès de l'assistant IA
// par rôle") n'existant pas en tant que story séparée dans le code, cette story applique cette
// même politique déjà établie plutôt que d'en inventer une nouvelle pour l'IA seule.
export interface AssistantScope {
    projectIds: string[] | null // null = non restreint (ADMIN/PROJECT_MANAGER)
    taskIds: string[] | null
    noteIds: string[] | null
}

export async function computeAssistantScope(user: { id: string; organisationId: string; role: Role }): Promise<AssistantScope> {
    const isManager = user.role === Role.ADMIN || user.role === Role.PROJECT_MANAGER
    if (isManager) return { projectIds: null, taskIds: null, noteIds: null }

    const projects = await prisma.project.findMany({
        where: { organisationId: user.organisationId, members: { some: { id: user.id } } },
        select: { id: true },
    })
    const projectIds = projects.map((project) => project.id)

    const tasks = await prisma.task.findMany({
        where: {
            organisationId: user.organisationId,
            OR: [{ assignees: { some: { id: user.id } } }, { projectId: { in: projectIds } }],
        },
        select: { id: true },
    })

    const notes = projectIds.length
        ? await prisma.projectNote.findMany({
              where: { projectId: { in: projectIds } },
              select: { id: true },
          })
        : []

    return {
        projectIds,
        taskIds: tasks.map((task) => task.id),
        noteIds: notes.map((note) => note.id),
    }
}

interface OllamaChatMessage {
    role: 'system' | 'user' | 'assistant'
    content: string
}

async function chat(messages: OllamaChatMessage[]): Promise<string | null> {
    try {
        const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ model: OLLAMA_CHAT_MODEL, messages, stream: false, think: false }),
            // Modèle de raisonnement local, lent sur ce matériel (mesuré : 20-70s par réponse) —
            // délai généreux plutôt qu'un timeout serré qui couperait des réponses valides.
            signal: AbortSignal.timeout(120_000),
        })
        if (!res.ok) return null

        const data = await res.json()
        const content = data.message?.content
        return typeof content === 'string' ? content.trim() : null
    } catch {
        return null
    }
}

export async function askAssistant(params: {
    organisationId: string
    question: string
    history: AssistantMessage[]
    scope: AssistantScope
}): Promise<AssistantAnswer> {
    const { organisationId, question, history, scope } = params

    const isRestricted = scope.projectIds !== null
    const matches = await searchKnowledge(
        organisationId,
        question,
        6,
        isRestricted ? { projectIds: scope.projectIds!, taskIds: scope.taskIds!, noteIds: scope.noteIds! } : null
    )

    if (matches.length === 0) {
        return {
            answer: "Je n'ai trouvé aucune donnée pertinente pour répondre à cette question dans votre périmètre.",
            sources: [],
        }
    }

    // Les sources citées sont déterminées par l'application (exactement les chunks passés en
    // contexte au modèle), jamais par une auto-citation du modèle — le deuxième critère
    // d'acceptation ("chaque réponse cite les entités sources utilisées") tient donc toujours,
    // indépendamment de ce que le LLM local écrit réellement dans sa réponse.
    const contextBlock = matches.map((match, index) => `[Source ${index + 1}]\n${match.content}`).join('\n\n')

    const messages: OllamaChatMessage[] = [
        { role: 'system', content: `${SYSTEM_PROMPT}\n\nContexte disponible :\n${contextBlock}` },
        ...history,
        { role: 'user', content: question },
    ]

    const answer = await chat(messages)

    if (!answer) {
        return {
            answer: "L'assistant IA local est indisponible pour le moment (Ollama non joignable). Réessayez dans un instant.",
            sources: [],
        }
    }

    const sources: AssistantSource[] = matches.map((match) => ({
        sourceType: match.sourceType,
        sourceId: match.sourceId,
        label: match.content.split('\n')[0],
    }))

    return { answer, sources }
}
