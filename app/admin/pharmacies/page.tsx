import type { Metadata } from 'next';

import { BadgeCheck, Building2, CircleAlert, CircleX } from 'lucide-react';

import { VerificationList } from '@/components/admin/VerificationList';
import { StatTile } from '@/components/dashboard/StatTile';
import { requireRoleLayout } from '@/lib/auth/role-guard';
import { getVerificationQueue } from '@/lib/services/verificationService';

export const metadata: Metadata = {
  title: 'Pharmacy Verification',
  description: 'Review and approve pharmacy applications.',
};

/** The pharmacy verification queue, newest application first. */
export default async function AdminPharmaciesPage() {
  await requireRoleLayout(['ADMIN']);
  const queue = await getVerificationQueue('PHARMACY');

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile icon={Building2} label="Applications" value={queue.counts.total} tone="navy" />
        <StatTile
          icon={CircleAlert}
          label="Pending"
          value={queue.counts.pending}
          tone="warning"
        />
        <StatTile
          icon={BadgeCheck}
          label="Verified"
          value={queue.counts.verified}
          tone="success"
        />
        <StatTile
          icon={CircleX}
          label="Rejected"
          value={queue.counts.rejected}
          tone="teal"
        />
      </div>

      <VerificationList
        entries={queue.entries}
        emptyTitle="No pharmacy applications yet"
        emptyDescription="When a pharmacy completes registration, its licence details and uploaded certificates appear here for review."
      />

      <p className="text-center text-xs text-muted-foreground">
        Showing {queue.counts.total} real application
        {queue.counts.total === 1 ? '' : 's'} — every decision is written to the
        database immediately.
      </p>
    </div>
  );
}