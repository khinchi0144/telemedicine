import { assertCsrf } from '@/lib/auth/csrf';
import { handleRouteError, ok } from '@/lib/utils/api-response';
import { clientKey, enforceRateLimit } from '@/lib/utils/rate-limit';
import { env } from '@/lib/utils/env';
import { Errors } from '@/lib/utils/errors';
import {
  resetPasswordRequestSchema,
  toFieldErrors,
} from '@/lib/validations/auth';
import { completePasswordReset } from '@/lib/services/passwordResetService';

/**
 * POST /api/auth/reset-password
 *
 * Consumes a single use reset token and stores a freshly hashed password.
 * The token is burned on success, so the same link cannot be replayed, and the
 * user is deliberately NOT signed in here — they must prove the new password
 * through the normal login flow.
 */
export async function POST(request: Request) {
  try {
    assertCsrf(request);
    enforceRateLimit(
      clientKey(request, 'reset-password'),
      env.RATE_LIMIT_LOGIN_PER_15MIN,
      15 * 60 * 1000,
      'Too many attempts. Please request a new link in a few minutes.',
    );

    const body = await request.json().catch(() => null);
    const parsed = resetPasswordRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw Errors.validation(
        'Please check the password you chose.',
        toFieldErrors(parsed.error),
      );
    }

    await completePasswordReset({
      token: parsed.data.token,
      password: parsed.data.password,
    });

    return ok({
      message: 'Your password has been updated. You can sign in with it now.',
      redirectTo: '/auth/login',
    });
  } catch (error) {
    return handleRouteError(error, 'reset-password');
  }
}