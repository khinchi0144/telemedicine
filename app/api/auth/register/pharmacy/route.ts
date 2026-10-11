import { assertCsrf } from '@/lib/auth/csrf';
import { clearRegistrationTicket } from '@/lib/auth/registration-ticket';
import { requireRegistrationTicket } from '@/lib/auth/registration-guard';
import { created, handleRouteError } from '@/lib/utils/api-response';
import { clientKey, enforceRateLimit } from '@/lib/utils/rate-limit';
import { env } from '@/lib/utils/env';
import { Errors } from '@/lib/utils/errors';
import { toFieldErrors } from '@/lib/validations/auth';
import { pharmacyRegistrationSchema } from '@/lib/validations/pharmacy';
import { registerPharmacy } from '@/lib/services/pharmacyService';

/**
 * POST /api/auth/register/pharmacy
 *
 * Creates the account in PENDING_VERIFICATION with the weekly operating hours
 * and the uploaded documents. The user is NOT signed in.
 */
export async function POST(request: Request) {
  try {
    assertCsrf(request);
    enforceRateLimit(
      clientKey(request, 'register-pharmacy'),
      env.RATE_LIMIT_REGISTER_PER_HOUR,
      60 * 60 * 1000,
      'Too many registration attempts. Please try again later.',
    );

    const ticket = await requireRegistrationTicket('PHARMACY');
    const body = await request.json().catch(() => null);
    const parsed = pharmacyRegistrationSchema.safeParse(body);

    if (!parsed.success) {
      throw Errors.validation(
        'Please check the highlighted fields and try again.',
        toFieldErrors(parsed.error),
      );
    }

    const result = await registerPharmacy(parsed.data, ticket);
    await clearRegistrationTicket();

    return created(result);
  } catch (error) {
    return handleRouteError(error, 'register-pharmacy');
  }
}
