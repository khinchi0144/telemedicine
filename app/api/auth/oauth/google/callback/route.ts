import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { getStore } from '@/lib/db';
import { env } from '@/lib/utils/env';
import { logger } from '@/lib/utils/logger';
import { isGoogleOAuthEnabled } from '@/lib/auth/oauth-config';
import { setSessionCookie } from '@/lib/auth/session';
import { resolveFullName } from '@/lib/services/userService';
import { toSessionUser } from '@/lib/auth/session';
import { ROLE_HOME } from '@/lib/constants/roles';
import { safeCompare } from '@/lib/utils/crypto';

const STATE_COOKIE = 'medicare_oauth_state';
const VERIFIER_COOKIE = 'medicare_oauth_verifier';

interface GoogleProfile {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
}

/**
 * GET /api/auth/oauth/google/callback
 *
 * Completes the authorization code flow, links the Google identity to an
 * existing MediCare account and signs the user in. Unknown Google accounts are
 * sent to the registration role selection instead of being auto-created, so a
 * patient, doctor or pharmacy role is always chosen explicitly.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const fail = (reason: string) => {
    const target = new URL('/auth/login', request.url);
    target.searchParams.set('error', reason);
    return NextResponse.redirect(target);
  };

  if (!isGoogleOAuthEnabled()) return fail('oauth_not_configured');

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  if (error || !code || !state) return fail('oauth_cancelled');

  const jar = await cookies();
  const expectedState = jar.get(STATE_COOKIE)?.value;
  const verifier = jar.get(VERIFIER_COOKIE)?.value;
  jar.delete(STATE_COOKIE);
  jar.delete(VERIFIER_COOKIE);

  if (!expectedState || !verifier || !safeCompare(expectedState, state)) {
    return fail('oauth_state_mismatch');
  }

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${env.APP_URL}/api/auth/oauth/google/callback`,
      grant_type: 'authorization_code',
      code_verifier: verifier,
    }),
  });

  if (!tokenResponse.ok) {
    logger.warn('Google token exchange failed', { status: tokenResponse.status });
    return fail('oauth_failed');
  }

  const tokens = (await tokenResponse.json()) as { access_token?: string };
  if (!tokens.access_token) return fail('oauth_failed');

  const profileResponse = await fetch(
    'https://www.googleapis.com/oauth2/v3/userinfo',
    { headers: { Authorization: `Bearer ${tokens.access_token}` } },
  );
  if (!profileResponse.ok) return fail('oauth_failed');

  const profile = (await profileResponse.json()) as GoogleProfile;
  if (!profile.sub) return fail('oauth_failed');

  const store = await getStore();
  let user = await store.findUserByLinkedAccount('GOOGLE', profile.sub);

  if (!user && profile.email) {
    const existing = await store.findUserByEmail(profile.email);
    if (existing) {
      await store.upsertLinkedAccount({
        userId: existing.id,
        provider: 'GOOGLE',
        providerAccountId: profile.sub,
      });
      user = existing;
    }
  }

  if (!user) {
    // No MediCare account yet: continue in the normal registration flow.
    const target = new URL('/auth/register', request.url);
    target.searchParams.set('oauth', 'pending');
    return NextResponse.redirect(target);
  }

  if (user.status === 'SUSPENDED' || user.status === 'DELETED') {
    return fail('account_suspended');
  }

  const fullName = await resolveFullName(user.id, user.role, user.email);
  const sessionUser = toSessionUser({
    id: user.id,
    role: user.role,
    email: user.email,
    mobile: user.mobile,
    status: user.status,
    fullName,
  });

  await store.updateUser(user.id, { lastLoginAt: new Date() });
  await setSessionCookie({
    userId: sessionUser.id,
    role: sessionUser.role,
    status: sessionUser.status,
  });

  logger.info('Google sign in completed', { role: user.role, userId: user.id });
  return NextResponse.redirect(new URL(ROLE_HOME[user.role] ?? '/patient', request.url));
}
