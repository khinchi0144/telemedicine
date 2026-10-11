import 'server-only';

import { PrismaClient } from '@prisma/client';

import { env } from '@/lib/utils/env';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

/**
 * Prisma client singleton.
 *
 * Reused across hot reloads in development so the connection pool is not
 * exhausted. The client is only instantiated when a DATABASE_URL exists —
 * see lib/db/index.ts.
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.isDevelopment ? ['warn', 'error'] : ['error'],
  });

if (!env.isProduction) {
  globalForPrisma.prisma = prisma;
}
