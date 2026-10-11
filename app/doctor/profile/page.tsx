import type { Metadata } from 'next';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState, Panel } from '@/components/dashboard/EmptyState';
import { FactRow } from '@/components/doctor/DoctorOverview';
import { FileCheck2, PencilLine, Stethoscope } from 'lucide-react';

import { requireRoleLayout } from '@/lib/auth/role-guard';
import { getDashboardData } from '@/lib/services/dashboardService';
import { formatDate, humanizeStatus } from '@/lib/utils/format';

export const metadata: Metadata = {
  title: 'My Profile',
  description: 'Your MediCare doctor profile.',
};

/**
 * Read-only professional profile.
 *
 * Patients see this data once an admin approves the account, so it doubles as
 * a preview of what the public listing will contain.
 */
export default async function DoctorProfilePage() {
  const user = await requireRoleLayout(['DOCTOR']);
  const data = await getDashboardData(user.id, 'DOCTOR', user.fullName);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <Panel
          title="Professional details"
          description="Verified against the documents you submitted at registration."
        >
          <div className="grid gap-x-8 gap-y-3.5 sm:grid-cols-2">
            {data.facts.map((fact) => (
              <FactRow key={fact.label} label={fact.label} value={fact.value} />
            ))}
          </div>
        </Panel>

        <Panel title="Certificates" description="Documents attached to your profile.">
          {data.documents.length === 0 ? (
            <EmptyState
              compact
              icon={FileCheck2}
              title="No documents"
              description="Registration and qualification certificates appear here once uploaded."
            />
          ) : (
            <ul className="divide-y divide-border/70">
              {data.documents.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-navy-900">
                      {doc.fileName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {humanizeStatus(doc.documentType)} · {formatDate(doc.createdAt)}
                    </p>
                  </div>
                  <Badge variant="outline">{humanizeStatus(doc.verificationStatus)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Card className="flex h-fit flex-col items-center gap-4 p-6 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-navy-50 text-navy-700">
          <Stethoscope className="size-7" aria-hidden="true" />
        </span>
        <div>
          <p className="font-display text-base font-bold text-navy-900">
            {data.user.fullName}
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Member since {formatDate(data.user.memberSince)}
          </p>
        </div>

        <Badge
          variant={
            data.verification.isVerified
              ? 'success'
              : data.verification.status === 'REJECTED'
                ? 'destructive'
                : 'warning'
          }
          className="px-3 py-1"
        >
          {data.verification.label}
        </Badge>

        <p className="text-xs leading-relaxed text-muted-foreground">
          {data.verification.isVerified
            ? 'Your profile is visible to patients searching for a verified doctor.'
            : 'Your profile stays hidden from patients until an admin approves your verification.'}
        </p>

        <Badge variant="outline" className="gap-1.5">
          <PencilLine className="size-3" aria-hidden="true" />
          Editing coming soon
        </Badge>
      </Card>
    </div>
  );
}