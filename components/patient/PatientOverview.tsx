import { Card } from '@/components/ui/card';
import { EmptyState, Panel } from '@/components/dashboard/EmptyState';
import { ProgressRing } from '@/components/ui/charts';
import { StatTile, WelcomeBanner } from '@/components/dashboard/StatTile';
import { humanizeStatus } from '@/lib/utils/format';
import {
  CalendarPlus,
  ClipboardList,
  FileHeart,
  HeartPulse,
  Pill,
  Search,
  ShieldCheck,
  Store,
  Video,
} from 'lucide-react';
import type { DashboardData } from '@/lib/services/dashboardService';

const UPCOMING_MODULES = [
  {
    icon: CalendarPlus,
    title: 'Upcoming appointments',
    description:
      'Book and manage consultations with verified doctors. Appears here once booking goes live.',
  },
  {
    icon: ClipboardList,
    title: 'Recent prescriptions',
    description:
      'Prescriptions your doctor shares with you will be listed here with dosage details.',
  },
  {
    icon: Pill,
    title: 'Medicine availability',
    description:
      'Check whether a medicine is in stock at pharmacies near you before you travel.',
  },
  {
    icon: FileHeart,
    title: 'Appointment history',
    description: 'A complete history of your consultations across every doctor.',
  },
];

/** Patient overview — real profile data plus honest module placeholders. */
export function PatientOverview({ data }: { data: DashboardData }) {
  return (
    <div className="space-y-6">
      <WelcomeBanner name={data.user.fullName} memberSince={data.user.memberSince} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          icon={HeartPulse}
          label="Account status"
          value={humanizeStatus(data.user.status)}
          tone="success"
        />
        <StatTile
          icon={ShieldCheck}
          label="Profile completion"
          value={`${data.profileCompletion}%`}
          tone="teal"
        />
        <StatTile
          icon={FileHeart}
          label="Profile fields filled"
          value={`${data.facts.filter((f) => f.value !== 'Not provided').length} of ${data.facts.length}`}
          tone="navy"
        />
        <StatTile
          icon={Video}
          label="Consultations"
          value="0"
          tone="navy"
          hint="Booking not enabled yet"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <Panel
          title="Your details"
          description="Captured during registration — you control what you share."
        >
          <div className="grid gap-x-8 gap-y-3.5 sm:grid-cols-2">
            {data.facts.map((fact) => (
              <div
                key={fact.label}
                className="flex items-baseline justify-between gap-4 border-b border-border/70 pb-3"
              >
                <dt className="text-[13px] text-muted-foreground">{fact.label}</dt>
                <dd className="truncate text-[13px] font-semibold text-navy-900">
                  {fact.value}
                </dd>
              </div>
            ))}
          </div>
        </Panel>

        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center gap-4">
              <ProgressRing
                value={data.profileCompletion}
                label="profile complete"
                size={82}
              />
              <div className="min-w-0">
                <p className="font-display text-[15px] font-bold text-navy-900">
                  Profile completeness
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                  Health information is optional — add allergies and conditions
                  so your doctor has context before a consultation.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <p className="font-display text-[15px] font-bold text-navy-900">
              Find care
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
              Search across verified doctors and pharmacies near you.
            </p>
            <div className="mt-4 flex gap-2.5">
              <span className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 py-2.5 text-[13px] font-medium text-muted-foreground">
                <Search className="size-4" aria-hidden="true" />
                Doctor search
              </span>
              <span className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 py-2.5 text-[13px] font-medium text-muted-foreground">
                <Store className="size-4" aria-hidden="true" />
                Pharmacies
              </span>
            </div>
          </Card>
        </div>
      </div>

      <Panel
        title="Coming next"
        description="Modules that need a backend before they can show real records."
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
