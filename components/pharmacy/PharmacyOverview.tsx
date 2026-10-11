import {
  BadgeCheck,
  Boxes,
  ClipboardCheck,
  CreditCard,
  FileCheck2,
  PackageSearch,
  Truck,
} from 'lucide-react';

import { Card } from '@/components/ui/card';
import { EmptyState, Panel } from '@/components/dashboard/EmptyState';
import { StatTile, WelcomeBanner } from '@/components/dashboard/StatTile';
import { formatDate, humanizeStatus } from '@/lib/utils/format';
import type { DashboardData } from '@/lib/services/dashboardService';
import { FactRow, statusVariant } from '@/components/doctor/DoctorOverview';
import { Badge } from '@/components/ui/badge';

const UPCOMING_MODULES = [
  {
    icon: Boxes,
    title: 'Inventory',
    description: 'Add medicines with batch numbers, expiry dates and stock levels.',
  },
  {
    icon: ClipboardCheck,
    title: 'Orders',
    description: 'Prescription orders received from patients, ready to fulfil.',
  },
  {
    icon: Truck,
    title: 'Deliveries',
    description: 'Assign couriers and track hand-offs to the patient.',
  },
  {
    icon: CreditCard,
    title: 'Payments',
    description: 'Settlement of completed orders and payout history.',
  },
];

/** Pharmacy overview — real licence and operating-hours data. */
export function PharmacyOverview({ data }: { data: DashboardData }) {
  const verified = data.verification.isVerified;
  const approved = data.documentsByStatus.APPROVED ?? 0;

  return (
    <div className="space-y-6">
      <WelcomeBanner
        name={data.user.fullName}
        memberSince={data.user.memberSince}
        eyebrow="Pharmacy workspace"
      />

      {data.verification.isPending && (
        <Card className="flex flex-wrap items-start gap-4 border-warning/30 bg-warning/[0.07] p-5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-[#9a5b04]">
            <BadgeCheck className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-[15px] font-bold text-navy-900">
              Verification in progress
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-navy-700">
              Your drug licence and GST certificates are being reviewed. Inventory
              and order management unlock once the pharmacy is approved.
            </p>
          </div>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          icon={BadgeCheck}
          label="Verification"
          value={data.verification.label}
          tone={verified ? 'success' : 'warning'}
        />
        <StatTile
          icon={PackageSearch}
          label="Medicines listed"
          value="0"
          tone="navy"
          hint="Inventory module not enabled yet"
        />
        <StatTile
          icon={FileCheck2}
          label="Documents uploaded"
          value={data.documents.length}
          tone="teal"
        />
        <StatTile
          icon={ClipboardCheck}
          label="Orders"
          value="0"
          tone="navy"
          hint="Orders module not enabled yet"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <Panel
          title="Pharmacy details"
          description="Licence information registered with MediCare."
        >
          <div className="grid gap-x-8 gap-y-3.5 sm:grid-cols-2">
            {data.facts.map((fact) => (
              <FactRow key={fact.label} label={fact.label} value={fact.value} />
            ))}
          </div>
        </Panel>

        <Panel
          title="Documents on file"
          description="Certificates you submitted at registration."
        >
          {data.documents.length === 0 ? (
            <EmptyState
              compact
              icon={FileCheck2}
              title="No documents"
              description="Uploaded licences and certificates appear here with their review status."
            />
          ) : (
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
          )}
          {approved > 0 && (
            <p className="mt-4 rounded-lg bg-success/10 px-3 py-2 text-[12px] font-medium text-[#0b7a3d]">
              {approved} document{approved === 1 ? '' : 's'} approved and visible
              to patients.
            </p>
          )}
        </Panel>
      </div>

      <Panel
        title="Coming next"
        description="Commerce modules that need a backend before they can hold records."
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