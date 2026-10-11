import { assertCsrf } from '@/lib/auth/csrf';
import { requireApiUser } from '@/lib/auth/dal';
import {
  getDoctorAvailabilitySettings,
  updateDoctorAvailabilitySettings,
} from '@/lib/services/doctorAvailabilityService';
import { handleRouteError, ok } from '@/lib/utils/api-response';
import { clientKey, enforceRateLimit } from '@/lib/utils/rate-limit';
import { env } from '@/lib/utils/env';
import { Errors } from '@/lib/utils/errors';
import { toFieldErrors } from '@/lib/validations/auth';
import { doctorAvailabilitySchema } from '@/lib/validations/doctor';

/**
 * GET /api/doctor/availability
 *
 * Returns the signed-in doctor's saved weekly availability. The doctor
 * identity comes exclusively from the server session — no doctor id is
 * accepted from the request — and only VERIFIED doctors may read it.
 */
export async function GET() {
  try {
    const user = await requireApiUser(['DOCTOR']);
    const availability = await getDoctorAvailabilitySettings(user.id);
    return ok({ availability });
  } catch (error) {
    return handleRouteError(error, 'doctor availability read');
  }
}

/**
 * PUT /api/doctor/availability
 *
 * Replaces the signed-in doctor's whole weekly availability with the
 * validated payload. The schema rejects duplicate weekdays, invalid times,
 * and end-times that are not later than start-times; the store replacement
 * is transactional. Existing appointments are never modified.
 */
export async function PUT(request: Request) {
  try {
    assertCsrf(request);
    const user = await requireApiUser(['DOCTOR']);
    enforceRateLimit(
      clientKey(request, 'doctor-availability-update', user.id),
      env.RATE_LIMIT_LOGIN_PER_15MIN,
      15 * 60 * 1000,
      'Too many updates. Please try again in a few minutes.',
    );

    const body = await request.json().catch(() => null);
    const payload = body && typeof body === 'object' && 'availability' in body
      ? (body as { availability: unknown }).availability
      : body;
    const parsed = doctorAvailabilitySchema.safeParse(payload);
    if (!parsed.success) {
      throw Errors.validation(
        'Please check your availability and try again.',
        toFieldErrors(parsed.error),
      );
    }

    const availability = await updateDoctorAvailabilitySettings(
      user.id,
      parsed.data,
    );
    return ok({ availability });
  } catch (error) {
    return handleRouteError(error, 'doctor availability update');
  }
}
