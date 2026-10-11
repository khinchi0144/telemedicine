import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Video } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { AppointmentStatusBadge } from '@/components/patient/care/StatusBadge';
import { requireRoleLayout } from '@/lib/auth/role-guard';
import { listDoctorAppointments } from '@/lib/services/doctorAppointmentService';
import { isAppError } from '@/lib/utils/errors';
import { formatDate, humanizeStatus } from '@/lib/utils/format';
import type { AppointmentRecord } from '@/lib/db/types';

export const metadata: Metadata = {
  title: 'Video Consultation',
  description: 'Join your scheduled doctor video consultations.',
};

/**
 * A room can be joined when the booking is confirmed, carries a room link, and
 * its scheduled day has not fully passed — the same eligibility rule the
 * patient lobby uses, so both sides agree on when a room is open.
 */
function isJoinable(appointment: AppointmentRecord): boolean {
  return (
    appointment.status === 'CONFIRMED' &&
    appointment.meetingUrl !== null &&
    appointment.scheduledDate.getTime() + 24 * 60 * 60_000 > Date.now()
  );
}

/**
 * Doctor video consultation lobby.
 *
 * Guarded to DOCTOR accounts; the service additionally requires a VERIFIED
 * profile and scopes rows to the signed-in doctor's id (never a client value),
 * so only the doctor's own confirmed rooms can ever be listed. Unverified
 * doctors see a clear "pending approval" notice instead of a raw error. The
 * room itself lives at the shared `/consultations/[appointmentId]` route, which
 * re-checks appointment membership before it will connect anyone.
 */
export default async function DoctorConsultationsPage() {
  const user = await requireRoleLayout(['DOCTOR']);

  let items;
  try {
    items = await listDoctorAppointments(user.id);
  } catch (error) {
    if (isAppError(error) && error.code === 'FORBIDDEN') {
      return (
        <EmptyState
          icon={ShieldCheck}
          title="Verification required"
          description="Video consultations unlock once an admin approves your profile."
          note="Confirmed patient appointments appear here with a Join button after approval."
        />
      );
    }
    throw error;
  }

  const joinable = items.filter((item) => isJoinable(item.appointment));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold tracking-tight text-navy-900">
          Video consultation
        </h1>
        <p className="text-sm text-muted-foreground">
          Rooms open for confirmed appointments — allow camera and microphone
          access when the browser asks.
        </p>
      </div>

      {joinable.length === 0 ? (
        <EmptyState
          icon={Video}
          title="No video rooms right now"
          description="Confirmed patient appointments appear here with a Join button when their day approaches."
          note="Only confirmed appointments with a private room link show up here."
        />
      ) : (
        <div className="space-y-3">
          {joinable.map((item) => (
            <Card
              key={item.appointment.id}
              className="flex flex-wrap items-center gap-4 p-5"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-white">
                <Video className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display text-[15px] font-bold text-navy-900">
                    {item.patientName}
                  </p>
                  <AppointmentStatusBadge status={item.appointment.status} />
                </div>
                <p className="text-[13px] text-muted-foreground">
                  {formatDate(item.appointment.scheduledDate)} ·{' '}
                  {item.appointment.startTime}–{item.appointment.endTime}
                  {item.consultationMode
                    ? ` · ${humanizeStatus(item.consultationMode)}`
                    : ''}
                </p>
              </div>
              <Button asChild>
                <Link href={item.appointment.meetingUrl!}>
                  <Video className="size-4" aria-hidden="true" />
                  Join room
                </Link>
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
