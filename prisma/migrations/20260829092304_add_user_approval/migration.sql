-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isApproved" BOOLEAN NOT NULL DEFAULT true;

-- Le diff engine de Prisma ne comprend pas la colonne `embedding` (Unsupported("vector(768)")),
-- donc l'index HNSW créé à la main en 20260828145047_add_knowledge_chunk_pgvector n'est pas
-- représenté dans schema.prisma — sans cette ligne, `migrate dev` continuera de le proposer en
-- DropIndex à chaque future migration.
CREATE INDEX IF NOT EXISTS "KnowledgeChunk_embedding_hnsw_idx" ON "KnowledgeChunk" USING hnsw (embedding vector_cosine_ops);
