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
    .catch(() => {})
}