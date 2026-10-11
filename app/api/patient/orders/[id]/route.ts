import { assertCsrf } from '@/lib/auth/csrf';
import { requireApiUser } from '@/lib/auth/dal';
import { cancelOrder } from '@/lib/services/orderService';
import { handleRouteError, ok } from '@/lib/utils/api-response';
import { Errors } from '@/lib/utils/errors';
import { toFieldErrors } from '@/lib/validations/auth';
import { cancelOrderSchema } from '@/lib/validations/care';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/patient/orders/[id]
 *
 * Patients may only cancel their own `PLACED` orders — the schema accepts
 * nothing but `status: "CANCELLED"` and the service re-checks ownership.
 */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    assertCsrf(request);
    const user = await requireApiUser(['PATIENT']);
    const { id } = await context.params;

    const body = await request.json().catch(() => null);
    const parsed = cancelOrderSchema.safeParse(body);
    if (!parsed.success) {
      throw Errors.validation(
        'This order cannot be cancelled.',
        toFieldErrors(parsed.error),
      );
    }

    const order = await cancelOrder(user.id, id);
    return ok({ order });
  } catch (error) {
    return handleRouteError(error, 'order cancel');
  }
}