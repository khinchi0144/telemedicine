import { assertCsrf } from '@/lib/auth/csrf';
import { requireApiUser } from '@/lib/auth/dal';
import { cancelAppointment } from '@/lib/services/appointmentService';
import { handleRouteError, ok } from '@/lib/utils/api-response';
import { Errors } from '@/lib/utils/errors';
import { toFieldErrors } from '@/lib/validations/auth';
import { cancelAppointmentSchema } from '@/lib/validations/care';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/patient/appointments/[id]
 *
 * Patients can only cancel their own appointments — the payload schema
 * accepts nothing but `status: "CANCELLED"` and the service re-checks
 * ownership, so another patient's id or a status escalation is rejected.
 */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    assertCsrf(request);
    const user = await requireApiUser(['PATIENT']);
    const { id } = await context.params;

    const body = await request.json().catch(() => null);
    const parsed = cancelAppointmentSchema.safeParse(body);
    if (!parsed.success) {
      throw Errors.validation(
        'This appointment cannot be cancelled.',
        toFieldErrors(parsed.error),
      );
    }

    const appointment = await cancelAppointment(user.id, id, parsed.data.reason);
    return ok({ appointment });
  } catch (error) {
    return handleRouteError(error, 'appointment cancel');
  }
}