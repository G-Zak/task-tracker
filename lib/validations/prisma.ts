import * as PrismaModule from '@prisma/client'
const { PrismaClient } = PrismaModule as any

const globalForPrisma = global as unknown as { prisma: InstanceType<typeof PrismaClient> }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma