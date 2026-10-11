import 'server-only';

import type { PrismaClient } from '@prisma/client';

import { createId } from '@/lib/utils/crypto';
import type {
  EmailVerificationTokenRecord,
  PasswordResetTokenRecord,
} from '../../types';

/**
 * Single use account tokens.
 *
 * Only the SHA-256 hash of a token is stored, so a leaked database cannot be
 * used to verify an address or reset a password.
 */
export class TokenRepository {
  constructor(private readonly client: PrismaClient) {}

  // --- email verification ---------------------------------------------------

  /** Creating a token invalidates every previous one for that user. */
  async createEmailToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<EmailVerificationTokenRecord> {
    await this.deleteEmailTokensForUser(userId);
    return (await this.client.emailVerificationToken.create({
      data: { id: createId('evt'), userId, tokenHash, expiresAt },
    })) as EmailVerificationTokenRecord;
  }

  findEmailToken(tokenHash: string) {
    return this.client.emailVerificationToken.findUnique({
      where: { tokenHash },
    }) as Promise<EmailVerificationTokenRecord | null>;
  }

  async deleteEmailTokensForUser(userId: string): Promise<number> {
    const result = await this.client.emailVerificationToken.deleteMany({
      where: { userId },
    });
    return result.count;
  }

  async deleteExpiredEmailTokens(): Promise<number> {
    const result = await this.client.emailVerificationToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  }

  // --- password reset -------------------------------------------------------

  /** Creating a token marks every previous one used, so links are single use. */
  async createResetToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<PasswordResetTokenRecord> {
    await this.invalidateResetTokensForUser(userId);
    return (await this.client.passwordResetToken.create({
      data: { id: createId('prt'), userId, tokenHash, expiresAt },
    })) as PasswordResetTokenRecord;
  }

  findResetToken(tokenHash: string) {
    return this.client.passwordResetToken.findUnique({
      where: { tokenHash },
    }) as Promise<PasswordResetTokenRecord | null>;
  }

  async invalidateResetTokensForUser(userId: string): Promise<number> {
    const result = await this.client.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });
    return result.count;
  }

  async deleteExpiredResetTokens(): Promise<number> {
    const result = await this.client.passwordResetToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  }
}