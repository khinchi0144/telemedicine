import { BadgeCheck, Stethoscope } from 'lucide-react';

import { Section } from '../Section';
import { Reveal } from '@/components/motion/primitives';
import { Card } from '@/components/ui/card';
import { SPECIALIZATION_OPTIONS } from '@/lib/constants/options';
import { MEDICAL_COUNCILS } from '@/lib/constants/geo';

/**
 * Doctor highlights.
 *
 * Deliberately built from the platform's real specialisation list and the real
 * medical council register — we do not publish invented doctor names or
 * fabricated patient counts.
 */
export function DoctorHighlights() {
  return (
    <Section
      id="doctors"
      eyebrow="Doctor network"
      title="Specialities across the MediCare network"
      description="Doctors join MediCare with their medical registration number and qualification certificates, both reviewed before the profile goes live."
      tone="muted"
    >
      <Reveal>
        <Card className="p-7 sm:p-9">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <Stethoscope className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="font-display text-lg font-bold text-navy-900">
                {SPECIALIZATION_OPTIONS.length} specialities available
              </h3>
              <p className="text-sm text-muted-foreground">
                Select your specialisation when you register as a doctor.
              </p>
            </div>
          </div>

          <ul className="mt-6 flex flex-wrap gap-2">
            {SPECIALIZATION_OPTIONS.map((specialty) => (
              <li
                key={specialty}
                className="rounded-full border border-navy-200/70 bg-white px-3.5 py-1.5 text-[13px] font-medium text-navy-700"
              >
                {specialty}
              </li>
            ))}
          </ul>
        </Card>
      </Reveal>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Reveal>
          <Card className="h-full p-7">
            <span className="flex size-11 items-center justify-center rounded-xl bg-navy-50 text-navy-700">
              <BadgeCheck className="size-5" aria-hidden="true" />
            </span>
            <h3 className="mt-5 font-display text-base font-bold text-navy-900">
              How doctors are verified
            </h3>
            <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-muted-foreground">
              {[
                'Medical registration number and issuing council are recorded.',
                'Qualification certificates are uploaded and reviewed by our team.',
                'Clinic and consultation details are confirmed before approval.',
                'Accounts stay pending until a reviewer approves the profile.',
              ].map((item) => (
                <li key={item} className="flex gap-2.5">
                  <span
                    className="mt-1.5 size-1.5 shrink-0 rounded-full bg-teal-500"
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>

        <Reveal delay={0.08}>
          <Card className="h-full p-7">
            <h3 className="font-display text-base font-bold text-navy-900">
              State medical councils supported
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Doctors select their council at registration so we can verify the
              registration against the right register.
            </p>
            <p className="mt-4 text-3xl font-extrabold tracking-tight text-navy-900">
              {MEDICAL_COUNCILS.length}
              <span className="ml-2 text-sm font-medium text-muted-foreground">
                councils listed
              </span>
            </p>
          </Card>
        </Reveal>
      </div>
    </Section>
  );
}
