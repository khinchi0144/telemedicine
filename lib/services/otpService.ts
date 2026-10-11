import 'server-only';

import { getStore } from '@/lib/db';
import { createSalt, generateOtp, hashOtp } from '@/lib/utils/crypto';
import { env } from '@/lib/utils/env';
import { Errors } from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';
import { maskMobile } from '@/lib/utils/format';
import { safeCompare } from '@/lib/utils/crypto';
import type { OtpPurpose, RegisterableRole, SendOtpResult } from '@/types/auth';
import { sendOtpSms } from './sms-provider';

/**
 * OTP abstraction.
 *
 * Codes are generated here, stored as a salted hash with a short expiry and
 * deleted the moment they are consumed — they are never kept in plain text and
 * never written to the database or the logs.
 */

export interface SendOtpArgs {
  mobile: string;
  purpose: OtpPurpose;
  role?: RegisterableRole;
}

export async function sendOtp({
  mobile,
  purpose,
  role,
}: SendOtpArgs): Promise<SendOtpResult> {
  const store = await getStore();

  // Housekeeping: expired challenges are never kept around.
  await store.deleteExpiredOtpChallenges();

  // Only one live challenge per mobile + purpose.
  await store.deleteOtpChallengesForMobile(mobile, purpose);

  const code = generateOtp();
  const salt = createSalt();
  const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_SECONDS * 1000);

  const challenge = await store.createOtpChallenge({
    mobile,
    purpose,
    codeHash: hashOtp(code, salt),
    salt,
    expiresAt,
    maxAttempts: env.OTP_MAX_ATTEMPTS,
  });

  // Delivery is delegated to the configured SMS gateway. In mock mode the
  // gateway is a no-op and the code is returned to the client instead.
  await sendOtpSms({
    mobile,
    code,
    purpose,
    role,
    mock: env.mockOtpEnabled,
  });

  if (env.mockOtpEnabled) {
    logger.warn('Mock OTP issued (development only)', {
      purpose,
      challengeId: challenge.id,
    });
  }

  return {
    challengeId: challenge.id,
    resendAfterSeconds: env.OTP_RESEND_AFTER_SECONDS,
    expiresInSeconds: env.OTP_EXPIRY_SECONDS,
    ...(env.mockOtpEnabled ? { devOtp: code } : {}),
    maskedMobile: maskMobile(mobile),
  };
}

export interface VerifyOtpArgs {
  challengeId: string;
  code: string;
  expectedMobile: string;
}

export interface VerifyOtpOutcome {
  registrationId: string;
  mobile: string;
}

export async function verifyOtpChallenge({
  challengeId,
  code,
  expectedMobile,
}: VerifyOtpArgs): Promise<VerifyOtpOutcome> {
  const store = await getStore();
  const challenge = await store.getOtpChallenge(challengeId);

  // Always the same error for unknown, used or expired challenges so the
  // endpoint cannot be used to probe for valid challenge ids.
  if (!challenge || challenge.consumedAt) throw Errors.otpExpired();

  if (challenge.mobile !== expectedMobile) throw Errors.invalidOtp();
  if (challenge.expiresAt.getTime() < Date.now()) {
    await store.deleteOtpChallenge(challenge.id);
    throw Errors.otpExpired();
  }
  if (challenge.attempts >= challenge.maxAttempts) {
    await store.deleteOtpChallenge(challenge.id);
    throw Errors.otpMaxAttempts();
  }

  const matches = safeCompare(
    challenge.codeHash,
    hashOtp(code, challenge.salt),
  );

  if (!matches) {
    const attempts = challenge.attempts + 1;
    await store.updateOtpChallenge(challenge.id, { attempts });
    if (attempts >= challenge.maxAttempts) {
      await store.deleteOtpChallenge(challenge.id);
      throw Errors.otpMaxAttempts();
    }
    throw Errors.invalidOtp();
  }

  // Consumed OTPs are deleted immediately, never persisted.
  await store.deleteOtpChallenge(challenge.id);

  return {
    registrationId: challenge.registrationId ?? challengeId,
    mobile: challenge.mobile,
  };
}
