import Link from 'next/link';
import { ArrowLeft, Lock, ShieldCheck } from 'lucide-react';

import { Logo } from '@/components/common/Logo';
import { APP_NAME, APP_TAGLINE } from '@/lib/constants/app';

export interface RegistrationLayoutProps {
  children: React.ReactNode;
  /** Shown in the header, e.g. "Patient". */
  role: string;
  /** Link back to the auth landing page. */
  homePath?: string;
  asideTitle: string;
  asidePoints: string[];
}

/**
 * Chrome for the three registration wizards.
 * Keeps the header, the centred card and the footer consistent while each
 * wizard owns its own step chrome and forms.
 */
export function RegistrationLayout({
  children,
  role,
  homePath = '/auth',
  asideTitle,
  asidePoints,
}: RegistrationLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-surface-muted">
      <header className="border-b border-border/70 bg-card/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6">
          <Logo href="/" size="sm" />
          <p className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              {role} account
            </span>
            <span className="text-xs">{APP_TAGLINE}</span>
          </p>
          <Link
            href={homePath}
            className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Back</span>
          </Link>
        </div>
      </header>

      <main
        id="main-content"
        className="flex flex-1 items-start justify-center px-4 py-6 sm:px-6 sm:py-10"
      >
        {/*
          Two column layout on large screens. `minmax(0, …)` on the first track
          is what lets the form card shrink instead of forcing the grid (and
          therefore the stepper) to overflow; the second track keeps a 320px
          floor so the information panel never collapses below readability.
        */}
        <div className="grid w-full max-w-[1280px] grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.7fr)] lg:gap-10 xl:gap-12">
          <div className="mx-auto w-full min-w-0 max-w-none lg:mx-0">
            <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-border bg-card p-5 medicare-elevated-shadow sm:p-6 lg:p-8">
              {children}
            </div>
          </div>

          {/*
            Kept in the same grid: on large screens it is the right hand column,
            below `lg` the grid collapses to one column so the panel naturally
            moves underneath the form card instead of overlapping it.
          */}
          <aside className="w-full min-w-0 lg:pt-1">
            <div className="space-y-6">
              <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 medicare-card-shadow">
                <div
                  aria-hidden="true"
                  className="medicare-grid-bg absolute inset-0 opacity-60"
                />
                <div className="relative space-y-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    <ShieldCheck className="size-3.5" aria-hidden="true" />
                    Secure registration
                  </span>
                  <p className="text-base font-semibold leading-snug">{asideTitle}</p>
                </div>
              </div>

              <ul className="space-y-3">
                {asidePoints.map((point) => (
                  <li key={point} className="flex gap-2.5 text-sm text-muted-foreground">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary"
                    />
                    <span className="leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>

              <p className="flex items-start gap-2 rounded-xl border border-border bg-card p-4 text-xs leading-relaxed text-muted-foreground">
                <Lock className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
                Your password is hashed before it is stored and your documents are
                kept in private storage. We never share your information with
                third parties without your consent.
              </p>
            </div>
          </aside>
        </div>
      </main>

      <footer className="border-t border-border/70 bg-card/60 py-5">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center justify-between gap-3 px-4 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <p>
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
          <p className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              Privacy Policy
            </Link>
            <Link href="/support" className="hover:text-foreground">
              Support
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
