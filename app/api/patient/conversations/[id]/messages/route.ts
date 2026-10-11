import { assertCsrf } from '@/lib/auth/csrf';
import { requireApiUser } from '@/lib/auth/dal';
import { getThread, sendMessage } from '@/lib/services/messagingService';
import { handleRouteError, ok } from '@/lib/utils/api-response';
import { Errors } from '@/lib/utils/errors';
import { toFieldErrors } from '@/lib/validations/auth';
import { sendMessageSchema } from '@/lib/validations/care';
import type { SessionUser } from '@/types/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Clinical messaging is doctor-facing, so a DOCTOR caller must hold a VERIFIED
 * profile — the same gate every other doctor module applies. Patients are
 * unaffected. Thread membership itself is still enforced in the service on
 * every read and write, so this only gates the doctor's account status.
 */
function assertDoctorAccess(user: SessionUser) {
  if (user.role === 'DOCTOR' && user.verificationStatus !== 'VERIFIED') {
    throw Errors.forbidden(
      'Your account is pending verification. Messages unlock once an admin approves your profile.',
    );
  }
}

/**
 * GET /api/patient/conversations/[id]/messages
 *
 * Full history of one of the caller's own threads — the thread view polls
 * this endpoint to pick up replies. Accessible to the thread's patient OR its
 * doctor; ownership is enforced in the service.
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await requireApiUser(['PATIENT', 'DOCTOR']);
    assertDoctorAccess(user);
    const { id } = await context.params;
    const thread = await getThread(user.id, id);
    return ok({ messages: thread.messages, lastMessageAt: thread.conversation.lastMessageAt });
  } catch (error) {
    return handleRouteError(error, 'message list');
  }
}

/**
 * POST /api/patient/conversations/[id]/messages
 * Appends the signed-in participant's (patient or verified doctor) message to
 * their own thread. CSRF-protected like every mutation.
 */
export async function POST(request: Request, context: RouteContext) {
  try {
    assertCsrf(request);
    const user = await requireApiUser(['PATIENT', 'DOCTOR']);
    assertDoctorAccess(user);
    const { id } = await context.params;

    const body = await request.json().catch(() => null);
    const parsed = sendMessageSchema.safeParse(body);
    if (!parsed.success) {
      throw Errors.validation(
        'Please write a message before sending.',
        toFieldErrors(parsed.error),
      );
    }

    const message = await sendMessage(user.id, id, parsed.data.body);
    return ok({ message });
  } catch (error) {
    return handleRouteError(error, 'message send');
  }
}