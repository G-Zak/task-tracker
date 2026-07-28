-- Rename "password" to "passwordHash" to match prisma/schema.prisma (semantic accuracy:
-- the column stores a bcrypt hash, never the plaintext password) and stop the drift
-- between the schema file and the actual database/generated client.
ALTER TABLE "User" RENAME COLUMN "password" TO "passwordHash";
