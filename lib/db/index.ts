import 'server-only';

import { logger } from '@/lib/utils/logger';
import { env } from '@/lib/utils/env';
import type { DataStore } from './store';

export type { DataStore };

/**
 * Store factory.
 *
 * PostgreSQL (Prisma) is used whenever DATABASE_URL is configured; otherwise
 * the app falls back to the local development datastore so the full UI flow
 * works without any external credentials. The rest of the application only
 * ever sees the `DataStore` contract.
 */
const globalForStore = globalThis as unknown as {
  medicareStore?: Promise<DataStore>;
};

async function createStore(): Promise<DataStore> {
  if (env.hasDatabase && !env.useMockDb) {
    logger.info('Using the PostgreSQL datastore');
    const [{ prisma }, { PrismaDataStore }] = await Promise.all([
      import('./prisma-client'),
      import('./repositories/prisma-store'),
    ]);
    return new PrismaDataStore(prisma);
  }

  // A production deployment must never fall back to the local development
  // datastore: it would silently lose data on every restart.
  if (env.isProduction) {
    throw new Error(
      'DATABASE_URL must be configured in production — the local development datastore is disabled.',
    );
  }

  logger.warn(
    'DATABASE_URL is not configured — using the local development datastore',
  );
  const [{ MemoryDataStore }, { seedDemoData }] = await Promise.all([
    import('./repositories/memory-store'),
    import('./seed'),
  ]);
  const store = new MemoryDataStore();
  await seedDemoData(store);
  return store;
}

export function getStore(): Promise<DataStore> {
  if (!globalForStore.medicareStore) {
    globalForStore.medicareStore = createStore().catch((error) => {
      // Never cache a failed initialisation.
      globalForStore.medicareStore = undefined;
      throw error;
    });
  }
  return globalForStore.medicareStore;
}
