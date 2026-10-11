import { requireApiUser } from '@/lib/auth/dal';
import { listDoctorAppointments } from '@/lib/services/doctorAppointmentService';
import { handleRouteError, ok } from '@/lib/utils/api-response';

/**
 * GET /api/doctor/appointments
 *
 * Returns the signed-in doctor's own appointments, newest first, each with
 * the minimum patient display info the dashboard needs. The doctor identity
 * comes exclusively from the server session — no doctor id is accepted from
 * the request — and only VERIFIED doctors may read clinical appointments.
 */
export async function GET() {
  try {
    const user = await requireApiUser(['DOCTOR']);
    const appointments = await listDoctorAppointments(user.id);
    return ok({ appointments });
  } catch (error) {
    return handleRouteError(error, 'doctor appointments list');
  }
}
