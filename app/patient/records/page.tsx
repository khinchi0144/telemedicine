import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText, FolderOpen } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState, Panel } from '@/components/dashboard/EmptyState';
import { AddRecordForm } from '@/components/patient/care/AddRecordForm';
import { DeleteRecordButton } from '@/components/patient/care/DeleteRecordButton';
import { requireRoleLayout } from '@/lib/auth/role-guard';
import { listMedicalRecords } from '@/lib/services/recordService';
import { MEDICAL_RECORD_TYPE_OPTIONS } from '@/lib/constants/options';
import { formatDate } from '@/lib/utils/format';

export const metadata: Metadata = {
  title: 'Medical Records',
  description: 'Your personal health record file.',
};

function typeLabel(value: string): string {
  return (
    MEDICAL_RECORD_TYPE_OPTIONS.find((option) => option.value === value)?.label ??
    value
  );
}

/**
 * Medical records — the patient's own file. Records are added here by the
 * patient (lab reports, discharge summaries, …) and deleted only from this
 * page; the API re-checks ownership on both paths.
 */
export default async function MedicalRecordsPage() {
  const user = await requireRoleLayout(['PATIENT']);
  const records = await listMedicalRecords(user.id);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold tracking-tight text-navy-900">
          Medical records
        </h1>
        <p className="text-sm text-muted-foreground">
          Keep every report and prescription in one place so doctors start from
          the full picture.
        </p>
      </div>

      <Panel
        title="Add a record"
        description="Log a lab report, scan, vaccination or discharge summary."
      >
        <AddRecordForm />
      </Panel>

      {records.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No records yet"
          description="Everything you add above is listed here — newest by record date first."
          note="Your records are private: only doctors you have appointments with can be shown them during a consultation."
        />
      ) : (
        <div className="grid gap-3">
          {records.map((record) => (
            <Card key={record.id} className="flex flex-wrap items-start gap-3 p-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                <FileText className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display text-sm font-bold text-navy-900">
                    {record.title}
                  </p>
                  <Badge variant="secondary">{typeLabel(record.recordType)}</Badge>
                  <Badge variant="outline">
                    {formatDate(record.recordDate ?? record.createdAt)}
                  </Badge>
                </div>
                {record.description && (
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                    {record.description}
                  </p>
                )}
              </div>
              <DeleteRecordButton recordId={record.id} />
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Need to share a document before your visit?{' '}
        <Link className="underline underline-offset-2" href="/patient/messages">
          Message your doctor
        </Link>{' '}
        — or bring it up during the video consultation.
      </p>
    </div>
  );
}