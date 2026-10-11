import { assertCsrf } from '@/lib/auth/csrf';
import { handleRouteError, ok } from '@/lib/utils/api-response';
import { clientKey, enforceRateLimit } from '@/lib/utils/rate-limit';
import { env } from '@/lib/utils/env';
import { Errors } from '@/lib/utils/errors';
import { verifyEmailSchema, toFieldErrors } from '@/lib/validations/auth';
import { verifyEmailToken } from '@/lib/services/tokenService';

/**
 * POST /api/auth/verify-email
 *
 * Consumes a single use verification token. Unknown, expired and already used
 * tokens all return the same `INVALID_TOKEN` response, so the endpoint cannot be
 * used to probe which tokens exist.
 */
export async function POST(request: Request) {
  try {
    assertCsrf(request);
    enforceRateLimit(
      clientKey(request, 'verify-email'),
      env.RATE_LIMIT_LOGIN_PER_15MIN,
      15 * 60 * 1000,
      'Too many attempts. Please request a new link.',
    );

    const body = await request.json().catch(() => null);
    const parsed = verifyEmailSchema.safeParse(body);
    if (!parsed.success) {
      throw Errors.validation(
        'This verification link is invalid.',
        toFieldErrors(parsed.error),
      );
    }

    const result = await verifyEmailToken(parsed.data.token);
    return ok({
      verified: result.verified,
      alreadyVerified: result.alreadyVerified,
      message: result.alreadyVerified
        ? 'This email address was already verified.'
        : 'Your email address has been verified.',
    });
  } catch (error) {
    return handleRouteError(error, 'verify-email');
  }
}