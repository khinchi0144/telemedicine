import { assertCsrf } from '@/lib/auth/csrf';
import { handleRouteError, ok } from '@/lib/utils/api-response';
import { clientKey, enforceRateLimit } from '@/lib/utils/rate-limit';
import { env } from '@/lib/utils/env';
import { logger } from '@/lib/utils/logger';
import { sendOtpSchema, toFieldErrors } from '@/lib/validations/auth';
import { sendOtp } from '@/lib/services/otpService';
import { Errors } from '@/lib/utils/errors';
import { getStore } from '@/lib/db';
import type { RegisterableRole } from '@/types/auth';

/**
 * POST /api/auth/send-otp
 *
 * Creates a short lived OTP challenge. The code itself never leaves the server
 * (except in mock development mode, where it is returned so the flow can be
 * tested without an SMS gateway).
 */
export async function POST(request: Request) {
  try {
    assertCsrf(request);

    // Broad per-client limit first, so malformed requests are still counted.
    enforceRateLimit(
      clientKey(request, 'send-otp-ip'),
      env.RATE_LIMIT_OTP_PER_IP_15MIN,
      15 * 60 * 1000,
      'Too many OTP requests. Please wait a few minutes and try again.',
    );

    const body = await request.json().catch(() => null);
    const parsed = sendOtpSchema.safeParse(body);
    if (!parsed.success) {
      throw Errors.validation(
        'Please check the details and try again.',
        toFieldErrors(parsed.error),
      );
    }

    const { mobile, purpose, role } = parsed.data;

    // Per mobile number limit: stops OTP flooding aimed at a single victim.
    enforceRateLimit(
      clientKey(request, 'send-otp', mobile),
      env.RATE_LIMIT_OTP_PER_15MIN,
      15 * 60 * 1000,
      'Too many OTP requests for this number. Please wait a few minutes and try again.',
    );

    // Do not leak whether an account already exists: for a registration OTP on
    // a known account we still send a code, and the failure surfaces at the
    // registration step with a precise message.
    if (purpose === 'REGISTRATION' && role) {
      const store = await getStore();
      const existing = await store.findUserByMobile(mobile);
      if (existing && existing.role !== role) {
        throw Errors.conflict(
          'An account with this mobile number already exists. Please sign in instead.',
        );
      }
    }

    const result = await sendOtp({
      mobile,
      purpose,
      role: role as RegisterableRole | undefined,
    });

    logger.info('OTP challenge created', { purpose });
    return ok(result);
  } catch (error) {
    return handleRouteError(error, 'send-otp');
  }
}
