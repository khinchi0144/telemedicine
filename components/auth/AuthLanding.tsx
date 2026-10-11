import Link from 'next/link';
import { CalendarCheck, ClipboardList, Lock, ShieldCheck, Stethoscope, Store, User } from 'lucide-react';

import { AuthLayout } from './AuthLayout';
import { Logo } from '@/components/common/Logo';
import { Button } from '@/components/ui/button';
import { APP_DESCRIPTION, APP_TAGLINE } from '@/lib/constants/app';

const HIGHLIGHTS = [
  {
    icon: CalendarCheck,
    title: 'Consultations',
    text: 'Connect with healthcare professionals from home.',
  },
  {
    icon: Stethoscope,
    title: 'Verified doctors',
    text: 'Profiles are reviewed before they go live.',
  },
  {
    icon: Store,
    title: 'Registered pharmacies',
    text: 'Order from verified local pharmacies.',
  },
];

/**
 * /auth — the single entry point for all three account types.
 * Deliberately free of role selection: the account type is chosen in the
 * registration wizard.
 */
export function AuthLanding() {
  return (
    <AuthLayout
      showAside={false}
      title={APP_TAGLINE}
      description={APP_DESCRIPTION}
      contentClassName="p-0 sm:p-0"
    >
      <div className="px-6 pb-7 sm:px-8 sm:pb-8">
        <div className="grid gap-3 sm:grid-cols-2">
          <Button asChild size="lg" block>
            <Link href="/auth/login">Login</Link>
          </Button>
          <Button asChild size="lg" variant="outline" block>
            <Link href="/auth/register">Register</Link>
          </Button>
        </div>

        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Lock className="size-3.5" aria-hidden="true" />
            Secure sign in
          </span>
          <span aria-hidden="true" className="h-3 w-px bg-border" />
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            Private by design
          </span>
        </div>
      </div>

      <section
        aria-label="What MediCare offers"
        className="border-t border-border bg-surface-muted px-6 py-7 sm:px-8"
      >
        <div className="mb-4 flex items-center gap-2.5">
          <Logo size="sm" showText={false} />
          <p className="text-sm font-semibold">One platform, three ways to connect</p>
        </div>
        <ul className="grid gap-4 sm:grid-cols-3">
          {HIGHLIGHTS.map((item) => (
            <li key={item.title} className="flex gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                <item.icon className="size-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[13px] font-medium leading-tight">{item.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {item.text}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-label="Who can register"
        className="border-t border-border px-6 py-5 sm:px-8"
      >
        <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <ClipboardList className="size-3.5" aria-hidden="true" />
          Who can register
        </p>
        <ul className="grid gap-2 sm:grid-cols-3">
          {[
            { icon: User, label: 'Patients' },
            { icon: Stethoscope, label: 'Doctors' },
            { icon: Store, label: 'Pharmacies' },
          ].map((item) => (
            <li
              key={item.label}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-[13px] font-medium"
            >
              <item.icon className="size-4 text-primary" aria-hidden="true" />
              {item.label}
            </li>
          ))}
        </ul>
      </section>
    </AuthLayout>
  );
}
