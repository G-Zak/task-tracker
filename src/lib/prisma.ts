import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/client'

const globalForPrisma = globalThis as unknown as {
  prisma?: InstanceType<typeof PrismaClient>
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' }),
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// pgvector est installée à la main dans une migration écrite manuellement, hors du flux normal de
// Prisma (voir prisma/migrations/20260828145047_add_knowledge_chunk_pgvector — champ `embedding`
// non représentable comme type Prisma). Si l'extension manque sur un environnement fraîchement
// cloné, l'indexation RAG (US-041) échouerait silencieusement à chaque tâche/projet/note créée,
// avalée par les try/catch "best effort" — ce log au démarrage rend le problème visible tout de
// suite plutôt que de le laisser se découvrir en production.
if (!globalForPrisma.prisma) {
  prisma.$queryRaw<{ exists: boolean }[]>`SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') as exists`
    .then(([row]) => {
      if (!row?.exists) {
        console.warn(
          "[prisma] Extension PostgreSQL 'vector' introuvable — l'indexation RAG et l'assistant IA échoueront silencieusement. " +
            "Voir prisma/migrations/20260828145047_add_knowledge_chunk_pgvector/migration.sql."
        )
      }
    })
    .catch(() => {
      // Base injoignable au démarrage : pas un problème pgvector spécifique, rien à ajouter ici —
      // les erreurs de connexion normales des appels applicatifs suivants suffiront à le signaler.
    })
}