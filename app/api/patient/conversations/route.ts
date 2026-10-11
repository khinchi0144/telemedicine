import { assertCsrf } from '@/lib/auth/csrf';
import { requireApiUser } from '@/lib/auth/dal';
import { startConversation } from '@/lib/services/messagingService';
import { handleRouteError, ok } from '@/lib/utils/api-response';
import { Errors } from '@/lib/utils/errors';
import { toFieldErrors } from '@/lib/validations/auth';
import { startConversationSchema } from '@/lib/validations/care';

/**
 * POST /api/patient/conversations
 *
 * Opens (or returns) the one conversation between the signed-in patient and
 * a verified doctor. The service resolves and validates the doctor, so the
 * client cannot open threads with arbitrary user ids.
 */
export async function POST(request: Request) {
  try {
    assertCsrf(request);
    const user = await requireApiUser(['PATIENT']);

    const body = await request.json().catch(() => null);
    const parsed = startConversationSchema.safeParse(body);
    if (!parsed.success) {
      throw Errors.validation(
        'Please choose a doctor to message.',
        toFieldErrors(parsed.error),
      );
    }

    const conversation = await startConversation(user.id, parsed.data.doctorUserId);
    return ok({ conversation });
  } catch (error) {
    return handleRouteError(error, 'conversation start');
  }
}