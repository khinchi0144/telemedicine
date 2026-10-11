import {
  BadgeCheck,
  CalendarClock,
  ClipboardList,
  FileCheck2,
  Stethoscope,
  Users,
  Video,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState, Panel } from '@/components/dashboard/EmptyState';
import { StatTile, WelcomeBanner } from '@/components/dashboard/StatTile';
import { DonutChart } from '@/components/ui/charts';
import { formatDate, humanizeStatus } from '@/lib/utils/format';
import type { DashboardData } from '@/lib/services/dashboardService';

const UPCOMING_MODULES = [
  {
    icon: CalendarClock,
    title: "Today's appointments",
    description: 'Your confirmed consultation schedule for the day.',
  },
  {
    icon: Users,
    title: 'Patient records',
    description: 'Patients who have consulted with you, with full history.',
  },
  {
    icon: ClipboardList,
    title: 'Prescriptions',
    description: 'Create and securely share prescriptions with patients.',
  },
  {
    icon: Video,
    title: 'Video consultations',
    description: 'Start and manage consultation rooms.',
  },
];

export function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/70 pb-3">
      <dt className="text-[13px] text-muted-foreground">{label}</dt>
      <dd className="truncate text-[13px] font-semibold text-navy-900">{value}</dd>
    </div>
  );
}

export function statusVariant(status: string) {
  if (status === 'APPROVED' || status === 'VERIFIED') return 'success' as const;
  if (status === 'REJECTED') return 'destructive' as const;
  return 'warning' as const;
}
/** Doctor overview — real profile + verification data, no invented records. */
export function DoctorOverview({ data }: { data: DashboardData }) {
  const verified = data.verification.isVerified;
  const pendingCount = data.documentsByStatus.PENDING ?? 0;
  const approvedCount = data.documentsByStatus.APPROVED ?? 0;
  const rejectedCount = data.documentsByStatus.REJECTED ?? 0;

  return (
    <div className="space-y-6">
      <WelcomeBanner
        name={data.user.fullName}
        memberSince={data.user.memberSince}
        eyebrow="Doctor workspace"
      />

      {data.verification.isPending && <PendingVerification />}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          icon={BadgeCheck}
          label="Verification"
          value={data.verification.label}
          tone={verified ? 'success' : 'warning'}
        />
        <StatTile
          icon={Stethoscope}
          label="Profile completion"
          value={`${data.profileCompletion}%`}
          tone="teal"
        />
        <StatTile
          icon={FileCheck2}
          label="Documents uploaded"
          value={data.documents.length}
          tone="navy"
        />
        <StatTile
          icon={Users}
          label="Patients"
          value="0"
          tone="navy"
          hint="Patient module not enabled yet"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <Panel
          title="Professional profile"
          description="Submitted during registration and visible to patients once verified."
        >
          <div className="grid gap-x-8 gap-y-3.5 sm:grid-cols-2">
            {data.facts.map((fact) => (
              <FactRow key={fact.label} label={fact.label} value={fact.value} />
            ))}
          </div>
        </Panel>

        <Panel
          title="Document review"
          description="Status of the certificates attached to your account."
        >
          {data.documents.length === 0 ? (
            <EmptyState
              compact
              icon={FileCheck2}
              title="No documents"
              description="Certificates uploaded during registration appear here with their review status."
            />
          ) : (
            <div className="space-y-5">
              <div className="flex justify-center">
                <DonutChart
                  size={132}
                  centerValue={String(data.documents.length)}
                  centerLabel="documents"
                  data={[
                    { label: 'Approved', value: approvedCount, color: 'var(--color-success)' },
                    { label: 'Pending', value: pendingCount, color: 'var(--color-warning)' },
                    { label: 'Rejected', value: rejectedCount, color: 'var(--color-destructive)' },
                  ]}
                />
              </div>

              <ul className="divide-y divide-border/70">
                {data.documents.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-navy-900">
                        {humanizeStatus(doc.documentType)}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {doc.fileName} · {formatDate(doc.createdAt)}
                      </p>
                    </div>
                    <Badge variant={statusVariant(doc.verificationStatus)}>
                      {humanizeStatus(doc.verificationStatus)}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Panel>
      </div>

      <Panel
        title="Coming next"
        description="Clinical modules that need a backend before they can hold records."
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {UPCOMING_MODULES.map((module) => (
            <EmptyState
              key={module.title}
              compact
              icon={module.icon}
              title={module.title}
              description={module.description}
            />
          ))}
        </div>
      </Panel>
    </div>
  );
}

function PendingVerification() {
  return (
    <Card className="flex flex-wrap items-start gap-4 border-warning/30 bg-warning/[0.07] p-5">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-[#9a5b04]">
        <BadgeCheck className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-[15px] font-bold text-navy-900">
          Your profile is under verification
        </p>
        <p className="mt-1 text-[13px] leading-relaxed text-navy-700">
          Our team is reviewing your registration number and qualification
          certificates. The clinical workspace — appointments, patients and
          prescriptions — unlocks automatically once the profile is approved.
        </p>
      </div>
    </Card>
  );
}