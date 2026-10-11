import 'server-only';

import { createHash } from 'node:crypto';

import { getStore } from '@/lib/db';
import { randomToken } from '@/lib/utils/crypto';
import { Errors } from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';
import { env } from '@/lib/utils/env';
import { sendTransactionalEmail } from './emailService';

/**
 * Single use account tokens: email verification and password reset.
 *
 * Security model
 * --------------
 *  - the raw token is 32 random bytes, base64url encoded
 *  - only its SHA-256 hash is ever stored, so a database dump cannot be used
 *    to verify an address or reset a password
 *  - lookup is by hash, and consuming deletes the row immediately
 *  - expiry is checked server side; the client clock is never trusted
 *  - issuing a new token invalidates every previous one for that user
 */

export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

/** Issues a token, stores its hash and emails the raw link. */
async function issue(input: {
  userId: string;
  email: string;
  kind: 'VERIFY_EMAIL' | 'RESET_PASSWORD';
  ttlMs: number;
}): Promise<{ raw: string; expiresAt: Date }> {
  const store = await getStore();
  const raw = randomToken(32);
  const expiresAt = new Date(Date.now() + input.ttlMs);

  if (input.kind === 'VERIFY_EMAIL') {
    await store.createEmailVerificationToken(input.userId, hashToken(raw), expiresAt);
  } else {
    await store.createPasswordResetToken(input.userId, hashToken(raw), expiresAt);
  }

  await sendTransactionalEmail({
    to: input.email,
    kind: input.kind,
    actionUrl: buildUrl(input.kind, raw),
  });

  logger.info('Account token issued', { kind: input.kind, userId: input.userId });
  return { raw, expiresAt };
}

function buildUrl(kind: 'VERIFY_EMAIL' | 'RESET_PASSWORD', token: string): string {
  const base = env.APP_URL.replace(/\/$/, '');
  return kind === 'VERIFY_EMAIL'
    ? `${base}/auth/verify-email?token=${encodeURIComponent(token)}`
    : `${base}/auth/reset-password?token=${encodeURIComponent(token)}`;
}

/** Sends (or re-sends) an email verification link. */
export async function sendEmailVerificationLink(
  userId: string,
  email: string,
): Promise<void> {
  await issue({
    userId,
    email,
    kind: 'VERIFY_EMAIL',
    ttlMs: env.emailVerificationTtlMs,
  });
}

/**
 * Consumes an email verification token.
 *
 * Returns `alreadyVerified` when the address was confirmed earlier, so the
 * user sees a friendly page instead of an error for a link they already used.
 */
export async function verifyEmailToken(raw: string): Promise<{
  verified: boolean;
  alreadyVerified: boolean;
}> {
  const store = await getStore();
  const record = await store.findEmailVerificationToken(hashToken(raw));

  if (!record) throw Errors.invalidToken();

  const user = await store.findUserById(record.userId);
  if (!user) throw Errors.invalidToken();

  // Single use: remove before anything else so a retry cannot race.
  await store.deleteEmailVerificationTokensForUser(record.userId);

  if (user.isEmailVerified) {
    return { verified: true, alreadyVerified: true };
  }

  if (record.expiresAt.getTime() < Date.now()) {
    throw Errors.invalidToken();
  }

  await store.updateUser(user.id, { isEmailVerified: true });

  // A patient held back by the verification policy becomes usable now.
  if (user.status === 'PENDING_VERIFICATION' && user.role === 'PATIENT') {
    await store.updateUser(user.id, { status: 'ACTIVE' });
  }

  logger.info('Email verified', { userId: user.id });
  return { verified: true, alreadyVerified: false };
}

/** Sends (or re-sends) a password reset link. */
export async function sendPasswordResetLink(
  userId: string,
  email: string,
): Promise<void> {
  await issue({
    userId,
    email,
    kind: 'RESET_PASSWORD',
    ttlMs: env.passwordResetTtlMs,
  });
}

/**
 * Checks a reset token without consuming it, so the form can render in a valid
 * or invalid state before the user submits anything.
 */
export async function peekPasswordResetToken(raw: string): Promise<boolean> {
  const store = await getStore();
  const record = await store.findPasswordResetToken(hashToken(raw));
  if (!record) return false;
  if (record.usedAt) return false;
  return record.expiresAt.getTime() >= Date.now();
}