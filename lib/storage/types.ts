import 'server-only';

/**
 * Private document storage contract.
 *
 * Medical documents must never live in `/public` or behind a public URL: they
 * are only reachable through an authenticated endpoint that re-checks the
 * caller's role. The local driver is used in development; the S3 driver is a
 * drop-in replacement for a private bucket in production.
 */
export interface StoredObject {
  key: string;
  size: number;
  contentType: string;
}

export interface PrivateStorage {
  readonly driver: 'local' | 's3';
  put(key: string, data: Buffer, contentType: string): Promise<StoredObject>;
  get(key: string): Promise<Buffer | null>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}
