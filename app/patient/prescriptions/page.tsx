import type { Metadata } from 'next';
import Link from 'next/link';
import { ClipboardList, Pill } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { PrescriptionStatusBadge } from '@/components/patient/care/StatusBadge';
import { requireRoleLayout } from '@/lib/auth/role-guard';
import { listPrescriptions } from '@/lib/services/prescriptionService';
import { formatDate } from '@/lib/utils/format';

export const metadata: Metadata = {
  title: 'Prescriptions',
  description: 'Your digital prescriptions and their medicine lines.',
};

/**
 * Prescriptions — read only for the patient. They are written by the doctor
 * during a consultation; this page lists each one with its medicines and the
 * prescriber's name.
 */
export default async function PrescriptionsPage() {
  const user = await requireRoleLayout(['PATIENT']);
  const items = await listPrescriptions(user.id);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold tracking-tight text-navy-900">
          Prescriptions
        </h1>
        <p className="text-sm text-muted-foreground">
          Issued by your doctors — use them to order medicines from Find
          medicines.
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No prescriptions yet"
          description="When a doctor writes you a prescription during a consultation, it appears here with every medicine line."
          note="Nothing on this page is ever generated automatically — only a doctor can add one."
          action={
            <Button asChild>
              <Link href="/patient/doctors">Find a doctor</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {items.map(({ prescription, doctorName }) => (
            <Card key={prescription.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-[15px] font-bold text-navy-900">
                      {prescription.diagnosis ?? 'Consultation prescription'}
                    </h2>
                    <PrescriptionStatusBadge status={prescription.status} />
                  </div>
                  <p className="text-[13px] text-muted-foreground">
                    Dr. {doctorName.replace(/^Dr\.\s*/, '')} ·{' '}
                    {formatDate(prescription.createdAt)}
                  </p>
                </div>
                <Badge variant="outline">
                  {prescription.items.length} medicine
                  {prescription.items.length === 1 ? '' : 's'}
                </Badge>
              </div>

              <ul className="mt-4 space-y-3">
                {prescription.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-3 rounded-xl border border-border/70 bg-surface-muted/50 p-3.5"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                      <Pill className="size-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-navy-900">
                        {item.medicineName}
                      </p>
                      <p className="text-[13px] text-muted-foreground">
                        {[
                          item.dosage,
                          item.frequency,
                          item.duration,
                        ]
                          .filter(Boolean)
                          .join(' · ') || 'Dosage as advised by your doctor'}
                      </p>
                      {item.instructions && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {item.instructions}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              {prescription.notes && (
                <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                  Doctor&apos;s notes: {prescription.notes}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}