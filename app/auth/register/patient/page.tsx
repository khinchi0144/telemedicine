import type { Metadata } from 'next';

import { RegistrationLayout } from '@/components/auth/RegistrationLayout';
import { PatientRegistration } from '@/components/patient/PatientRegistration';

export const metadata: Metadata = {
  title: 'Patient registration',
  description: 'Create your MediCare patient account.',
};

export default function PatientRegisterPage() {
  return (
    <RegistrationLayout
      role="Patient"
      homePath="/auth"
      asideTitle="A simple, secure start to your healthcare journey."
      asidePoints={[
        'Your mobile number is verified before the account is created.',
        'Health information is optional and you stay in control of it.',
        'You can update every detail later from your profile.',
      ]}
    >
      <PatientRegistration />
    </RegistrationLayout>
  );
}

