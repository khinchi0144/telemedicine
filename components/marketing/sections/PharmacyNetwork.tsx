import { Clock, MapPin, ShieldCheck, Store } from 'lucide-react';

import { Section } from '../Section';
import { Reveal } from '@/components/motion/primitives';
import { Card } from '@/components/ui/card';
import { PHARMACY_TYPE_OPTIONS } from '@/lib/constants/options';
import { WEEK_DAY_OPTIONS } from '@/lib/constants/options';

/**
 * Pharmacy network.
 *
 * Describes the network using the real pharmacy types and operating-hours model
 * — no invented pharmacy names, ratings or locations.
 */
export function PharmacyNetwork() {
  return (
    <Section
      id="pharmacies"
      eyebrow="Pharmacy network"
      title="Registered pharmacies, reviewed like doctors"
      description="A pharmacy joins the network with its drug licence, GST and registration certificates, plus a shop photo and weekly operating hours."
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_1.15fr] lg:gap-8">
        <Reveal>
          <Card className="flex h-full flex-col p-7">
            <span className="flex size-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <Store className="size-5" aria-hidden="true" />
            </span>
            <h3 className="mt-5 font-display text-lg font-bold text-navy-900">
              Pharmacy types on MediCare
            </h3>
            <ul className="mt-4 space-y-3">
              {PHARMACY_TYPE_OPTIONS.map((type) => (
                <li
                  key={type.value}
                  className="rounded-xl border border-border bg-surface-muted p-4"
                >
                  <p className="text-sm font-semibold text-navy-900">{type.label}</p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
                    {type.description}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>

        <div className="grid gap-5">
          <Reveal delay={0.08}>
            <Card className="p-7">
              <h3 className="font-display text-lg font-bold text-navy-900">
                What we check
              </h3>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  { icon: ShieldCheck, label: 'Drug licence' },
                  { icon: ShieldCheck, label: 'GST certificate' },
                  { icon: MapPin, label: 'Premises address' },
                  { icon: Clock, label: 'Operating hours' },
                ].map((item) => (
                  <li
                    key={item.label}
                    className="flex items-center gap-2.5 rounded-lg border border-border px-3.5 py-3 text-sm font-medium text-navy-800"
                  >
                    <item.icon className="size-4 text-teal-600" aria-hidden="true" />
                    {item.label}
                  </li>
                ))}
              </ul>
            </Card>
          </Reveal>

          <Reveal delay={0.14}>
            <Card className="p-7">
              <h3 className="font-display text-lg font-bold text-navy-900">
                Weekly opening hours
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Pharmacies publish opening hours for all seven days, including
                closed days, so patients can plan before they travel.
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {WEEK_DAY_OPTIONS.map((day) => (
                  <li
                    key={day.value}
                    className="rounded-full border border-navy-200/70 bg-white px-3 py-1 text-xs font-semibold text-navy-700"
                  >
                    {day.short}
                  </li>
                ))}
              </ul>
            </Card>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
