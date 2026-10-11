import { assertCsrf } from '@/lib/auth/csrf';
import { requireApiUser } from '@/lib/auth/dal';
import { pollSignals, postSignal } from '@/lib/services/consultationService';
import { handleRouteError, ok } from '@/lib/utils/api-response';
import { clientKey, enforceRateLimit } from '@/lib/utils/rate-limit';
import { Errors } from '@/lib/utils/errors';
import { toFieldErrors } from '@/lib/validations/auth';
import { signalSchema } from '@/lib/validations/care';

interface RouteContext {
  params: Promise<{ appointmentId: string }>;
}

/**
 * Signaling limits. The room polls roughly every 2.5s (~24 reads/min per
 * participant) and trickles SDP/ICE over POST, so the ceilings are generous —
 * they only stop runaway loops or abuse, not a normal consultation. Keys are
 * scoped to the authenticated user AND the appointment (both server-derived),
 * so one noisy room or client cannot starve another.
 */
const SIGNAL_WINDOW_MS = 60 * 1000;
const SIGNAL_POLL_LIMIT = 60; // ~2.5x the 24/min poll rate
const SIGNAL_POST_LIMIT = 120; // headroom for trickle ICE candidates

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
    enforceRateLimit(
      clientKey(request, 'signal-poll', `${user.id}:${appointmentId}`),
      SIGNAL_POLL_LIMIT,
      SIGNAL_WINDOW_MS,
    );
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
    enforceRateLimit(
      clientKey(request, 'signal-post', `${user.id}:${appointmentId}`),
      SIGNAL_POST_LIMIT,
      SIGNAL_WINDOW_MS,
    );

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