'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';

import { cn } from '@/lib/utils/cn';
import { ROLE_DEFINITIONS } from '@/lib/constants/roles';
import { ROLE_ACCENT, ROLE_FEATURES, ROLE_TAGLINE } from './role-content';
import type { RegisterableRole } from '@/types/auth';

export interface AccountTypeCardProps {
  role: RegisterableRole;
  /** Entrance animation index — drives the stagger. */
  index?: number;
  className?: string;
}

/**
 * Premium account type card for the registration selection screen.
 *
 * Rendered as a single `Link` pointing at the role's real registration route
 * (`ROLE_DEFINITIONS[role].registerPath`), so it is keyboard reachable, forms
 * one large tap target, and never invents a destination.
 */
export function AccountTypeCard({
  role,
  index = 0,
  className,
}: AccountTypeCardProps) {
  const reduce = useReducedMotion();
  const definition = ROLE_DEFINITIONS[role];
  const accent = ROLE_ACCENT[role];
  const Icon = accent.icon;

  return (
    <motion.div
      className={cn('h-full', className)}
      initial={reduce ? false : { opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.65,
        delay: reduce ? 0 : 0.12 + index * 0.1,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <Link
        href={definition.registerPath}
        aria-label={`Continue as ${definition.title} — ${ROLE_TAGLINE[role]}`}
        className={cn(
          'group animated-ring relative flex h-full flex-col overflow-hidden rounded-3xl',
          'border border-border bg-card p-6 text-left shadow-[var(--shadow-premium)]',
          'transition-[transform,box-shadow,border-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
          'hover:-translate-y-1.5 hover:border-transparent hover:shadow-[var(--shadow-card-hover)]',
          'focus-visible:-translate-y-1.5 focus-visible:border-transparent focus-visible:outline-none',
          'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          'focus-visible:ring-offset-background',
          accent.ring,
        )}
      >
        {/* Role-tinted bloom that fades in on hover. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: accent.glow }}
        />

        {/* 3D-styled icon tile with a glass highlight. */}
        <span className="relative flex size-14 items-center justify-center">
          <span
            className={cn(
              'flex size-14 items-center justify-center rounded-2xl',
              'shadow-[0_10px_24px_-12px_rgba(8,127,140,0.85)]',
              'transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
              'group-hover:scale-105',
              accent.iconBg,
            )}
            aria-hidden="true"
          >
            <Icon className="size-7 text-white" strokeWidth={1.9} />
          </span>
          <span className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_30%_18%,rgba(255,255,255,0.55),transparent_60%)]" />
        </span>

        <h3 className="mt-6 font-display text-xl font-extrabold tracking-tight text-navy-900">
          {definition.title}
        </h3>
        <p className="mt-2 text-[15px] font-semibold leading-snug text-primary">
          {ROLE_TAGLINE[role]}
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {definition.description}
        </p>

        <ul className="mt-5 mb-7 space-y-2.5">
          {ROLE_FEATURES[role].map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-2.5 text-[13.5px] leading-snug"
            >
              <span
                className={cn(
                  'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full',
                  accent.chipBg,
                )}
                aria-hidden="true"
              >
                <Check className="size-2.5" strokeWidth={3.2} />
              </span>
              <span className="text-navy-700">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA — pushed to the bottom so all three cards align on one line. */}
        <span
          className={cn(
            'mt-auto flex h-12 w-full items-center justify-center gap-2 rounded-xl',
            'bg-gradient-to-r text-[15px] font-bold text-white',
            'shadow-[0_10px_24px_-14px_rgba(8,127,140,0.9)]',
            'transition-shadow duration-300',
            'group-hover:shadow-[0_14px_30px_-12px_rgba(8,127,140,0.75)]',
            accent.button,
          )}
          aria-hidden="true"
        >
          <span>Continue as {definition.title}</span>
          <motion.span
            className="inline-flex"
            animate={reduce ? undefined : { x: [0, 4, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ArrowRight className="size-4" strokeWidth={2.4} />
          </motion.span>
        </span>
      </Link>
    </motion.div>
  );
}