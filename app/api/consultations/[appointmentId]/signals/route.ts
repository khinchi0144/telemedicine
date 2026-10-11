import { assertCsrf } from '@/lib/auth/csrf';
import { requireApiUser } from '@/lib/auth/dal';
import { pollSignals, postSignal } from '@/lib/services/consultationService';
import { handleRouteError, ok } from '@/lib/utils/api-response';
import { Errors } from '@/lib/utils/errors';
import { toFieldErrors } from '@/lib/validations/auth';
import { signalSchema } from '@/lib/validations/care';

interface RouteContext {
  params: Promise<{ appointmentId: string }>;
}

/**
 * GET /api/consultations/[appointmentId]/signals?since=<ISO>
 *
 * Polling read for the video room. Only the appointment's patient or doctor
 * may read (enforced in the service); everything written before `since` is
 * skipped so each client only receives signals it has not seen yet.
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await requireApiUser();
    const { appointmentId } = await context.params;
    const sinceRaw = new URL(request.url).searchParams.get('since');
    const sinceMs = sinceRaw ? Date.parse(sinceRaw) : NaN;
    const since = Number.isNaN(sinceMs) ? new Date(0) : new Date(sinceMs);

    const result = await pollSignals(user.id, appointmentId, since);
    return ok(result);
  } catch (error) {
    return handleRouteError(error, 'signal poll');
  }
}

/**
 * POST /api/consultations/[appointmentId]/signals
 *
 * Appends one SDP / ICE payload (or a join marker) to the room. Accepts the
 * patient *or* the doctor of the appointment — no role allow-list, because
 * the guard is appointment membership rather than the account role.
 */
export async function POST(request: Request, context: RouteContext) {
  try {
    assertCsrf(request);
    const user = await requireApiUser();
    const { appointmentId } = await context.params;

    const body = await request.json().catch(() => null);
    const parsed = signalSchema.safeParse(body);
    if (!parsed.success) {
      throw Errors.validation(
        'Invalid signal payload.',
        toFieldErrors(parsed.error),
      );
    }

    const signal = await postSignal(user.id, appointmentId, parsed.data.payload);
    return ok({ signal });
  } catch (error) {
    return handleRouteError(error, 'signal post');
  }
}