import Link from 'next/link';
import { BadgeCheck, ShieldCheck, Wallet } from 'lucide-react';

import { Section } from '../Section';
import { Reveal } from '@/components/motion/primitives';
import { Button } from '@/components/ui/button';

const ASSURANCES = [
  { icon: Wallet, label: 'No payment required to register' },
  { icon: ShieldCheck, label: 'Your data stays private' },
  { icon: BadgeCheck, label: 'Professionals verified before they go live' },
];

/** Closing call to action on a navy panel. */
export function FinalCta() {
  return (
    <Section className="pb-24 pt-8">
      <Reveal className="relative overflow-hidden rounded-[2rem] border border-navy-800 bg-navy-950 px-6 py-14 text-center sm:px-14">
        <div aria-hidden="true" className="absolute inset-0 mesh-gradient-dark" />
        <div className="relative mx-auto max-w-2xl">
          <h2 className="font-display text-[2rem] font-extrabold leading-tight tracking-tight text-white sm:text-[2.6rem]">
            Ready to take healthcare into your own hands?
          </h2>
          <p className="mt-4 text-[17px] leading-relaxed text-navy-200">
            Create your MediCare account today — it takes about two minutes.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/auth/register">Create an account</Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="border border-white/25 bg-transparent text-white hover:border-white/40 hover:bg-white/10"
            >
              <Link href="/auth/login">I already have an account</Link>
            </Button>
          </div>
          <ul className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 text-[13px] font-medium text-navy-200">
            {ASSURANCES.map((item) => (
              <li key={item.label} className="inline-flex items-center gap-1.5">
                <item.icon className="size-4 text-teal-300" aria-hidden="true" />
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </Section>
  );
}
