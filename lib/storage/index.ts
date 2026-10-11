import 'server-only';

import { env } from '@/lib/utils/env';
import { logger } from '@/lib/utils/logger';
import { LocalPrivateStorage } from './local-storage';
import { S3PrivateStorage } from './s3-storage';
import type { PrivateStorage } from './types';

export type { PrivateStorage, StoredObject } from './types';

let storage: PrivateStorage | null = null;

/**
 * Returns the configured private storage driver.
 * Falls back to the local driver when S3 credentials are incomplete so local
 * development never depends on cloud configuration.
 */
export function getStorage(): PrivateStorage {
  if (storage) return storage;

  const s3Configured =
    env.STORAGE_DRIVER === 's3' &&
    Boolean(env.AWS_S3_BUCKET && env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY);

  if (s3Configured) {
    logger.info('Using private S3 storage for documents');
    storage = new S3PrivateStorage({
      bucket: env.AWS_S3_BUCKET,
      region: env.AWS_REGION || 'ap-south-1',
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      endpoint: env.AWS_ENDPOINT_URL || undefined,
      forcePathStyle: env.AWS_FORCE_PATH_STYLE ?? false,
    });
  } else {
    storage = new LocalPrivateStorage(env.STORAGE_LOCAL_DIR);
  }

  return storage;
}
