import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarPlus, Video } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { requireRoleLayout } from '@/lib/auth/role-guard';
import { listPatientAppointments } from '@/lib/services/appointmentService';
import { formatDate } from '@/lib/utils/format';

export const metadata: Metadata = {
  title: 'Video Consultation',
  description: 'Join your scheduled video consultations.',
};

/**
 * Video consultation lobby — shows the appointments that have a room link.
 *
 * The room itself lives at `/consultations/[appointmentId]` (top level) so a
 * doctor can open the same URL; that page guards on appointment membership
 * rather than the signed-in role.
 */
export default async function ConsultationsPage() {
  const user = await requireRoleLayout(['PATIENT']);
  const items = await listPatientAppointments(user.id);

  const joinable = items.filter(
    (item) =>
      item.appointment.status === 'CONFIRMED' &&
      item.appointment.meetingUrl !== null &&
      item.appointment.scheduledDate.getTime() + 24 * 60 * 60_000 > Date.now(),
  );

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
          description="Confirmed appointments appear here with a Join button when their day approaches."
          note="Book an online doctor first — every confirmed booking gets its own private room."
          action={
            <Button asChild>
              <Link href="/patient/doctors">
                <CalendarPlus className="size-4" aria-hidden="true" />
                Book an appointment
              </Link>
            </Button>
          }
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
                <p className="font-display text-[15px] font-bold text-navy-900">
                  {item.doctorName}
                </p>
                <p className="text-[13px] text-muted-foreground">
                  {formatDate(item.appointment.scheduledDate)} ·{' '}
                  {item.appointment.startTime}–{item.appointment.endTime}
                  {item.doctorSpecialization ? ` · ${item.doctorSpecialization}` : ''}
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