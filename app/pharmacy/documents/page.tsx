import type { Metadata } from 'next';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState, Panel } from '@/components/dashboard/EmptyState';
import { FileCheck2, ShieldCheck } from 'lucide-react';

import { requireRoleLayout } from '@/lib/auth/role-guard';
import { getDashboardData } from '@/lib/services/dashboardService';
import { formatDate, humanizeStatus } from '@/lib/utils/format';

export const metadata: Metadata = {
  title: 'Pharmacy Documents',
  description: 'Licences and certificates attached to your pharmacy.',
};

/** Shows the pharmacy's own documents and their review status. */
export default async function PharmacyDocumentsPage() {
  const user = await requireRoleLayout(['PHARMACY']);
  const data = await getDashboardData(user.id, 'PHARMACY', user.fullName);

  return (
    <div className="space-y-5">
      <Card className="flex flex-wrap items-center gap-4 p-5">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
          <ShieldCheck className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-[15px] font-bold text-navy-900">
            Verification status: {data.verification.label}
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {data.documents.length} document
            {data.documents.length === 1 ? '' : 's'} on file. Documents are stored
            privately and are only visible to you and MediCare administrators.
          </p>
        </div>
      </Card>

      <Panel title="Documents" description="Everything you uploaded at registration.">
        {data.documents.length === 0 ? (
          <EmptyState
            icon={FileCheck2}
            title="No documents"
            description="Drug licence, GST certificate and registration proof appear here once uploaded."
            note="Uploading replacement documents is not available yet — contact support if a document needs to be corrected."
          />
        ) : (
          <ul className="divide-y divide-border/70">
            {data.documents.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-navy-900">
                    {doc.fileName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {humanizeStatus(doc.documentType)} · uploaded{' '}
                    {formatDate(doc.createdAt)}
                  </p>
                </div>
                <Badge
                  variant={
                    doc.verificationStatus === 'APPROVED'
                      ? 'success'
                      : doc.verificationStatus === 'REJECTED'
                        ? 'destructive'
                        : 'warning'
                  }
                >
                  {humanizeStatus(doc.verificationStatus)}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}