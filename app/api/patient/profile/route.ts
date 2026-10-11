import { assertCsrf } from '@/lib/auth/csrf';
import { requireApiUser } from '@/lib/auth/dal';
import { handleRouteError, ok } from '@/lib/utils/api-response';
import { patientProfileUpdateSchema } from '@/lib/validations/patient';
import { toFieldErrors } from '@/lib/validations/auth';
import { updatePatientProfile } from '@/lib/services/patientProfileService';
import { Errors } from '@/lib/utils/errors';

/**
 * PATCH /api/patient/profile
 *
 * Edits the signed-in patient's own profile.
 *
 * `requireApiUser(['PATIENT'])` runs before anything is read or written, so a
 * doctor or pharmacy session is rejected with 403 rather than being able to
 * touch a patient record. Email, mobile, role and verification status are not
 * part of this payload at all.
 */
export async function PATCH(request: Request) {
  try {
    assertCsrf(request);
    const user = await requireApiUser(['PATIENT']);

    const body = await request.json().catch(() => null);
    const parsed = patientProfileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      throw Errors.validation(
        'Please check the details you entered.',
        toFieldErrors(parsed.error),
      );
    }

    const profile = await updatePatientProfile(user.id, parsed.data);
    return ok({ profile });
  } catch (error) {
    return handleRouteError(error, 'patient profile update');
  }
}