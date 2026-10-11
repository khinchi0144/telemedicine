'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { LifeBuoy, ShieldCheck } from 'lucide-react';

import { Logo } from '@/components/common/Logo';
import { AccountTypeCard } from '@/components/auth/register/AccountTypeCard';
import { ROLE_ORDER } from '@/lib/constants/roles';
import { cn } from '@/lib/utils/cn';

const SUBHEADING =
  'Connect with trusted doctors, manage consultations and access pharmacy services through one connected healthcare platform.';

/** Entrance helper — collapses to a plain div under reduced motion. */
function Enter({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Left column of the registration selection screen: brand header, hero copy and
 * the three premium account cards.
 *
 * Navigation is real: each card links to `ROLE_DEFINITIONS[role].registerPath`.
 */
export function RegisterRoleSelect({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col', className)}>
      {/* Brand header — logo, healthcare icon and support link. */}
      <Enter delay={0}>
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo href="/" size="md" />
            <span
              aria-hidden="true"
              className="hidden size-9 items-center justify-center rounded-xl bg-teal-50 text-primary sm:flex"
            >
              <ShieldCheck className="size-5" />
            </span>
          </div>

          <Link
            href="/support"
            className="group inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-[13px] font-semibold text-navy-700 shadow-[var(--shadow-xs)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <LifeBuoy className="size-4" aria-hidden="true" />
            Help &amp; Support
          </Link>
        </header>
      </Enter>

      {/* Hero copy. */}
      <Enter delay={0.1}>
        <div className="mt-10 sm:mt-14">
          <h1 className="max-w-2xl font-display text-[32px] font-extrabold leading-[1.1] tracking-tight text-navy-900 sm:text-[42px] lg:text-[48px]">
            Your Health Journey{' '}
            <span className="text-gradient-teal">Starts Here.</span>
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted-foreground sm:text-base">
            {SUBHEADING}
          </p>
        </div>
      </Enter>

      {/* Registration block. */}
      <Enter delay={0.2}>
        <div className="mt-10 sm:mt-12">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="font-display text-xl font-extrabold tracking-tight text-navy-900 sm:text-2xl">
              Create Your Account
            </h2>
            <span
              aria-hidden="true"
              className="hidden h-px flex-1 bg-gradient-to-r from-border to-transparent sm:block"
            />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose your account type to continue.
          </p>
        </div>
      </Enter>

      {/* Account cards — one row on desktop, stacked on mobile. */}
      <div className="mt-8 grid gap-5 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {ROLE_ORDER.map((role, index) => (
          <AccountTypeCard key={role} role={role} index={index} />
        ))}
      </div>

      <Enter delay={0.5}>
        <p className="mt-7 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          Doctor and pharmacy accounts are reviewed by our team before the
          professional dashboard becomes available. Patient accounts are activated
          right away.
        </p>
      </Enter>
    </div>
  );
}