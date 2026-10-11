import type { Metadata } from 'next';
import { CalendarClock, UserRound } from 'lucide-react';

import { EmptyState, Panel } from '@/components/dashboard/EmptyState';
import { AppointmentStatusBadge } from '@/components/patient/care/StatusBadge';
import { DoctorAppointmentActions } from '@/components/doctor/DoctorAppointmentActions';
import { requireRoleLayout } from '@/lib/auth/role-guard';
import { listDoctorAppointments } from '@/lib/services/doctorAppointmentService';
import { formatDate, humanizeStatus } from '@/lib/utils/format';
import type { AppointmentRecord } from '@/lib/db/types';

export const metadata: Metadata = {
  title: 'Appointments',
  description: 'Your booked, upcoming and past patient appointments.',
};

const ACTIVE_STATUSES = ['CONFIRMED', 'REQUESTED'];

function isPast(appointment: AppointmentRecord): boolean {
  const dayEnd = new Date(
    `${appointment.scheduledDate.toISOString().slice(0, 10)}T23:59:59.999Z`,
  );
  return dayEnd.getTime() < Date.now() || !ACTIVE_STATUSES.includes(appointment.status);
}

function AppointmentRow({
  item,
  actionable,
}: {
  item: Awaited<ReturnType<typeof listDoctorAppointments>>[number];
  actionable?: boolean;
}) {
  const { appointment } = item;
  const canAct = actionable === true && appointment.status === 'CONFIRMED';

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-navy-700">
        <UserRound className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-display text-sm font-bold text-navy-900">
            {item.patientName}
          </p>
          <AppointmentStatusBadge status={appointment.status} />
        </div>
        <p className="text-[13px] text-muted-foreground">
          {formatDate(appointment.scheduledDate)} · {appointment.startTime}–
          {appointment.endTime} · {humanizeStatus(item.consultationMode)}
        </p>
        {appointment.reason && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            Reason: {appointment.reason}
          </p>
        )}
      </div>
      {canAct && (
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <DoctorAppointmentActions appointmentId={appointment.id} />
        </div>
      )}
    </li>
  );
}

/**
 * Doctor appointments — read-only list of the signed-in doctor's own visits.
 *
 * Guarded to DOCTOR accounts; the service additionally requires a VERIFIED
 * profile before returning any clinical rows. Upcoming visits render first,
 * then everything already behind the doctor.
 */
export default async function DoctorAppointmentsPage() {
  const user = await requireRoleLayout(['DOCTOR']);
  const items = await listDoctorAppointments(user.id);

  const upcoming = items
    .filter((item) => !isPast(item.appointment))
    .sort(
      (a, b) =>
        a.appointment.scheduledDate.getTime() -
        b.appointment.scheduledDate.getTime(),
    );
  const past = items.filter((item) => isPast(item.appointment));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold tracking-tight text-navy-900">
          Appointments
        </h1>
        <p className="text-sm text-muted-foreground">
          Upcoming visits first, then everything already behind you.
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No appointments yet"
          description="When a patient books you from Find doctors, the visit shows up here with the patient's name and time."
          note="Only confirmed and requested visits appear under Upcoming."
        />
      ) : (
        <>
          <Panel
            title="Upcoming"
            description="Confirmed and requested visits that are still ahead."
          >
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing scheduled right now — new bookings appear here.
              </p>
            ) : (
              <ul className="space-y-3">
                {upcoming.map((item) => (
                  <AppointmentRow key={item.appointment.id} item={item} actionable />
                ))}
              </ul>
            )}
          </Panel>

          {past.length > 0 && (
            <Panel
              title="Past and cancelled"
              description="Completed visits and appointments that were cancelled."
            >
              <ul className="space-y-3">
                {past.map((item) => (
                  <AppointmentRow key={item.appointment.id} item={item} />
                ))}
              </ul>
            </Panel>
          )}
        </>
      )}
    </div>
  );
}
