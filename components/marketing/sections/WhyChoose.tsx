import { Section } from '../Section';
import { Reveal } from '@/components/motion/primitives';

const WHY: { title: string; body: string }[] = [
  {
    title: 'One account, your whole care journey',
    body: 'Stop juggling separate portals. Consultations, prescriptions, records and pharmacy needs live together.',
  },
  {
    title: 'Professionals you can verify',
    body: 'Doctor and pharmacy accounts are reviewed before their profiles go live, so you know who you are dealing with.',
  },
  {
    title: 'Private by default',
    body: 'Your health information is only visible to you and the professionals you choose to share it with.',
  },
  {
    title: 'Built for how you actually use it',
    body: 'Mobile-first layouts, large touch targets and forms that work on a phone in a busy clinic or at home.',
  },
];

/** Why MediCare — trust-first positioning on a navy panel. */
export function WhyChoose() {
  return (
    <Section
      id="why"
      eyebrow="Why MediCare"
      title="Designed around trust, not around ads"
      tone="navy"
    >
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <Reveal>
          <h3 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
            Healthcare platforms usually monetise attention.
            <span className="text-teal-300"> Ours protects privacy.</span>
          </h3>
          <p className="mt-5 text-[17px] leading-relaxed text-navy-200">
            We do not sell your health data, and we do not rank doctors by who
            pays the most. Verification comes first, so the profile you see is one
            that has actually been checked.
          </p>
        </Reveal>

        <ul className="grid gap-4 sm:grid-cols-2">
          {WHY.map((item, index) => (
            <Reveal
              as="li"
              key={item.title}
              delay={index * 0.07}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm"
            >
              <h4 className="font-display text-base font-bold text-white">
                {item.title}
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-navy-200">{item.body}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </Section>
  );
}
