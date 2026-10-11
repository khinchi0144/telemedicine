import type { Metadata } from 'next';

import { VerificationList } from '@/components/admin/VerificationList';
import { StatTile } from '@/components/dashboard/StatTile';
import { BadgeCheck, CircleAlert, CircleX, Stethoscope } from 'lucide-react';
import { requireRoleLayout } from '@/lib/auth/role-guard';
import { getVerificationQueue } from '@/lib/services/verificationService';

export const metadata: Metadata = {
  title: 'Doctor Verification',
  description: 'Review and approve doctor applications.',
};

/** The doctor verification queue, newest application first. */
export default async function AdminDoctorsPage() {
  await requireRoleLayout(['ADMIN']);
  const queue = await getVerificationQueue('DOCTOR');

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile icon={Stethoscope} label="Applications" value={queue.counts.total} tone="navy" />
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
        emptyTitle="No doctor applications yet"
        emptyDescription="When a doctor completes registration, their profile and uploaded certificates appear here for review."
      />

      <p className="text-center text-xs text-muted-foreground">
        Showing {queue.counts.total} real application
        {queue.counts.total === 1 ? '' : 's'} — every decision is written to the
        database immediately.
      </p>
    </div>
  );
}