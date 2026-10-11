import 'server-only';

import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { logger } from '@/lib/utils/logger';
import type { PrivateStorage, StoredObject } from './types';

/**
 * Local private storage driver.
 *
 * Files are written outside `public/` (default `.storage/`) so Next.js never
 * serves them statically. Used for local development and for single node
 * deployments; switch STORAGE_DRIVER=s3 for a private bucket.
 */
export class LocalPrivateStorage implements PrivateStorage {
  readonly driver = 'local' as const;
  private readonly root: string;

  constructor(baseDir: string) {
    // Resolved at runtime from configuration; the storage root is never part
    // of the build output.
    this.root = path.resolve(
      /* turbopackIgnore: true */ process.cwd(),
      baseDir,
    );
  }

  /** Blocks path traversal (`../`) and absolute path injection. */
  private resolveKey(key: string): string {
    const target = path.resolve(this.root, key);
    if (target !== this.root && !target.startsWith(`${this.root}${path.sep}`)) {
      throw new Error('Invalid storage key');
    }
    return target;
  }

  async put(key: string, data: Buffer, contentType: string): Promise<StoredObject> {
    const target = this.resolveKey(key);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, data, { mode: 0o600 });
    logger.info('Stored document in private local storage', { key, bytes: data.length });
    return { key, size: data.length, contentType };
  }

  async get(key: string): Promise<Buffer | null> {
    try {
      const target = this.resolveKey(key);
      const info = await stat(target);
      if (!info.isFile()) return null;
      return await readFile(target);
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await rm(this.resolveKey(key), { force: true });
    } catch (error) {
      logger.warn('Could not delete stored document', {
        key,
        reason: error instanceof Error ? error.message : 'unknown',
      });
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const info = await stat(this.resolveKey(key));
      return info.isFile();
    } catch {
      return false;
    }
  }
}
