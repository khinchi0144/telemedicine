'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Lock,
  Pill,
  ShieldCheck,
  Stethoscope,
  Store,
  UserRound,
} from 'lucide-react';

import { cn } from '@/lib/utils/cn';

/**
 * The 3D canvas is code-split so the three.js payload is only fetched when the
 * registration page renders — never on login, dashboards or the marketing site.
 */
const EcosystemScene = dynamic(() => import('@/components/three/EcosystemScene'), {
  ssr: false,
  loading: () => <div className="h-full w-full skeleton rounded-3xl" />,
});

const TRUST_INDICATORS = [
  { icon: ShieldCheck, label: 'Verified Professionals' },
  { icon: Lock, label: 'Secure Healthcare' },
  { icon: Store, label: 'Connected Pharmacy Network' },
];

/** Floating translucent chips orbiting the 3D core. */
const ORBIT_CHIPS = [
  {
    icon: Stethoscope,
    label: 'Doctors',
    className: 'left-0 top-[14%] animate-soft-bob',
    delay: 0,
  },
  {
    icon: UserRound,
    label: 'Patients',
    className: 'right-2 top-[30%] animate-soft-bob',
    delay: 1.1,
  },
  {
    icon: Pill,
    label: 'Pharmacy',
    className: 'bottom-[22%] left-4 animate-soft-bob',
    delay: 2.2,
  },
];

/**
 * Right-hand visual column: a 3D healthcare ecosystem, translucent floating
 * UI chips and the trust indicators. Decorative motion is hidden from assistive
 * technology and fully disabled under reduced-motion.
 */
export function EcosystemVisual({ className }: { className?: string }) {
  // `useReducedMotion()` returns `boolean | null`; null means "no preference".
  const reduce = Boolean(useReducedMotion());

  return (
    <aside
      className={cn('relative flex flex-col', className)}
      aria-label="One platform, complete healthcare"
    >
      <div
        className="relative flex flex-1 flex-col overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br from-navy-900 via-navy-800 to-navy-950 shadow-[var(--shadow-premium)]"
      >
        {/* Drifting aurora lighting behind the scene. */}
        <div
          aria-hidden="true"
          className="animate-aurora pointer-events-none absolute -inset-16 opacity-90"
        >
          <span className="absolute left-1/4 top-1/4 size-[26rem] rounded-full bg-teal-500/25 blur-[100px]" />
          <span className="absolute bottom-1/4 right-1/4 size-[22rem] rounded-full bg-teal-300/20 blur-[90px]" />
          <span className="absolute left-1/2 top-1/2 size-[18rem] rounded-full bg-navy-500/40 blur-[80px]" />
        </div>

        {/* Fine grid for depth. */}
        <div
          aria-hidden="true"
          className="grid-lines-dark pointer-events-none absolute inset-0 opacity-40"
        />

        {/* 3D scene. */}
        <div className="relative h-[280px] w-full sm:h-[340px] lg:h-[380px]">
          <EcosystemScene />

          {/* Floating glass chips. */}
          {ORBIT_CHIPS.map((chip) => (
            <motion.div
              key={chip.label}
              className={cn(
                'glass-panel absolute flex items-center gap-2 rounded-full px-3.5 py-2 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.6)]',
                chip.className,
              )}
              initial={reduce ? false : { opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.6,
                delay: reduce ? 0 : 0.6 + chip.delay * 0.12,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <chip.icon className="size-4 text-teal-200" aria-hidden="true" />
              <span className="text-xs font-semibold text-white">{chip.label}</span>
            </motion.div>
          ))}
        </div>

        {/* Copy block. */}
        <div className="relative z-10 px-6 pb-7 pt-2 sm:px-8 sm:pb-8">
          <motion.h2
            className="font-display text-[26px] font-extrabold leading-[1.15] tracking-tight text-white sm:text-[30px]"
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            One Platform. Complete Healthcare.
          </motion.h2>

          <motion.p
            className="mt-3 max-w-sm text-[15px] leading-relaxed text-navy-100"
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.42, ease: [0.16, 1, 0.3, 1] }}
          >
            Connecting patients, verified doctors and registered pharmacies in one
            seamless ecosystem.
          </motion.p>

          {/* Trust indicators. */}
          <motion.ul
            className="mt-6 flex flex-wrap gap-2.5"
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.54, ease: [0.16, 1, 0.3, 1] }}
          >
            {TRUST_INDICATORS.map((item) => (
              <li
                key={item.label}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-md"
              >
                <item.icon className="size-3.5 text-teal-300" aria-hidden="true" />
                {item.label}
              </li>
            ))}
          </motion.ul>
        </div>
      </div>
    </aside>
  );
}