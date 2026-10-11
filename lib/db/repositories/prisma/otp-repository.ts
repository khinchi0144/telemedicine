import 'server-only';

import type { PrismaClient } from '@prisma/client';

import { createId } from '@/lib/utils/crypto';
import type { OtpPurpose } from '@/types/auth';
import type {
  CreateOtpChallengeInput,
  OtpChallengeRecord,
  UpdateOtpChallengeInput,
} from '../../types';

export class OtpRepository {
  constructor(private readonly client: PrismaClient) {}

  async create(input: CreateOtpChallengeInput): Promise<OtpChallengeRecord> {
    return (await this.client.otpChallenge.create({
      data: {
        id: input.id ?? createId('otp'),
        userId: input.userId ?? null,
        mobile: input.mobile,
        purpose: input.purpose,
        codeHash: input.codeHash,
        salt: input.salt,
        registrationId: input.registrationId ?? null,
        expiresAt: input.expiresAt,
        maxAttempts: input.maxAttempts ?? 5,
      },
    })) as OtpChallengeRecord;
  }

  async getById(id: string): Promise<OtpChallengeRecord | null> {
    return (await this.client.otpChallenge.findUnique({
      where: { id },
    })) as OtpChallengeRecord | null;
  }

  async update(
    id: string,
    patch: UpdateOtpChallengeInput,
  ): Promise<OtpChallengeRecord | null> {
    return (await this.client.otpChallenge.update({
      where: { id },
      data: {
        ...(patch.attempts !== undefined ? { attempts: patch.attempts } : {}),
        ...(patch.consumedAt !== undefined ? { consumedAt: patch.consumedAt } : {}),
        ...(patch.expiresAt !== undefined ? { expiresAt: patch.expiresAt } : {}),
      },
    })) as OtpChallengeRecord;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.client.otpChallenge.findUnique({ where: { id } });
    if (!existing) return false;
    await this.client.otpChallenge.delete({ where: { id } });
    return true;
  }

  async deleteForMobile(mobile: string, purpose: OtpPurpose): Promise<number> {
    const result = await this.client.otpChallenge.deleteMany({
      where: { mobile, purpose },
    });
    return result.count;
  }

  /** Housekeeping: OTPs are never kept once they can no longer be used. */
  async deleteExpired(): Promise<number> {
    const result = await this.client.otpChallenge.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  }
}
