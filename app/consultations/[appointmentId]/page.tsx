import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { getSessionUser } from '@/lib/auth/dal';
import { VideoRoom } from '@/components/patient/care/VideoRoom';
import { getRoom } from '@/lib/services/consultationService';

export const metadata: Metadata = {
  title: 'Consultation Room',
  description: 'Your private video consultation room.',
};

/**
 * Consultation room.
 *
 * Deliberately top level (not under /patient): the room guards on
 * *appointment membership*, so the patient and the doctor can open the exact
 * same `meetingUrl`. Everyone else gets a 404 — the same response as a room
 * that does not exist, so ids cannot be probed.
 */
export default async function ConsultationRoomPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/auth/login');

  const { appointmentId } = await params;
  let room: Awaited<ReturnType<typeof getRoom>>;
  try {
    room = await getRoom(user.id, appointmentId);
  } catch {
    notFound();
  }

  // Membership is already proven by getRoom above (patient OR doctor). Derive
  // the back link from that server-side result — never a client-supplied role —
  // so the doctor returns to the doctor lobby and the patient to the patient one.
  const backHref =
    room.appointment.patientUserId === user.id
      ? '/patient/consultations'
      : '/doctor/consultations';

  const when = `${room.appointment.scheduledDate.toISOString().slice(0, 10)} · ${room.appointment.startTime}–${room.appointment.endTime}`;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-lg font-bold tracking-tight text-navy-900">
            Video consultation
          </h1>
          <p className="text-sm text-muted-foreground">
            {room.otherPartyName} · scheduled {when}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={backHref}>Back to consultations</Link>
        </Button>
      </div>

      <VideoRoom
        appointmentId={room.appointment.id}
        currentUserId={user.id}
        otherPartyName={room.otherPartyName}
        isInitiator={room.isInitiator}
        status={room.appointment.status}
        whenLabel={when}
        backHref={backHref}
      />
    </div>
  );
}