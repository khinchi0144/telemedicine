import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarClock, CalendarPlus, Video } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState, Panel } from '@/components/dashboard/EmptyState';
import { CancelAppointmentButton } from '@/components/patient/care/CancelAppointmentButton';
import { AppointmentStatusBadge } from '@/components/patient/care/StatusBadge';
import { requireRoleLayout } from '@/lib/auth/role-guard';
import { listPatientAppointments } from '@/lib/services/appointmentService';
import { formatDate } from '@/lib/utils/format';
import type { AppointmentRecord } from '@/lib/db/types';

export const metadata: Metadata = {
  title: 'My Appointments',
  description: 'Your booked, upcoming and past appointments.',
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
  upcoming,
}: {
  item: Awaited<ReturnType<typeof listPatientAppointments>>[number];
  upcoming: boolean;
}) {
  const { appointment } = item;
  const canCancel = upcoming && ACTIVE_STATUSES.includes(appointment.status);
  const canJoin =
    upcoming && appointment.status === 'CONFIRMED' && appointment.meetingUrl;

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
        <CalendarClock className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-display text-sm font-bold text-navy-900">
            {item.doctorName}
          </p>
          <AppointmentStatusBadge status={appointment.status} />
        </div>
        <p className="text-[13px] text-muted-foreground">
          {formatDate(appointment.scheduledDate)} · {appointment.startTime}–
          {appointment.endTime}
          {item.doctorSpecialization ? ` · ${item.doctorSpecialization}` : ''}
        </p>
        {appointment.reason && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            Reason: {appointment.reason}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {canJoin && (
          <Button size="sm" variant="navy" asChild>
            <Link href={appointment.meetingUrl!}>
              <Video className="size-4" aria-hidden="true" />
              Join video call
            </Link>
          </Button>
        )}
        {canCancel && <CancelAppointmentButton appointmentId={appointment.id} />}
      </div>
    </li>
  );
}

/**
 * My appointments — the single list behind both the "Book appointment" and
 * "My appointments" sidebar links (the primary action here is finding a new
 * doctor, since booking happens from a doctor's card).
 */
export default async function AppointmentsPage() {
  const user = await requireRoleLayout(['PATIENT']);
  const items = await listPatientAppointments(user.id);

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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight text-navy-900">
            My appointments
          </h1>
          <p className="text-sm text-muted-foreground">
            Upcoming visits first, then everything already behind you.
          </p>
        </div>
        <Button asChild>
          <Link href="/patient/doctors">
            <CalendarPlus className="size-4" aria-hidden="true" />
            Book new appointment
          </Link>
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No appointments yet"
          description="When you book a doctor from Find doctors, the visit shows up here with its video call link."
          note="Appointments are 30 minutes long and can be cancelled up to the day before."
          action={
            <Button asChild>
              <Link href="/patient/doctors">Find a doctor</Link>
            </Button>
          }
        />
      ) : (
        <>
          <Panel
            title="Upcoming"
            description="Confirmed and requested visits you can still join or cancel."
          >
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing scheduled right now — book a doctor when you need one.
              </p>
            ) : (
              <ul className="space-y-3">
                {upcoming.map((item) => (
                  <AppointmentRow key={item.appointment.id} item={item} upcoming />
                ))}
              </ul>
            )}
          </Panel>

          {past.length > 0 && (
            <Panel
              title="Past and cancelled"
              description="Completed visits and appointments you cancelled."
            >
              <ul className="space-y-3">
                {past.map((item) => (
                  <AppointmentRow key={item.appointment.id} item={item} upcoming={false} />
                ))}
              </ul>
            </Panel>
          )}
        </>
      )}
    </div>
  );
}