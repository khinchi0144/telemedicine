import { createHash, randomBytes, randomInt } from 'node:crypto';

import { env } from './env';

/** URL safe random token. */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

/** Opaque, sortable-ish unique identifier for records created outside Prisma. */
export function createId(prefix: string): string {
  const time = Date.now().toString(36);
  const random = randomBytes(8).toString('hex');
  return `${prefix}_${time}${random}`;
}

/**
 * Cryptographically secure numeric OTP.
 * `mockOtpEnabled` is hard-disabled in production (see lib/utils/env.ts).
 */
export function generateOtp(length = env.OTP_LENGTH): string {
  if (env.mockOtpEnabled) {
    const configured = env.MOCK_OTP_CODE.replace(/\D/g, '').slice(0, length);
    if (configured.length === length) return configured;
  }
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return String(randomInt(min, max + 1)).padStart(length, '0');
}

/** Salted hash used to store OTPs (never stored in plain text). */
export function hashOtp(code: string, salt: string): string {
  return createHash('sha256').update(`${salt}:${code}`).digest('hex');
}

export function createSalt(): string {
  return randomBytes(16).toString('hex');
}

/** Constant time string comparison to avoid timing attacks on secrets. */
export function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
