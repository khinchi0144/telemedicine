import { BadgeCheck, CalendarCheck, ClipboardList, Search, type LucideIcon } from 'lucide-react';

import { Section } from '../Section';
import { Reveal } from '@/components/motion/primitives';
import { Card } from '@/components/ui/card';

const STEPS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Search,
    title: 'Create your account',
    body: 'Register in minutes as a patient, doctor or pharmacy and verify your mobile number with a secure OTP.',
  },
  {
    icon: BadgeCheck,
    title: 'Get verified',
    body: 'Doctors and pharmacies submit registration and licence documents. Our team reviews every application.',
  },
  {
    icon: CalendarCheck,
    title: 'Book & consult',
    body: 'Choose a specialist, pick a slot and speak with them — online or in person, whichever suits you.',
  },
  {
    icon: ClipboardList,
    title: 'Stay on top of care',
    body: 'Keep prescriptions, medical records and pharmacy orders together in one secure account.',
  },
];

/** How it works — four numbered steps. */
export function HowItWorks() {
  return (
    <Section
      id="how-it-works"
      eyebrow="How it works"
      title="From sign-up to consultation in four steps"
      description="No paperwork, no waiting rooms. MediCare keeps the whole journey in one place."
    >
      <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, index) => (
          <Reveal as="li" key={step.title} delay={index * 0.08}>
            <Card interactive className="group h-full p-6">
              <div className="flex items-center justify-between">
                <span className="flex size-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700 transition-colors group-hover:bg-teal-100">
                  <step.icon className="size-5" aria-hidden="true" />
                </span>
                <span className="font-display text-3xl font-extrabold text-navy-100">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>
              <h3 className="mt-5 font-display text-base font-bold text-navy-900">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </Card>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}
