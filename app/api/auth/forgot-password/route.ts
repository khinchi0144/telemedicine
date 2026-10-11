import { assertCsrf } from '@/lib/auth/csrf';
import { handleRouteError, ok } from '@/lib/utils/api-response';
import { clientKey, enforceRateLimit } from '@/lib/utils/rate-limit';
import { env } from '@/lib/utils/env';
import { Errors } from '@/lib/utils/errors';
import { forgotPasswordSchema, toFieldErrors } from '@/lib/validations/auth';
import { requestPasswordReset } from '@/lib/services/passwordResetService';

/**
 * POST /api/auth/forgot-password
 *
 * Issues a single use password reset link when the identifier maps to a real
 * account with an email on file. The response is identical whether or not the
 * account exists, so this endpoint cannot be used to discover which mobile
 * numbers or emails are registered.
 */
export async function POST(request: Request) {
  try {
    assertCsrf(request);
    enforceRateLimit(
      clientKey(request, 'forgot-password'),
      env.RATE_LIMIT_LOGIN_PER_15MIN,
      15 * 60 * 1000,
      'Too many requests. Please try again in a few minutes.',
    );

    const body = await request.json().catch(() => null);
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      throw Errors.validation(
        'Please enter your registered mobile number or email address.',
        toFieldErrors(parsed.error),
      );
    }

    const result = await requestPasswordReset(parsed.data.identifier);
    return ok({ message: result.message });
  } catch (error) {
    return handleRouteError(error, 'forgot-password');
  }
}
