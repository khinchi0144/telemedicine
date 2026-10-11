import type { Metadata } from 'next';

import { RegistrationLayout } from '@/components/auth/RegistrationLayout';
import { DoctorRegistration } from '@/components/doctor/DoctorRegistration';

export const metadata: Metadata = {
  title: 'Doctor registration',
  description: 'Apply for a verified MediCare doctor account.',
};

export default function DoctorRegisterPage() {
  return (
    <RegistrationLayout
      role="Doctor"
      asideTitle="Your documents are reviewed privately by our verification team."
      asidePoints={[
        'Registration and qualification certificates are checked manually.',
        'Your documents are stored in private storage and never published.',
        'You stay in PENDING_VERIFICATION until the review is complete.',
      ]}
    >
      <DoctorRegistration />
    </RegistrationLayout>
  );
}
