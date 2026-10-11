import { assertCsrf } from '@/lib/auth/csrf';
import { requireApiUser } from '@/lib/auth/dal';
import { placeOrder } from '@/lib/services/orderService';
import { created, handleRouteError } from '@/lib/utils/api-response';
import { Errors } from '@/lib/utils/errors';
import { toFieldErrors } from '@/lib/validations/auth';
import { placeOrderSchema } from '@/lib/validations/care';

/**
 * POST /api/patient/orders
 *
 * Places an order from cart lines `{ medicineId, quantity }`. The service
 * resolves price and stock from inventory server side, so the payload never
 * carries a trusted price; the store then validates and decrements stock in
 * one atomic step.
 */
export async function POST(request: Request) {
  try {
    assertCsrf(request);
    const user = await requireApiUser(['PATIENT']);

    const body = await request.json().catch(() => null);
    const parsed = placeOrderSchema.safeParse(body);
    if (!parsed.success) {
      throw Errors.validation(
        'Please check your order and try again.',
        toFieldErrors(parsed.error),
      );
    }

    const order = await placeOrder(user.id, parsed.data);
    return created({ order });
  } catch (error) {
    return handleRouteError(error, 'order placement');
  }
}