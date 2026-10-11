import { assertCsrf } from '@/lib/auth/csrf';
import { requireApiUser } from '@/lib/auth/dal';
import { addMedicalRecord } from '@/lib/services/recordService';
import { created, handleRouteError } from '@/lib/utils/api-response';
import { Errors } from '@/lib/utils/errors';
import { toFieldErrors } from '@/lib/validations/auth';
import { medicalRecordSchema } from '@/lib/validations/care';

/**
 * POST /api/patient/records
 *
 * Adds a record to the signed-in patient's own file. The patient id comes
 * from the session, never from the payload.
 */
export async function POST(request: Request) {
  try {
    assertCsrf(request);
    const user = await requireApiUser(['PATIENT']);

    const body = await request.json().catch(() => null);
    const parsed = medicalRecordSchema.safeParse(body);
    if (!parsed.success) {
      throw Errors.validation(
        'Please check the record details you entered.',
        toFieldErrors(parsed.error),
      );
    }

    const record = await addMedicalRecord(user.id, parsed.data);
    return created({ record });
  } catch (error) {
    return handleRouteError(error, 'medical record create');
  }
}