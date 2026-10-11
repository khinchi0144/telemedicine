'use client';

import { cn } from '@/lib/utils/cn';

export interface GoogleButtonProps {
  enabled: boolean;
  className?: string;
}

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn('size-4', className)}>
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.45a5.5 5.5 0 0 1-2.39 3.61v3h3.86c2.26-2.09 3.58-5.17 3.58-8.8Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.94-2.91l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.95H1.29v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58v-3.1H1.29a12 12 0 0 0 0 10.78l3.98-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.29 6.61l3.98 3.1C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

/**
 * "Continue with Google".
 *
 * When OAuth is not configured the button stays visible but disabled, with an
 * accessible explanation — the login page must never break because a
 * third-party credential is missing.
 */
export function GoogleButton({ enabled, className }: GoogleButtonProps) {
  if (!enabled) {
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        title="Google sign in is not configured for this environment"
        className={cn(
          'flex h-11 w-full cursor-not-allowed items-center justify-center gap-2.5 rounded-lg border border-input bg-card px-4 text-sm font-medium text-muted-foreground opacity-70',
          className,
        )}
      >
        <GoogleMark />
        Continue with Google
        <span className="sr-only">(not configured for this environment)</span>
      </button>
    );
  }

  return (
    <a
      href="/api/auth/oauth/google"
      className={cn(
        'flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-input bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className,
      )}
    >
      <GoogleMark />
      Continue with Google
    </a>
  );
}
