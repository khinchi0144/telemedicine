import Link from 'next/link';
import { Stethoscope, Store, User, type LucideIcon } from 'lucide-react';

import { Section } from '../Section';
import { Reveal } from '@/components/motion/primitives';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const TYPES: {
  icon: LucideIcon;
  title: string;
  body: string;
  href: string;
  cta: string;
}[] = [
  {
    icon: User,
    title: 'Patients',
    body: 'Book consultations, keep prescriptions and records together, and reach nearby pharmacies.',
    href: '/auth/register/patient',
    cta: 'Create patient account',
  },
  {
    icon: Stethoscope,
    title: 'Doctors',
    body: 'Apply as a verified medical professional and manage your professional profile.',
    href: '/auth/register/doctor',
    cta: 'Apply as a doctor',
  },
  {
    icon: Store,
    title: 'Pharmacies',
    body: 'Join the pharmacy network and manage your verified storefront.',
    href: '/auth/register/pharmacy',
    cta: 'Register a pharmacy',
  },
];

/** The three registration entry points. */
export function AccountTypes() {
  return (
    <Section
      id="accounts"
      eyebrow="Who MediCare is for"
      title="Three experiences, one platform"
      description="Every account type has its own workspace, backed by the same verification and privacy standards."
    >
      <div className="grid gap-5 lg:grid-cols-3">
        {TYPES.map((type, index) => (
          <Reveal key={type.title} delay={index * 0.08}>
            <Card interactive className="flex h-full flex-col p-7">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-[0_10px_24px_-12px_rgba(0,140,135,0.9)]">
                <type.icon className="size-6" aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-display text-xl font-bold text-navy-900">
                {type.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                {type.body}
              </p>
              <Button asChild variant="secondary" className="mt-6 w-full">
                <Link href={type.href}>{type.cta}</Link>
              </Button>
            </Card>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
