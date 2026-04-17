import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var __bentoPrisma__: PrismaClient | undefined
}

/**
 * Server-only Prisma singleton for single-branch deployment.
 * Do not import this from browser-rendered React components.
 */
export const prisma = globalThis.__bentoPrisma__ ?? new PrismaClient()

globalThis.__bentoPrisma__ = prisma

