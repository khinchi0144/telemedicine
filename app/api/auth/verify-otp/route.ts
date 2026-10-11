import { assertCsrf } from '@/lib/auth/csrf';
import { issueRegistrationTicket } from '@/lib/auth/registration-ticket';
import { handleRouteError, ok } from '@/lib/utils/api-response';
import { clientKey, enforceRateLimit } from '@/lib/utils/rate-limit';
import { env } from '@/lib/utils/env';
import { Errors } from '@/lib/utils/errors';
import { verifyOtpSchema, toFieldErrors } from '@/lib/validations/auth';
import { verifyOtpChallenge } from '@/lib/services/otpService';
import type { VerifyOtpResult } from '@/types/auth';

/**
 * POST /api/auth/verify-otp
 *
 * Verifies the 6 digit code and, on success, issues a short lived
 * "mobile verified" ticket stored in an HTTP-only cookie. The registration
 * endpoints require that ticket, so the OTP step cannot be bypassed.
 */
export async function POST(request: Request) {
  try {
    assertCsrf(request);
    enforceRateLimit(
      clientKey(request, 'verify-otp'),
      env.RATE_LIMIT_OTP_PER_15MIN * 3,
      15 * 60 * 1000,
      'Too many verification attempts. Please request a new OTP.',
    );

    const body = await request.json().catch(() => null);
    const parsed = verifyOtpSchema.safeParse(body);
    if (!parsed.success) {
      throw Errors.validation(
        'Please enter the 6 digit OTP.',
        toFieldErrors(parsed.error),
      );
    }

    const { challengeId, code, role } = parsed.data;

    // The challenge carries the mobile number it was issued for.
    const { getStore } = await import('@/lib/db');
    const store = await getStore();
    const challenge = await store.getOtpChallenge(challengeId);
    if (!challenge) throw Errors.otpExpired();

    const outcome = await verifyOtpChallenge({
      challengeId,
      code,
      expectedMobile: challenge.mobile,
    });

    const ticketRole = (role ?? challenge.registrationId ?? 'PATIENT') as never;
    const { registrationId } = await issueRegistrationTicket({
      role: ticketRole,
      mobile: outcome.mobile,
      purpose: challenge.purpose,
    });

    const result: VerifyOtpResult = {
      verified: true,
      registrationId,
      expiresInSeconds: env.OTP_EXPIRY_SECONDS,
    };
    return ok(result);
  } catch (error) {
    return handleRouteError(error, 'verify-otp');
  }
}
