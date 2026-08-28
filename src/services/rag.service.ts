import { prisma } from '@/src/lib/prisma'
import { Prisma } from '@/generated/client'

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'
const OLLAMA_EMBEDDING_MODEL = process.env.OLLAMA_EMBEDDING_MODEL ?? 'nomic-embed-text'

export type KnowledgeSourceType = 'PROJECT' | 'TASK' | 'PROJECT_NOTE'

export interface KnowledgeMatch {
    sourceType: KnowledgeSourceType
    sourceId: string
    content: string
    distance: number
}

async function embed(text: string): Promise<number[] | null> {
    try {
        const res = await fetch(`${OLLAMA_BASE_URL}/api/embed`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ model: OLLAMA_EMBEDDING_MODEL, input: text }),
            signal: AbortSignal.timeout(10_000),
        })
        if (!res.ok) return null

        const data = await res.json()
        const vector = data.embeddings?.[0]
        return Array.isArray(vector) ? vector : null
    } catch {
        // Ollama indisponible (process non lancé, modèle non installé...) : l'indexation est
        // un enrichissement, jamais une dépendance dure pour les Server Actions qui l'appellent.
        return null
    }
}

function toVectorLiteral(embedding: number[]): string {
    return `[${embedding.join(',')}]`
}

// Documents courts (nom/titre + quelques métadonnées + description) : un chunk par entité,
// pas de découpage en sous-blocs — inutile pour des textes de cette taille (projets/tâches/
// messages de l'app, jamais des documents longs).
function buildProjectDocument(project: { name: string; description: string | null; status: string }): string {
    const parts = [`Projet : ${project.name}`, `Statut : ${project.status}`]
    if (project.description) parts.push(`Description : ${project.description}`)
    return parts.join('\n')
}

function buildTaskDocument(task: {
    title: string
    description: string | null
    status: string
    priority: string
    projectName?: string | null
}): string {
    const parts = [`Tâche : ${task.title}`, `Statut : ${task.status}`, `Priorité : ${task.priority}`]
    if (task.projectName) parts.push(`Projet : ${task.projectName}`)
    if (task.description) parts.push(`Description : ${task.description}`)
    return parts.join('\n')
}

function buildNoteDocument(note: { content: string; authorName?: string | null; projectName?: string | null }): string {
    const parts: string[] = []
    if (note.projectName) parts.push(`Message du projet ${note.projectName}`)
    if (note.authorName) parts.push(`Auteur : ${note.authorName}`)
    parts.push(`Contenu : ${note.content}`)
    return parts.join('\n')
}

// Réindexation "best-effort" : jamais bloquante pour l'opération métier qui la déclenche —
// même posture que la diffusion temps réel (US-033), une fonctionnalité de renfort ne doit
// jamais conditionner le succès de l'action qu'elle enrichit. `embedding` est un type Postgres
// (pgvector) non représentable par le Prisma Client généré : écrit ici via $executeRaw.
async function indexEntity(params: {
    organisationId: string
    sourceType: KnowledgeSourceType
    sourceId: string
    content: string
}): Promise<void> {
    try {
        const embedding = await embed(params.content)
        if (!embedding) return

        const vectorLiteral = toVectorLiteral(embedding)

        await prisma.$executeRaw`
            INSERT INTO "KnowledgeChunk" ("id", "organisationId", "sourceType", "sourceId", "content", "embedding", "updatedAt")
            VALUES (gen_random_uuid()::text, ${params.organisationId}, ${params.sourceType}, ${params.sourceId}, ${params.content}, ${vectorLiteral}::vector, now())
            ON CONFLICT ("sourceType", "sourceId")
            DO UPDATE SET "content" = EXCLUDED."content", "embedding" = EXCLUDED."embedding", "updatedAt" = now()
        `
    } catch (error) {
        console.error('Indexation RAG échouée (ignorée) :', error)
    }
}

export async function removeFromIndex(sourceType: KnowledgeSourceType, sourceId: string): Promise<void> {
    try {
        await prisma.$executeRaw`DELETE FROM "KnowledgeChunk" WHERE "sourceType" = ${sourceType} AND "sourceId" = ${sourceId}`
    } catch (error) {
        console.error("Suppression de l'index RAG échouée (ignorée) :", error)
    }
}

