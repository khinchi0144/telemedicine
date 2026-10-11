import { assertCsrf } from '@/lib/auth/csrf';
import { clearRegistrationTicket } from '@/lib/auth/registration-ticket';
import { setSessionCookie } from '@/lib/auth/session';
import { created, handleRouteError } from '@/lib/utils/api-response';
import { clientKey, enforceRateLimit } from '@/lib/utils/rate-limit';
import { env } from '@/lib/utils/env';
import { Errors } from '@/lib/utils/errors';
import { toFieldErrors } from '@/lib/validations/auth';
import { patientRegistrationSchema } from '@/lib/validations/patient';
import { registerPatient } from '@/lib/services/patientService';
import { requireRegistrationTicket } from '@/lib/auth/registration-guard';

/**
 * POST /api/auth/register/patient
 *
 * Requires a valid OTP ticket (the mobile number must already be verified),
 * re-validates every field on the server and creates the account. A patient
 * account is active immediately and the user is signed in.
 */
export async function POST(request: Request) {
  try {
    assertCsrf(request);
    enforceRateLimit(
      clientKey(request, 'register-patient'),
      env.RATE_LIMIT_REGISTER_PER_HOUR,
      60 * 60 * 1000,
      'Too many registration attempts. Please try again later.',
    );

    const ticket = await requireRegistrationTicket('PATIENT');
    const body = await request.json().catch(() => null);
    const parsed = patientRegistrationSchema.safeParse(body);

    if (!parsed.success) {
      throw Errors.validation(
        'Please check the highlighted fields and try again.',
        toFieldErrors(parsed.error),
      );
    }

    const result = await registerPatient(parsed.data, ticket.mobile);

    await setSessionCookie({
      userId: result.userId,
      role: 'PATIENT',
      status: 'ACTIVE',
    });
    await clearRegistrationTicket();

    return created(result);
  } catch (error) {
    return handleRouteError(error, 'register-patient');
  }
}
