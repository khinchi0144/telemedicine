'use client';

import * as React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion, useReducedMotion } from 'framer-motion';
import { Lock, Search, ShieldCheck, Sparkles, Video } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { APP_NAME } from '@/lib/constants/app';

/**
 * The 3D canvas is code-split: the three.js payload is only fetched when the
 * landing page renders — never on auth, registration or dashboard routes.
 */
const HeroScene = dynamic(() => import('@/components/three/HeroScene'), {
  ssr: false,
  loading: () => <div className="h-full w-full skeleton rounded-3xl" />,
});

/**
 * Product facts rather than usage claims.
 *
 * These describe what the platform actually does today, so nothing on the page
 * has to be un-verified (or quietly invented) marketing numbers.
 */
const CAPABILITIES = [
  { label: 'OTP-verified signup', value: '1 number' },
  { label: 'Private document storage', value: 'Encrypted' },
  { label: 'Council licence checks', value: 'Reviewed' },
];

const ASSURANCES = [
  { icon: ShieldCheck, label: 'Verified professionals only' },
  { icon: Lock, label: 'Encrypted & private by default' },
];

export function Hero() {
  const reduce = useReducedMotion();

  const rise = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] as const },
        };

  return (
    <section className="relative overflow-hidden pb-16 pt-28 sm:pb-24 sm:pt-32 lg:pb-28 lg:pt-40">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 mesh-gradient" />
        <div className="absolute inset-0 grid-lines opacity-[0.3]" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <div className="max-w-xl">
            <motion.span
              {...rise(0)}
              className="inline-flex items-center gap-2 rounded-full border border-teal-200/80 bg-white/75 px-3.5 py-1.5 text-xs font-semibold text-teal-700 backdrop-blur"
            >
              <Sparkles className="size-3.5" aria-hidden="true" />
              {APP_NAME} · One platform for your whole care journey
            </motion.span>

            <motion.h1
              {...rise(0.06)}
              className="mt-6 text-[2.6rem] font-extrabold leading-[1.06] tracking-[-0.035em] text-navy-900 sm:text-6xl lg:text-[4.1rem]"
            >
              Healthcare,
              <br />
              Connected to <span className="text-gradient-teal">You.</span>
            </motion.h1>

            <motion.p
              {...rise(0.14)}
              className="mt-6 max-w-lg text-[17px] leading-relaxed text-navy-600"
            >
              Consult verified doctors, manage prescriptions and reach registered
              pharmacies — from one secure account that stays with you everywhere.
            </motion.p>

            <motion.div
              {...rise(0.22)}
              className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <Button asChild size="lg">
                <Link href="/auth/register/patient">
                  <Video aria-hidden="true" />
                  Book Consultation
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/auth/register">
                  <Search aria-hidden="true" />
                  Find a Doctor
                </Link>
              </Button>
            </motion.div>

            <motion.ul
              {...rise(0.3)}
              className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2.5 text-[13px] font-medium text-navy-500"
            >
              {ASSURANCES.map((item) => (
                <li key={item.label} className="inline-flex items-center gap-1.5">
                  <item.icon className="size-4 text-teal-600" aria-hidden="true" />
                  {item.label}
                </li>
              ))}
            </motion.ul>

            <motion.dl
              {...rise(0.38)}
              className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-navy-100 pt-8"
            >
              {CAPABILITIES.map((item) => (
                <div key={item.label}>
                  <dt className="sr-only">{item.label}</dt>
                  <dd>
                    <span className="block font-display text-[22px] font-extrabold tracking-tight text-navy-900">
                      {item.value}
                    </span>
                    <span className="mt-1 block text-[13px] leading-tight text-muted-foreground">
                      {item.label}
                    </span>
                  </dd>
                </div>
              ))}
            </motion.dl>
          </div>

          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="relative h-[380px] sm:h-[460px] lg:h-[560px]"
          >
            <div className="absolute inset-0 overflow-hidden rounded-[2rem] border border-white/70 bg-white/45 backdrop-blur-[2px] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_40px_90px_-50px_rgba(16,42,67,0.45)]" />
            <HeroScene />
          </motion.div>
        </div>
      </div>
    </section>
  );
}