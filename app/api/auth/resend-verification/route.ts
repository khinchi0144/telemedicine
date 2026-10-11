import { assertCsrf } from '@/lib/auth/csrf';
import { requireApiUser } from '@/lib/auth/dal';
import { handleRouteError, ok } from '@/lib/utils/api-response';
import { clientKey, enforceRateLimit } from '@/lib/utils/rate-limit';
import { env } from '@/lib/utils/env';
import { Errors } from '@/lib/utils/errors';
import { sendEmailVerificationLink } from '@/lib/services/tokenService';
import { getStore } from '@/lib/db';

/**
 * POST /api/auth/resend-verification
 *
 * Sends a fresh verification link to the signed-in account. The response never
 * reveals whether the address is already verified, so it cannot be used to
 * probe an account's state.
 */
export async function POST(request: Request) {
  try {
    assertCsrf(request);
    const user = await requireApiUser();
    enforceRateLimit(
      clientKey(request, 'resend-verification', user.id),
      env.RATE_LIMIT_OTP_PER_15MIN,
      15 * 60 * 1000,
      'Too many requests. Please try again in a few minutes.',
    );

    const store = await getStore();
    const record = await store.findUserById(user.id);

    if (!record?.email) throw Errors.notFound('No email address on this account.');

    if (!record.isEmailVerified) {
      await sendEmailVerificationLink(user.id, record.email);
    }

    return ok({
      message: 'If your address still needs confirming, a new link is on its way.',
    });
  } catch (error) {
    return handleRouteError(error, 'resend-verification');
  }
}