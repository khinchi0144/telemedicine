import 'server-only';

import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

import { getSessionSecret } from '@/lib/utils/env';
import { REGISTRATION_TICKET_COOKIE } from './session';
import { randomToken } from '@/lib/utils/crypto';
import type {
  OtpPurpose,
  RegisterableRole,
  RegistrationTicketClaims,
} from '@/types/auth';

const ISSUER = 'medicare';
const AUDIENCE = 'medicare:registration';

/** A verified mobile number stays valid for 30 minutes across the wizard. */
const TICKET_TTL_SECONDS = 30 * 60;

function secretKey(): Uint8Array {
  return new TextEncoder().encode(getSessionSecret());
}

/**
 * Issues the "mobile number verified" ticket.
 *
 * After a successful OTP verification the ticket is stored in an HTTP-only
 * cookie. Registration endpoints and document uploads require it, so a client
 * cannot skip the OTP step or register a different mobile number than the one
 * that was verified.
 */
export async function issueRegistrationTicket(input: {
  role: RegisterableRole;
  mobile: string;
  purpose: OtpPurpose;
}): Promise<{ ticket: string; registrationId: string }> {
  const registrationId = randomToken(16);
  const ticket = await new SignJWT({
    role: input.role,
    mobile: input.mobile,
    purpose: input.purpose,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setJti(registrationId)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${TICKET_TTL_SECONDS}s`)
    .sign(secretKey());

  const store = await cookies();
  store.set(REGISTRATION_TICKET_COOKIE, ticket, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: TICKET_TTL_SECONDS,
  });

  return { ticket, registrationId };
}

export async function verifyRegistrationTicket(
  token: string | undefined,
): Promise<RegistrationTicketClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    if (
      !payload.jti ||
      typeof payload.mobile !== 'string' ||
      typeof payload.role !== 'string'
    ) {
      return null;
    }
    return {
      jti: payload.jti,
      mobile: payload.mobile,
      role: payload.role as RegisterableRole,
      purpose: payload.purpose as OtpPurpose,
      iat: payload.iat ?? 0,
      exp: payload.exp ?? 0,
    };
  } catch {
    return null;
  }
}

export async function readRegistrationTicket(): Promise<RegistrationTicketClaims | null> {
  const store = await cookies();
  return verifyRegistrationTicket(store.get(REGISTRATION_TICKET_COOKIE)?.value);
}

export async function clearRegistrationTicket() {
  const store = await cookies();
  store.delete(REGISTRATION_TICKET_COOKIE);
}
