import type { Metadata } from 'next';
import Link from 'next/link';
import { ClipboardList, FilePlus2 } from 'lucide-react';

import { EmptyState, Panel } from '@/components/dashboard/EmptyState';
import { AppointmentStatusBadge } from '@/components/patient/care/StatusBadge';
import { DoctorPrescriptionForm } from '@/components/doctor/DoctorPrescriptionForm';
import { Button } from '@/components/ui/button';
import { requireRoleLayout } from '@/lib/auth/role-guard';
import { listDoctorAppointments } from '@/lib/services/doctorAppointmentService';
import { formatDate } from '@/lib/utils/format';

export const metadata: Metadata = {
  title: 'Prescriptions',
  description: 'Write a prescription for a confirmed or completed consultation.',
};

// Mirrors the service's eligibility rule: only confirmed or completed visits
// may receive a prescription. Cancelled and no-show visits never appear here.
const ELIGIBLE_STATUSES = ['CONFIRMED', 'COMPLETED'];

/**
 * Doctor prescriptions — pick an eligible appointment, then write it.
 *
 * Guarded to DOCTOR accounts; the list service additionally requires a VERIFIED
 * profile and scopes rows to the signed-in doctor. The form only sends the
 * chosen appointment id — the patient and doctor identities are resolved from
 * the appointment and the session server-side, so they can never be forged.
 */
export default async function DoctorPrescriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ appointment?: string }>;
}) {
  const user = await requireRoleLayout(['DOCTOR']);
  const { appointment: selectedId } = await searchParams;

  const items = await listDoctorAppointments(user.id);
  const eligible = items.filter((item) =>
    ELIGIBLE_STATUSES.includes(item.appointment.status),
  );

  if (eligible.length === 0) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight text-navy-900">
            Prescriptions
          </h1>
          <p className="text-sm text-muted-foreground">
            Write a prescription for a confirmed or completed consultation.
          </p>
        </div>
        <EmptyState
          icon={ClipboardList}
          title="No eligible consultations yet"
          description="Prescriptions can only be written for confirmed or completed appointments."
          note="Once a patient books you and the visit is confirmed or completed, it appears here ready to prescribe."
        />
      </div>
    );
  }

  // Fall back to the first eligible appointment when nothing valid is selected,
  // and ignore a selected id that isn't one of this doctor's eligible rows.
  const selected =
    eligible.find((item) => item.appointment.id === selectedId) ?? eligible[0];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold tracking-tight text-navy-900">
          Prescriptions
        </h1>
        <p className="text-sm text-muted-foreground">
          Choose a consultation, then add the medicines and instructions for the
          patient.
        </p>
      </div>

      <Panel
        title="Eligible consultations"
        description="Confirmed or completed visits you can prescribe for."
      >
        <ul className="grid gap-2 sm:grid-cols-2">
          {eligible.map((item) => {
            const isActive = item.appointment.id === selected.appointment.id;
            return (
              <li key={item.appointment.id}>
                <Link
                  href={`/doctor/prescriptions?appointment=${item.appointment.id}`}
                  className={
                    isActive
                      ? 'flex flex-wrap items-center gap-2 rounded-xl border border-navy-900 bg-navy-50 p-3'
                      : 'flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3 hover:border-navy-200'
                  }
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-sm font-bold text-navy-900">
                        {item.patientName}
                      </span>
                      <AppointmentStatusBadge status={item.appointment.status} />
                    </span>
                    <span className="block text-[13px] text-muted-foreground">
                      {formatDate(item.appointment.scheduledDate)} ·{' '}
                      {item.appointment.startTime}–{item.appointment.endTime}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel
        title="New prescription"
        description="Add at least one medicine, then save. The patient sees it immediately."
        action={
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/doctor/appointments`}>View appointments</Link>
          </Button>
        }
      >
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-border bg-surface-muted/60 px-4 py-3 text-[13px] text-muted-foreground">
          <FilePlus2 className="size-4 shrink-0 text-navy-700" aria-hidden="true" />
          <span>
            Writing for <strong className="text-navy-900">{selected.patientName}</strong> ·{' '}
            {formatDate(selected.appointment.scheduledDate)} ·{' '}
            {selected.appointment.startTime}–{selected.appointment.endTime}
          </span>
        </div>

        <DoctorPrescriptionForm
          appointmentId={selected.appointment.id}
          patientName={selected.patientName}
          scheduledLabel={`${formatDate(selected.appointment.scheduledDate)} · ${selected.appointment.startTime}–${selected.appointment.endTime}`}
        />
      </Panel>
    </div>
  );
}
