import 'server-only';

import { getStore } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { Errors } from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';
import { hashToken, sendPasswordResetLink } from './tokenService';
import { findUserByIdentifier } from './authService';

/**
 * Password reset.
 *
 * The "request" half is deliberately non-enumerating: it returns the same
 * response whether or not the account exists, so the endpoint cannot be used to
 * discover registered addresses. Only the server learns the difference.
 */

/** Issues a reset link when the identifier maps to a real account. */
export async function requestPasswordReset(identifier: string): Promise<{
  message: string;
}> {
  const user = await findUserByIdentifier(identifier);

  if (user?.email) {
    await sendPasswordResetLink(user.id, user.email);
  } else if (user) {
    // Account exists but has no email on file: nothing to deliver, and the
    // caller still receives the generic message.
    logger.info('Password reset requested for an account without an email', {
      userId: user.id,
    });
  }

  return {
    message:
      'If an account exists for that mobile number or email, reset instructions have been sent.',
  };
}

/**
 * Completes a reset: re-hashes the password and burns every outstanding token
 * for that user, so a link can never be replayed.
 */
export async function completePasswordReset(input: {
  token: string;
  password: string;
}): Promise<void> {
  const store = await getStore();
  const record = await store.findPasswordResetToken(hashToken(input.token));

  if (!record) throw Errors.invalidToken();
  if (record.usedAt) throw Errors.invalidToken();
  if (record.expiresAt.getTime() < Date.now()) throw Errors.invalidToken();

  const user = await store.findUserById(record.userId);
  if (!user) throw Errors.invalidToken();

  await store.updateUser(user.id, {
    passwordHash: await hashPassword(input.password),
  });

  // Every outstanding link dies with this one.
  await store.invalidatePasswordResetTokensForUser(user.id);

  logger.info('Password reset completed', { userId: user.id });
}