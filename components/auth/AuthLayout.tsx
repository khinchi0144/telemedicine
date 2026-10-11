import Link from 'next/link';
import { Lock, ShieldCheck, Stethoscope } from 'lucide-react';

import { Logo } from '@/components/common/Logo';
import { cn } from '@/lib/utils/cn';
import { APP_NAME, APP_TAGLINE } from '@/lib/constants/app';

export interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  /** Shows the illustrative side panel on large screens. */
  showAside?: boolean;
  /** Sticky footer links (Terms / Privacy). */
  footer?: React.ReactNode;
  header?: React.ReactNode;
  contentClassName?: string;
  /** Full width layout used by the multi step registration wizards. */
  wide?: boolean;
}

const TRUST_POINTS = [
  {
    icon: ShieldCheck,
    title: 'Verified professionals',
    text: 'Doctor and pharmacy accounts are reviewed before their profile goes live.',
  },
  {
    icon: Stethoscope,
    title: 'Private by design',
    text: 'Your health information and documents are stored securely and never shared publicly.',
  },
  {
    icon: Lock,
    title: 'Secure sessions',
    text: 'Encrypted, HTTP-only sessions protect every sign in.',
  },
];

/**
 * Shared shell for every authentication and registration screen.
 * Mobile first: single column, large touch targets, no horizontal scrolling.
 */
export function AuthLayout({
  children,
  title,
  description,
  showAside = true,
  footer,
  header,
  contentClassName,
  wide = false,
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-surface-muted">
      <header className="border-b border-border/70 bg-card/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo href="/" size="sm" />
          <Link
            href="/auth"
            className="rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {APP_TAGLINE}
          </Link>
        </div>
      </header>

      <main
        id="main-content"
        className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-10"
      >
        <div
          className={cn(
            'grid w-full gap-8',
            showAside ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-14' : 'max-w-lg',
            !showAside && 'mx-auto',
            wide && showAside && 'max-w-6xl',
            !wide && showAside && 'max-w-5xl',
          )}
        >
          <div className={cn('mx-auto w-full', wide ? 'max-w-2xl' : 'max-w-md lg:mx-0')}>
            {header}
            <div
              className={cn(
                'rounded-2xl border border-border bg-card p-6 medicare-elevated-shadow sm:p-8',
                contentClassName,
              )}
            >
              <div className="mb-6 space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">
                  {title}
                </h1>
                {description && (
                  <p className="text-[15px] leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                )}
              </div>
              {children}
            </div>
            {footer}
          </div>

          {showAside && <AuthAside />}
        </div>
      </main>

      <footer className="border-t border-border/70 bg-card/60 py-5">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 text-xs text-muted-foreground sm:flex-row sm:px-6">
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

/** Right hand panel: a calm healthcare visual + trust points. */
function AuthAside() {
  return (
    <aside className="hidden lg:flex lg:flex-col lg:justify-center lg:gap-8">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 medicare-card-shadow">
        <div
          aria-hidden="true"
          className="medicare-grid-bg absolute inset-0 opacity-60"
        />
        <div className="relative space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            Trusted healthcare platform
          </span>
          <p className="text-xl font-semibold leading-snug tracking-tight">
            One account for consultations, prescriptions and pharmacy services.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {APP_NAME} brings patients, verified doctors and registered pharmacies
            together in a single, secure place.
          </p>
        </div>
      </div>

      <ul className="space-y-4">
        {TRUST_POINTS.map((point) => (
          <li key={point.title} className="flex gap-3.5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
              <point.icon className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-medium">{point.title}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                {point.text}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
