import { assertCsrf } from '@/lib/auth/csrf';
import { requireApiUser } from '@/lib/auth/dal';
import { deleteMedicalRecord } from '@/lib/services/recordService';
import { handleRouteError, ok } from '@/lib/utils/api-response';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * DELETE /api/patient/records/[id]
 *
 * Removes a record from the signed-in patient's own file. The service
 * re-checks ownership, so another patient's record id returns 404.
 */
export async function DELETE(request: Request, context: RouteContext) {
  try {
    assertCsrf(request);
    const user = await requireApiUser(['PATIENT']);
    const { id } = await context.params;

    await deleteMedicalRecord(user.id, id);
    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error, 'medical record delete');
  }
}