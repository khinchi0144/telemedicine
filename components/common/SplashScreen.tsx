'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { Logo } from '@/components/common/Logo';
import { APP_NAME, APP_TAGLINE } from '@/lib/constants/app';

const SPLASH_DURATION_MS = 1600;

/**
 * Branded splash shown for a moment on a cold start, then the user is moved
 * to the authentication screen. The animation is intentionally subtle.
 */
export function SplashScreen() {
  const router = useRouter();
  const [leaving, setLeaving] = React.useState(false);

  React.useEffect(() => {
    const leaveTimer = window.setTimeout(() => setLeaving(true), SPLASH_DURATION_MS);
    const redirectTimer = window.setTimeout(() => {
      router.replace('/auth');
    }, SPLASH_DURATION_MS + 260);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(redirectTimer);
    };
  }, [router]);

  return (
    <div
      className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background px-6"
      aria-busy="true"
      aria-live="polite"
    >
      <div
        aria-hidden="true"
        className="medicare-grid-bg pointer-events-none absolute inset-0 opacity-70"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl"
      />

      <div
        className={`relative flex flex-col items-center gap-7 text-center transition-opacity duration-300 ${
          leaving ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <Logo size="lg" showText={false} />

        <div className="space-y-3">
          <p className="text-3xl font-semibold tracking-tight sm:text-4xl">{APP_NAME}</p>
          <p className="text-lg font-medium text-primary sm:text-xl">{APP_TAGLINE}</p>
          <p className="mx-auto max-w-sm text-[15px] leading-relaxed text-muted-foreground">
            Connect with trusted healthcare professionals.
          </p>
        </div>

        <div className="mt-2 flex flex-col items-center gap-3">
          <span
            className="h-1 w-40 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label="Loading MediCare"
          >
            <span className="medicare-splash-bar block h-full w-1/3 rounded-full bg-primary" />
          </span>
          <span className="text-xs font-medium text-muted-foreground">Loading…</span>
        </div>
      </div>

      <style jsx>{`
        @keyframes medicareSplash {
          0% {
            transform: translateX(-120%);
          }
          100% {
            transform: translateX(320%);
          }
        }
        .medicare-splash-bar {
          animation: medicareSplash 1.25s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
