import { assertCsrf } from '@/lib/auth/csrf';
import { clearSessionCookie, setSessionCookie } from '@/lib/auth/session';
import { handleRouteError, ok } from '@/lib/utils/api-response';
import { clientKey, enforceRateLimit } from '@/lib/utils/rate-limit';
import { env } from '@/lib/utils/env';
import { Errors } from '@/lib/utils/errors';
import { loginSchema, toFieldErrors } from '@/lib/validations/auth';
import { authenticate } from '@/lib/services/authService';

/**
 * POST /api/auth/login
 *
 * Signs the user in and sets a secure, HTTP-only session cookie. The response
 * carries the role specific landing route so the client can redirect
 * immediately.
 */
export async function POST(request: Request) {
  try {
    assertCsrf(request);

    const body = await request.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      // Rate limit by identifier as well to slow down credential stuffing.
      const identifier =
        body && typeof body === 'object' && 'identifier' in body
          ? String((body as { identifier: unknown }).identifier ?? '')
          : '';
      enforceRateLimit(
        clientKey(request, 'login', identifier.toLowerCase()),
        env.RATE_LIMIT_LOGIN_PER_15MIN,
        15 * 60 * 1000,
      );
      throw Errors.validation('Please check your details.', toFieldErrors(parsed.error));
    }

    enforceRateLimit(
      clientKey(request, 'login', parsed.data.identifier.toLowerCase()),
      env.RATE_LIMIT_LOGIN_PER_15MIN,
      15 * 60 * 1000,
      'Too many sign in attempts. Please try again in a few minutes.',
    );

    const result = await authenticate({
      identifier: parsed.data.identifier,
      password: parsed.data.password,
    });

    await setSessionCookie({
      userId: result.user.id,
      role: result.user.role,
      status: result.user.status,
    });

    return ok(result);
  } catch (error) {
    return handleRouteError(error, 'login');
  }
}

/** DELETE /api/auth/login — used by the client to end the session. */
export async function DELETE() {
  try {
    await clearSessionCookie();
    return ok({ signedOut: true });
  } catch (error) {
    return handleRouteError(error, 'logout');
  }
}
