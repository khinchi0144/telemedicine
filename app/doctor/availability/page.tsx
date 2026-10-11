import type { Metadata } from 'next';

import { AvailabilityEditor } from '@/components/doctor/AvailabilityEditor';
import { requireRoleLayout } from '@/lib/auth/role-guard';
import { getDoctorAvailabilitySettings } from '@/lib/services/doctorAvailabilityService';

export const metadata: Metadata = {
  title: 'Availability',
  description: 'Your weekly consultation timings.',
};

/**
 * Doctor availability — weekly timings patients see when booking.
 *
 * Server-rendered with the saved week so the editor opens on current data.
 * Guarded to DOCTOR accounts; the service additionally requires a VERIFIED
 * profile. Saving replaces the whole week transactionally and never touches
 * existing appointments.
 */
export default async function DoctorAvailabilityPage() {
  const user = await requireRoleLayout(['DOCTOR']);
  const availability = await getDoctorAvailabilitySettings(user.id);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold tracking-tight text-navy-900">
          Availability
        </h1>
        <p className="text-sm text-muted-foreground">
          Set the days and hours patients can book — existing appointments stay
          exactly as they are.
        </p>
      </div>

      <AvailabilityEditor
        initial={availability.map((slot) => ({
          day: slot.day,
          isEnabled: slot.isEnabled,
          startTime: slot.startTime,
          endTime: slot.endTime,
        }))}
      />
    </div>
  );
}
