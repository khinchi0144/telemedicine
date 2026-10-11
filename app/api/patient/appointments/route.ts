import { assertCsrf } from '@/lib/auth/csrf';
import { requireApiUser } from '@/lib/auth/dal';
import { bookAppointment } from '@/lib/services/appointmentService';
import { created, handleRouteError } from '@/lib/utils/api-response';
import { Errors } from '@/lib/utils/errors';
import { toFieldErrors } from '@/lib/validations/auth';
import { bookAppointmentSchema } from '@/lib/validations/care';

/**
 * POST /api/patient/appointments
 *
 * Books one slot for the signed-in patient. The service re-validates the
 * doctor, the availability window and both sides' clashes after this schema
 * check, so a hand-crafted payload cannot double book anyone.
 */
export async function POST(request: Request) {
  try {
    assertCsrf(request);
    const user = await requireApiUser(['PATIENT']);

    const body = await request.json().catch(() => null);
    const parsed = bookAppointmentSchema.safeParse(body);
    if (!parsed.success) {
      throw Errors.validation(
        'Please check the appointment details you entered.',
        toFieldErrors(parsed.error),
      );
    }

    const appointment = await bookAppointment(user.id, parsed.data);
    return created({ appointment });
  } catch (error) {
    return handleRouteError(error, 'appointment booking');
  }
}