import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { EcosystemVisual } from '@/components/auth/register/EcosystemVisual';
import { RegisterRoleSelect } from '@/components/auth/register/RegisterRoleSelect';
import { getSessionUser } from '@/lib/auth/dal';
import { ROLE_HOME } from '@/lib/constants/roles';
import { APP_NAME } from '@/lib/constants/app';

export const metadata: Metadata = {
  title: 'Create an Account',
  description:
    'Choose your account type to continue — patient, doctor or pharmacy.',
};

/**
 * Registration selection screen.
 *
 * The signed-in redirect is preserved exactly as before, so an authenticated
 * user still lands on their role home instead of this page. Card destinations
 * come from `ROLE_DEFINITIONS[].registerPath` — no invented routes.
 */
export default async function RegisterPage() {
  const user = await getSessionUser();
  if (user) redirect(ROLE_HOME[user.role] ?? '/patient');

  return (
    <div className="relative flex min-h-dvh flex-col bg-background">
      {/* Ambient background wash — purely decorative. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="mesh-gradient absolute -inset-x-40 -top-40 h-[42rem] opacity-70" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-background to-transparent" />
      </div>

      <main
        id="main-content"
        className="relative mx-auto w-full max-w-[1400px] flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-14"
      >
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-14 xl:gap-20">
          {/* Left: brand, copy and the three account cards. */}
          <RegisterRoleSelect />

          {/* Right: 3D ecosystem visual. Hidden below `lg`, where it would only
              push the cards below the fold. */}
          <EcosystemVisual className="hidden lg:flex" />
        </div>
      </main>

      <footer className="relative border-t border-border/70 bg-card/60 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col items-center justify-between gap-4 px-4 py-5 sm:flex-row sm:px-6 lg:px-10">
          <Link
            href="/auth"
            className="inline-flex items-center gap-1.5 rounded-md text-[13px] font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Back to sign in
          </Link>

          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>

          <nav aria-label="Legal" className="flex items-center gap-5 text-xs">
            <Link href="/terms" className="text-muted-foreground hover:text-primary">
              Terms
            </Link>
            <Link href="/privacy" className="text-muted-foreground hover:text-primary">
              Privacy Policy
            </Link>
            <Link href="/support" className="text-muted-foreground hover:text-primary">
              Support
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}