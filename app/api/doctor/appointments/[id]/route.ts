import { assertCsrf } from '@/lib/auth/csrf';
import { requireApiUser } from '@/lib/auth/dal';
import { updateDoctorAppointmentStatus } from '@/lib/services/doctorAppointmentService';
import { handleRouteError, ok } from '@/lib/utils/api-response';
import { clientKey, enforceRateLimit } from '@/lib/utils/rate-limit';
import { env } from '@/lib/utils/env';
import { Errors } from '@/lib/utils/errors';
import { toFieldErrors } from '@/lib/validations/auth';
import { doctorUpdateAppointmentSchema } from '@/lib/validations/care';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/doctor/appointments/[id]
 *
 * Doctor-side status management: CONFIRMED → COMPLETED / NO_SHOW / CANCELLED.
 * The doctor identity comes exclusively from the server session; ownership
 * and VERIFIED profile are re-checked in the service, and the store applies
 * the change conditionally so a concurrent cancellation surfaces as a 409.
 */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    assertCsrf(request);
    const user = await requireApiUser(['DOCTOR']);
    enforceRateLimit(
      clientKey(request, 'doctor-appointment-update', user.id),
      env.RATE_LIMIT_LOGIN_PER_15MIN,
      15 * 60 * 1000,
      'Too many updates. Please try again in a few minutes.',
    );
    const { id } = await context.params;

    const body = await request.json().catch(() => null);
    const parsed = doctorUpdateAppointmentSchema.safeParse(body);
    if (!parsed.success) {
      throw Errors.validation(
        'This appointment status cannot be updated.',
        toFieldErrors(parsed.error),
      );
    }

    const appointment = await updateDoctorAppointmentStatus(
      user.id,
      id,
      parsed.data.status,
    );
    return ok({ appointment });
  } catch (error) {
    return handleRouteError(error, 'doctor appointment update');
  }
}
