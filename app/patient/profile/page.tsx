import type { Metadata } from 'next';

import { EditProfileForm } from '@/components/patient/EditProfileForm';
import { requireRoleLayout } from '@/lib/auth/role-guard';
import { getStore } from '@/lib/db';

export const metadata: Metadata = {
  title: 'My Profile',
  description: 'Your MediCare patient profile.',
};

/**
 * Patient profile — read view plus an inline editor.
 *
 * The form posts to `PATCH /api/patient/profile`, which re-checks the role and
 * re-validates server side, so a stale or hand-crafted payload cannot change
 * anything the patient does not own.
 */
export default async function PatientProfilePage() {
  const user = await requireRoleLayout(['PATIENT']);
  const store = await getStore();
  const profile = await store.getPatientProfileByUserId(user.id);

  return (
    <EditProfileForm
      user={{ fullName: user.fullName, email: user.email, mobile: user.mobile }}
      profile={
        profile
          ? {
              fullName: profile.fullName,
              dateOfBirth: profile.dateOfBirth
                ? profile.dateOfBirth.toISOString().slice(0, 10)
                : '',
              gender: profile.gender ?? '',
              address: profile.address ?? '',
              city: profile.city ?? '',
              state: profile.state ?? '',
              pincode: profile.pincode ?? '',
              emergencyContactName: profile.emergencyContactName ?? '',
              emergencyContactNumber: profile.emergencyContactNumber ?? '',
              bloodGroup: profile.bloodGroup ?? '',
              existingConditions: profile.existingConditions ?? '',
              allergies: profile.allergies ?? '',
            }
          : null
      }
    />
  );
}