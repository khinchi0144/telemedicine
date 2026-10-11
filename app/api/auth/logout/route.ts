import { assertCsrf } from '@/lib/auth/csrf';
import { clearSessionCookie } from '@/lib/auth/session';
import { clearRegistrationTicket } from '@/lib/auth/registration-ticket';
import { handleRouteError, ok } from '@/lib/utils/api-response';

/** POST /api/auth/logout — clears the session and the registration ticket. */
export async function POST(request: Request) {
  try {
    assertCsrf(request);
    await clearSessionCookie();
    await clearRegistrationTicket();
    return ok({ signedOut: true });
  } catch (error) {
    return handleRouteError(error, 'logout');
  }
}
