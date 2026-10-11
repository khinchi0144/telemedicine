import 'server-only';

import { env } from '@/lib/utils/env';

/**
 * Google OAuth availability.
 *
 * The "Continue with Google" button is always rendered so the login page
 * keeps a consistent look. When the credentials are missing the link is
 * disabled and explains why, instead of breaking the page.
 */
export function isGoogleOAuthEnabled(): boolean {
  return env.googleOAuthEnabled;
}

export function googleAuthUrl(): string {
  return '/api/auth/oauth/google';
}
