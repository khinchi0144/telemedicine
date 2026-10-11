import type { LucideIcon } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';
import { formatDate } from '@/lib/utils/format';

const TONES = {
  teal: 'bg-teal-50 text-teal-700',
  navy: 'bg-navy-50 text-navy-700',
  success: 'bg-success/10 text-[#0b7a3d]',
  warning: 'bg-warning/10 text-[#9a5b04]',
} as const;

/** Compact KPI tile used by the dashboard overviews. */
export function StatTile({
  icon: Icon,
  label,
  value,
  hint,
  tone = 'teal',
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  tone?: keyof typeof TONES;
}) {
  return (
    <Card interactive className="p-5">
      <span
        className={cn(
          'flex size-10 items-center justify-center rounded-xl',
          TONES[tone],
        )}
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <p className="mt-4 font-display text-[26px] font-extrabold leading-none tracking-tight text-navy-900">
        {value}
      </p>
      <p className="mt-1.5 text-[13px] font-medium text-navy-600">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}

/** Greeting banner with a subtle brand gradient. */
export function WelcomeBanner({
  name,
  memberSince,
  eyebrow = 'Welcome back',
}: {
  name: string;
  memberSince: Date;
  eyebrow?: string;
}) {
  const firstName = name.split(' ')[0];
  return (
    <div className="relative overflow-hidden rounded-2xl border border-navy-800 bg-navy-950 px-6 py-7 sm:px-8">
      <div aria-hidden="true" className="absolute inset-0 mesh-gradient-dark" />
      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-300">
            {eyebrow}
          </p>
          <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-white sm:text-[28px]">
            {greeting()}, {firstName}
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-navy-200">
            Your MediCare account is active and your mobile number is verified.
          </p>
        </div>
        <p className="text-xs font-medium text-navy-300">
          Member since {formatDate(memberSince)}
        </p>
      </div>
    </div>
  );
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