// Une fonction par type d'entité, appelée directement depuis les Server Actions après une
// écriture réussie (création/modification) — chacune recharge l'entité depuis la base plutôt
// que de faire confiance aux données déjà en mémoire dans l'action appelante, pour que le
// contenu indexé reflète toujours exactement ce qui est persisté.
export async function indexProject(projectId: string): Promise<void> {
    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) return

    await indexEntity({
        organisationId: project.organisationId,
        sourceType: 'PROJECT',
        sourceId: project.id,
        content: buildProjectDocument(project),
    })
}

export async function indexTask(taskId: string): Promise<void> {
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { project: { select: { name: true } } },
    })
    if (!task) return

    await indexEntity({
        organisationId: task.organisationId,
        sourceType: 'TASK',
        sourceId: task.id,
        content: buildTaskDocument({ ...task, projectName: task.project?.name }),
    })
}

export async function indexProjectNote(noteId: string): Promise<void> {
    const note = await prisma.projectNote.findUnique({
        where: { id: noteId },
        include: {
            project: { select: { name: true, organisationId: true } },
            author: { select: { firstName: true, lastName: true } },
        },
    })
    if (!note || !note.project) return

    await indexEntity({
        organisationId: note.project.organisationId,
        sourceType: 'PROJECT_NOTE',
        sourceId: note.id,
        content: buildNoteDocument({
            content: note.content,
            authorName: note.author ? `${note.author.firstName} ${note.author.lastName}` : null,
            projectName: note.project.name,
        }),
    })
}

export interface KnowledgeScope {
    projectIds: string[]
    taskIds: string[]
    noteIds: string[]
}

// Recherche par similarité, strictement scopée à une organisation (US-041, critère "aucune
// fuite cross-organisation") : le filtre `organisationId` fait partie de la clause WHERE
// elle-même, jamais un post-filtrage applicatif — aucune requête ne peut donc renvoyer un
// chunk d'une autre organisation, quelle que soit sa proximité vectorielle avec la question.
//
// `scope` (US-042) ajoute une deuxième restriction, optionnelle, au même niveau (dans la
// clause WHERE, pas en post-filtrage) : un rôle non-manager ne peut faire remonter que des
// chunks dont la source figure dans les ensembles de projets/tâches/notes qu'il a le droit de
// voir par ailleurs dans l'app — même règle de visibilité que `task.service.ts`, pas une
// nouvelle politique d'accès inventée pour l'assistant.
export async function searchKnowledge(
    organisationId: string,
    query: string,
    limit = 5,
    scope: KnowledgeScope | null = null
): Promise<KnowledgeMatch[]> {
    const embedding = await embed(query)
    if (!embedding) return []

    const vectorLiteral = toVectorLiteral(embedding)

    const rows = await prisma.$queryRaw<Array<{ sourceType: string; sourceId: string; content: string; distance: number }>>(
        scope
            ? Prisma.sql`
                SELECT "sourceType", "sourceId", "content", (embedding <=> ${vectorLiteral}::vector) AS distance
                FROM "KnowledgeChunk"
                WHERE "organisationId" = ${organisationId}
                  AND embedding IS NOT NULL
                  AND (
                    ("sourceType" = 'PROJECT' AND "sourceId" = ANY(${scope.projectIds}::text[]))
                    OR ("sourceType" = 'TASK' AND "sourceId" = ANY(${scope.taskIds}::text[]))
                    OR ("sourceType" = 'PROJECT_NOTE' AND "sourceId" = ANY(${scope.noteIds}::text[]))
                  )
                ORDER BY embedding <=> ${vectorLiteral}::vector
                LIMIT ${limit}
              `
            : Prisma.sql`
                SELECT "sourceType", "sourceId", "content", (embedding <=> ${vectorLiteral}::vector) AS distance
                FROM "KnowledgeChunk"
                WHERE "organisationId" = ${organisationId} AND embedding IS NOT NULL
                ORDER BY embedding <=> ${vectorLiteral}::vector
                LIMIT ${limit}
              `
    )

    return rows.map((row) => ({
        sourceType: row.sourceType as KnowledgeSourceType,
        sourceId: row.sourceId,
        content: row.content,
        distance: Number(row.distance),
    }))
}
