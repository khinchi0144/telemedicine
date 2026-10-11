import { requireApiUser } from '@/lib/auth/dal';
import { getDoctorSlots } from '@/lib/services/appointmentService';
import { handleRouteError, ok } from '@/lib/utils/api-response';
import { Errors } from '@/lib/utils/errors';
import { slotsQuerySchema } from '@/lib/validations/care';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/patient/doctors/[id]/slots?date=YYYY-MM-DD
 *
 * Returns the doctor's 30 minute slots for one day with an `available` flag
 * per slot (taken and past times come back as false, not filtered out, so the
 * picker can explain why a time cannot be chosen).
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    await requireApiUser(['PATIENT']);
    const { id } = await context.params;

    const date = new URL(request.url).searchParams.get('date') ?? '';
    const parsed = slotsQuerySchema.safeParse({ date });
    if (!parsed.success) {
      throw Errors.validation('Please pick a valid date.');
    }

    const { doctor, slots } = await getDoctorSlots(id, parsed.data.date);
    return ok({
      doctor: {
        id: doctor.id,
        fullName: doctor.fullName,
        specialization: doctor.specialization,
        consultationFee: doctor.consultationFee,
        city: doctor.city,
      },
      date: parsed.data.date,
      slots,
    });
  } catch (error) {
    return handleRouteError(error, 'doctor slots lookup');
  }
}