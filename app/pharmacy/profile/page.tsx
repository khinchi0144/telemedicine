import type { Metadata } from 'next';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState, Panel } from '@/components/dashboard/EmptyState';
import { FactRow } from '@/components/doctor/DoctorOverview';
import { FileCheck2, Store } from 'lucide-react';

import { requireRoleLayout } from '@/lib/auth/role-guard';
import { getDashboardData } from '@/lib/services/dashboardService';
import { formatDate } from '@/lib/utils/format';

export const metadata: Metadata = {
  title: 'Pharmacy Profile',
  description: 'Your MediCare pharmacy profile.',
};

/** Read-only pharmacy profile shown to admins and, once verified, to patients. */
export default async function PharmacyProfilePage() {
  const user = await requireRoleLayout(['PHARMACY']);
  const data = await getDashboardData(user.id, 'PHARMACY', user.fullName);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <Panel
        title="Business details"
        description="Licence information registered with MediCare."
      >
        <div className="grid gap-x-8 gap-y-3.5 sm:grid-cols-2">
          {data.facts.map((fact) => (
            <FactRow key={fact.label} label={fact.label} value={fact.value} />
          ))}
        </div>
      </Panel>

      <Card className="flex h-fit flex-col items-center gap-4 p-6 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-teal-50 text-teal-700">
          <Store className="size-7" aria-hidden="true" />
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

        {data.documents.length === 0 ? (
          <EmptyState
            compact
            icon={FileCheck2}
            title="No documents"
            description="Uploaded certificates appear in the Documents tab."
          />
        ) : (
          <p className="text-xs text-muted-foreground">
            {data.documents.length} document
            {data.documents.length === 1 ? '' : 's'} on file
          </p>
        )}
      </Card>
    </div>
  );
}