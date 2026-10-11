import 'server-only';

import { Errors } from '@/lib/utils/errors';
import { readRegistrationTicket } from './registration-ticket';
import type { RegisterableRole, RegistrationTicketClaims } from '@/types/auth';

/**
 * Registration guard used by every register + upload endpoint.
 *
 * The ticket proves that the mobile number was verified with an OTP during the
 * current wizard. It is bound to the role, so a patient ticket cannot be
 * replayed to create a doctor or pharmacy account.
 */
export async function requireRegistrationTicket(
  role: RegisterableRole,
): Promise<RegistrationTicketClaims> {
  const ticket = await readRegistrationTicket();
  if (!ticket) throw Errors.otpNotVerified();
  if (ticket.role !== role) {
    throw Errors.forbidden(
      'This verification session was started for a different account type. Please start again.',
    );
  }
  return ticket;
}
