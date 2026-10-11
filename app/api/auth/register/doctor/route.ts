import { assertCsrf } from '@/lib/auth/csrf';
import { clearRegistrationTicket } from '@/lib/auth/registration-ticket';
import { requireRegistrationTicket } from '@/lib/auth/registration-guard';
import { created, handleRouteError } from '@/lib/utils/api-response';
import { clientKey, enforceRateLimit } from '@/lib/utils/rate-limit';
import { env } from '@/lib/utils/env';
import { Errors } from '@/lib/utils/errors';
import { toFieldErrors } from '@/lib/validations/auth';
import { doctorRegistrationSchema } from '@/lib/validations/doctor';
import { registerDoctor } from '@/lib/services/doctorService';

/**
 * POST /api/auth/register/doctor
 *
 * Creates the account in PENDING_VERIFICATION and attaches the documents that
 * were uploaded against the OTP ticket. The user is NOT signed in — the
 * professional dashboard stays locked until an admin verifies the profile.
 */
export async function POST(request: Request) {
  try {
    assertCsrf(request);
    enforceRateLimit(
      clientKey(request, 'register-doctor'),
      env.RATE_LIMIT_REGISTER_PER_HOUR,
      60 * 60 * 1000,
      'Too many registration attempts. Please try again later.',
    );

    const ticket = await requireRegistrationTicket('DOCTOR');
    const body = await request.json().catch(() => null);
    const parsed = doctorRegistrationSchema.safeParse(body);

    if (!parsed.success) {
      throw Errors.validation(
        'Please check the highlighted fields and try again.',
        toFieldErrors(parsed.error),
      );
    }

    const result = await registerDoctor(parsed.data, ticket);
    await clearRegistrationTicket();

    return created(result);
  } catch (error) {
    return handleRouteError(error, 'register-doctor');
  }
}
