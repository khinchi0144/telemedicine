import type { Metadata } from 'next';

import { RegistrationLayout } from '@/components/auth/RegistrationLayout';
import { PharmacyRegistration } from '@/components/pharmacy/PharmacyRegistration';

export const metadata: Metadata = {
  title: 'Pharmacy registration',
  description: 'Apply for a verified MediCare pharmacy account.',
};

export default function PharmacyRegisterPage() {
  return (
    <RegistrationLayout
      role="Pharmacy"
      asideTitle="Your licence documents are reviewed privately by our team."
      asidePoints={[
        'Drug licence, GST and registration certificates are checked manually.',
        'Store photos and documents stay in private storage.',
        'You stay in PENDING_VERIFICATION until the review is complete.',
      ]}
    >
      <PharmacyRegistration />
    </RegistrationLayout>
  );
}
