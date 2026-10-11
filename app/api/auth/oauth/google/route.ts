import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { env } from '@/lib/utils/env';
import { logger } from '@/lib/utils/logger';
import { isGoogleOAuthEnabled } from '@/lib/auth/oauth-config';
import { randomToken } from '@/lib/utils/crypto';
import { createHash } from 'node:crypto';

const STATE_COOKIE = 'medicare_oauth_state';
const VERIFIER_COOKIE = 'medicare_oauth_verifier';
const TEN_MINUTES = 10 * 60;

/**
 * GET /api/auth/oauth/google
 *
 * Starts the Google authorization code flow with PKCE + state.
 * When the credentials are not configured the user is sent back to the login
 * page with a clear message instead of an error screen.
 */
export async function GET(request: Request) {
  if (!isGoogleOAuthEnabled()) {
    const url = new URL('/auth/login', request.url);
    url.searchParams.set('error', 'oauth_not_configured');
    return NextResponse.redirect(url);
  }

  const state = randomToken(16);
  const verifier = randomToken(48);
  const challenge = createHash('sha256').update(verifier).digest('base64url');

  const jar = await cookies();
  const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: env.isProduction,
    path: '/',
    maxAge: TEN_MINUTES,
  };
  jar.set(STATE_COOKIE, state, cookieOptions);
  jar.set(VERIFIER_COOKIE, verifier, cookieOptions);

  const redirectUri = `${env.APP_URL}/api/auth/oauth/google/callback`;
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    prompt: 'select_account',
  });

  logger.info('Google OAuth flow started');
  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
  );
}
