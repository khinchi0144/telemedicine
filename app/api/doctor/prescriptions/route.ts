import { assertCsrf } from '@/lib/auth/csrf';
import { requireApiUser } from '@/lib/auth/dal';
import { createDoctorPrescription } from '@/lib/services/prescriptionService';
import { handleRouteError, created } from '@/lib/utils/api-response';
import { clientKey, enforceRateLimit } from '@/lib/utils/rate-limit';
import { env } from '@/lib/utils/env';
import { Errors } from '@/lib/utils/errors';
import { toFieldErrors } from '@/lib/validations/auth';
import { doctorCreatePrescriptionSchema } from '@/lib/validations/care';

/**
 * POST /api/doctor/prescriptions
 *
 * Writes a prescription for one of the authenticated doctor's own eligible
 * appointments. The doctor and patient identities are resolved server-side from
 * the session and the appointment; only VERIFIED doctors may prescribe. The
 * store persists the prescription and its medicine lines in one transaction.
 */
export async function POST(request: Request) {
  try {
    assertCsrf(request);
    const user = await requireApiUser(['DOCTOR']);
    enforceRateLimit(
      clientKey(request, 'doctor-prescription-create', user.id),
      env.RATE_LIMIT_LOGIN_PER_15MIN,
      15 * 60 * 1000,
      'Too many prescriptions in a short time. Please try again in a few minutes.',
    );

    const body = await request.json().catch(() => null);
    const parsed = doctorCreatePrescriptionSchema.safeParse(body);
    if (!parsed.success) {
      throw Errors.validation(
        'Please review the highlighted prescription fields.',
        toFieldErrors(parsed.error),
      );
    }

    const prescription = await createDoctorPrescription(user.id, parsed.data);
    return created({ prescription });
  } catch (error) {
    return handleRouteError(error, 'doctor prescription create');
  }
}