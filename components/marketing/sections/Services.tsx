import {
  FileHeart,
  Pill,
  ShieldCheck,
  Stethoscope,
  Store,
  Video,
  type LucideIcon,
} from 'lucide-react';

import { Section } from '../Section';
import { Reveal, TiltCard } from '@/components/motion/primitives';
import { Card } from '@/components/ui/card';

const SERVICES: {
  icon: LucideIcon;
  title: string;
  body: string;
  tone: string;
}[] = [
  {
    icon: Video,
    title: 'Video consultations',
    body: 'Speak face to face with a verified doctor from wherever you are. Appointments, reminders and notes in one place.',
    tone: 'bg-teal-50 text-teal-700 border-teal-200/70',
  },
  {
    icon: Stethoscope,
    title: 'Verified specialists',
    body: 'Every doctor profile is reviewed against their medical registration and qualification certificates.',
    tone: 'bg-navy-50 text-navy-700 border-navy-200/70',
  },
  {
    icon: Pill,
    title: 'Prescriptions',
    body: 'Digital prescriptions shared securely to your account, listing the medicines you were actually prescribed.',
    tone: 'bg-mint-50 text-teal-700 border-mint-200',
  },
  {
    icon: Store,
    title: 'Pharmacy network',
    body: 'Find registered pharmacies near you and check availability before you travel.',
    tone: 'bg-navy-50 text-navy-700 border-navy-200/70',
  },
  {
    icon: FileHeart,
    title: 'Medical records',
    body: 'A private, organised home for your reports, prescriptions and health information that you control.',
    tone: 'bg-teal-50 text-teal-700 border-teal-200/70',
  },
  {
    icon: ShieldCheck,
    title: 'Privacy by design',
    body: 'Documents are stored in private storage with no public links, and sessions are protected end to end.',
    tone: 'bg-mint-50 text-teal-700 border-mint-200',
  },
];

/** Healthcare services grid. */
export function Services() {
  return (
    <Section
      id="services"
      eyebrow="Our healthcare services"
      title="Everything your care needs, in one account"
      description="Consult, get prescribed and find medicines without switching between five different apps."
      tone="muted"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((service, index) => (
          <Reveal key={service.title} delay={index * 0.06}>
            <TiltCard intensity={4} className="h-full">
              <Card interactive className="flex h-full flex-col p-6">
                <span
                  className={`flex size-11 items-center justify-center rounded-xl border ${service.tone}`}
                >
                  <service.icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 font-display text-base font-bold text-navy-900">
                  {service.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {service.body}
                </p>
              </Card>
            </TiltCard>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
