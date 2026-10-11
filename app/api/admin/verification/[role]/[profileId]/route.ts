import { assertCsrf } from '@/lib/auth/csrf';
import { requireApiUser } from '@/lib/auth/dal';
import { Errors } from '@/lib/utils/errors';
import { handleRouteError, ok } from '@/lib/utils/api-response';
import { isReviewDecision, reviewProfile } from '@/lib/services/verificationService';

interface RouteContext {
  params: Promise<{ role: string; profileId: string }>;
}

/**
 * PATCH /api/admin/verification/[role]/[profileId]
 *
 * Approve or reject a doctor / pharmacy profile.
 *
 * Security: the ADMIN check and the CSRF check both run before any write, and
 * the decision value is validated against an allow-list — the client can never
 * set an arbitrary verification status.
 */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    assertCsrf(request);
    await requireApiUser(['ADMIN']);

    const { role, profileId } = await context.params;
    if (role !== 'DOCTOR' && role !== 'PHARMACY') {
      throw Errors.validation('Only DOCTOR and PHARMACY profiles can be reviewed.');
    }

    const body: unknown = await request.json().catch(() => null);
    const decision =
      body && typeof body === 'object' && 'decision' in body
        ? (body as { decision: unknown }).decision
        : undefined;

    if (!isReviewDecision(decision)) {
      throw Errors.validation('decision must be VERIFIED or REJECTED.');
    }

    const result = await reviewProfile({ role, profileId, decision });
    if (!result.ok) {
      throw result.code === 404
        ? Errors.notFound(result.error)
        : Errors.validation(result.error);
    }

    return ok({ entry: result.entry });
  } catch (error) {
    return handleRouteError(error, 'admin verification decision');
  }
}