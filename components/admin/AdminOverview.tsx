import { BadgeCheck, Building2, CircleAlert, ShieldCheck, Stethoscope } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState, Panel } from '@/components/dashboard/EmptyState';
import { StatTile, WelcomeBanner } from '@/components/dashboard/StatTile';
import { BarChart, DonutChart } from '@/components/ui/charts';
import { Button } from '@/components/ui/button';
import type { VerificationQueue } from '@/lib/services/verificationService';

const UPCOMING_MODULES = [
  {
    icon: Stethoscope,
    title: 'Patient directory',
    description: 'Browse and manage every registered patient account.',
  },
  {
    icon: Building2,
    title: 'Reports',
    description: 'Platform analytics on registrations, verifications and usage.',
  },
];

/** Admin dashboard — real counts read straight from the verification tables. */
export function AdminOverview({
  doctors,
  pharmacies,
}: {
  doctors: VerificationQueue;
  pharmacies: VerificationQueue;
}) {
  const totalPending = doctors.counts.pending + pharmacies.counts.pending;
  const totalVerified = doctors.counts.verified + pharmacies.counts.verified;
  const totalProfiles = doctors.counts.total + pharmacies.counts.total;

  return (
    <div className="space-y-6">
      <WelcomeBanner
        name="Operations team"
        memberSince={doctors.entries[0]?.createdAt ?? new Date()}
        eyebrow="Admin console"
      />

      {totalPending > 0 && (
        <Card className="flex flex-wrap items-start gap-4 border-warning/30 bg-warning/[0.07] p-5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-[#9a5b04]">
            <CircleAlert className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-[15px] font-bold text-navy-900">
              {totalPending} application{totalPending === 1 ? '' : 's'} awaiting review
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-navy-700">
              {doctors.counts.pending} doctor and {pharmacies.counts.pending} pharmacy
              profiles are still marked as pending verification.
            </p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/doctors">Open queue</Link>
          </Button>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          icon={ShieldCheck}
          label="Professional profiles"
          value={totalProfiles}
          tone="navy"
        />
        <StatTile
          icon={CircleAlert}
          label="Pending review"
          value={totalPending}
          tone="warning"
        />
        <StatTile
          icon={BadgeCheck}
          label="Verified"
          value={totalVerified}
          tone="success"
        />
        <StatTile
          icon={Stethoscope}
          label="Doctors / pharmacies"
          value={`${doctors.counts.total} / ${pharmacies.counts.total}`}
          tone="teal"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <VerificationMix
          title="Doctor applications"
          description="Verification status across every doctor profile."
          href="/admin/doctors"
          queue={doctors}
          tone="var(--color-teal-500)"
        />
        <VerificationMix
          title="Pharmacy applications"
          description="Verification status across every pharmacy profile."
          href="/admin/pharmacies"
          queue={pharmacies}
          tone="var(--color-navy-500)"
        />
      </div>

      <Panel
        title="Coming next"
        description="Modules that need a backend before they can show real records."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {UPCOMING_MODULES.map((module) => (
            <EmptyState
              key={module.title}
              compact
              icon={module.icon}
              title={module.title}
              description={module.description}
              action={<Badge variant="outline">Coming soon</Badge>}
            />
          ))}
        </div>
      </Panel>
    </div>
  );
}

function VerificationMix({
  title,
  description,
  href,
  queue,
  tone,
}: {
  title: string;
  description: string;
  href: string;
  queue: VerificationQueue;
  tone: string;
}) {
  const hasData = queue.counts.total > 0;

  return (
    <Card className="overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <h2 className="font-display text-[15px] font-bold tracking-tight text-navy-900">
            {title}
          </h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>
        </div>
        <Button asChild size="sm" variant="ghost">
          <Link href={href}>View</Link>
        </Button>
      </div>

      <div className="p-5">
        {!hasData ? (
          <EmptyState
            compact
            icon={Stethoscope}
            title="No applications yet"
            description="Registrations appear here the moment the first profile is created."
          />
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-8">
            <DonutChart
              size={140}
              centerValue={String(queue.counts.total)}
              centerLabel="total"
              data={[
                { label: 'Verified', value: queue.counts.verified, color: 'var(--color-success)' },
                { label: 'Pending', value: queue.counts.pending, color: 'var(--color-warning)' },
                { label: 'Rejected', value: queue.counts.rejected, color: 'var(--color-destructive)' },
              ]}
            />

            <BarChart
              className="min-w-[180px] flex-1"
              data={[
                { label: 'Verified', value: queue.counts.verified, color: 'var(--color-success)' },
                { label: 'Pending', value: queue.counts.pending, color: tone },
                { label: 'Rejected', value: queue.counts.rejected, color: 'var(--color-destructive)' },
              ]}
            />
          </div>
        )}
      </div>
    </Card>
  );
}
