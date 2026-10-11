import { Plus } from 'lucide-react';

import { Section } from '../Section';
import { Reveal } from '@/components/motion/primitives';

const FAQS = [
  {
    q: 'Who can register on MediCare?',
    a: 'Patients can register immediately. Doctors and pharmacies apply with their registration and licence documents, which our team reviews before the professional workspace is unlocked.',
  },
  {
    q: 'Is my medical information private?',
    a: 'Yes. Health information and uploaded documents are stored in private storage that cannot be reached through a public link, and are only visible to you and the professionals you share them with.',
  },
  {
    q: 'How does MediCare verify doctors and pharmacies?',
    a: 'We check the medical registration number and qualifications against the certificates you upload, and for pharmacies the drug licence, GST and registration certificates.',
  },
  {
    q: 'Do you provide medical advice or diagnosis?',
    a: 'No. MediCare is a platform that connects you with healthcare professionals. It does not provide diagnosis, treatment or medical recommendations.',
  },
  {
    q: 'Can I use MediCare on a phone?',
    a: 'Yes. Every screen is designed mobile-first, with large touch targets, responsive forms and a dashboard that adapts to tablet and desktop.',
  },
  {
    q: 'What happens after I register as a doctor or pharmacy?',
    a: 'Your account is created in a pending state. You can sign in and track your application, and the full workspace unlocks once our team approves the profile.',
  },
];

/** FAQ — native <details> for zero-JS accessibility. */
export function Faq() {
  return (
    <Section
      id="faq"
      eyebrow="FAQ"
      title="Questions people ask before they join"
      tone="muted"
    >
      <div className="mx-auto grid max-w-4xl gap-3">
        {FAQS.map((faq, index) => (
          <Reveal key={faq.q} delay={index * 0.05}>
            <details className="group rounded-2xl border border-border bg-card px-6 py-5 transition-colors hover:border-teal-200 open:border-teal-200 open:shadow-[0_12px_28px_-18px_rgba(16,42,67,0.3)]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-[15px] font-bold text-navy-900 [&::-webkit-details-marker]:hidden">
                {faq.q}
                <span
                  className="flex size-7 shrink-0 items-center justify-center rounded-full bg-navy-50 text-navy-600 transition-transform duration-300 group-open:rotate-45"
                  aria-hidden="true"
                >
                  <Plus className="size-3.5" />
                </span>
              </summary>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                {faq.a}
              </p>
            </details>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
