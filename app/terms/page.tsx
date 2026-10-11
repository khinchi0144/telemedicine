import type { Metadata } from 'next';
import Link from 'next/link';

import { LegalPage } from '@/components/common/LegalPage';
import { APP_NAME } from '@/lib/constants/app';

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: `Terms of use for ${APP_NAME}.`,
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      updated="Last updated: Phase 1 release"
      intro={`These terms describe how ${APP_NAME} may be used while the authentication and registration services are in preview. They are written in plain language and do not replace professional advice.`}
      sections={[
        {
          heading: 'Who can register',
          body: 'Patients can create an account to manage their healthcare journey. Doctors and registered pharmacies can apply for a professional account; those applications are reviewed by our team before the professional dashboard becomes available.',
        },
        {
          heading: 'Account security',
          body: 'Keep your password private and sign out on shared devices. We use hashed passwords, secure sessions and two step verification by mobile OTP to protect your account.',
        },
        {
          heading: 'Information you provide',
          body: 'Details you enter during registration — including professional qualifications and pharmacy licence numbers — must be accurate. Providing false information may lead to suspension of the account.',
        },
        {
          heading: 'Not medical advice',
          body: `${APP_NAME} does not provide diagnosis, treatment or medical recommendations. Always consult a qualified healthcare professional about your health.`,
        },
        {
          heading: 'Availability',
          body: 'Features described as coming soon are not yet available. We aim to keep the registration and account services running reliably, but maintenance windows may occur.',
        },
      ]}
      footerNote={
        <>
          Read the{' '}
          <Link href="/privacy" className="font-medium text-primary hover:underline">
            Privacy Policy
          </Link>{' '}
          or{' '}
          <Link href="/support" className="font-medium text-primary hover:underline">
            contact support
          </Link>
          .
        </>
      }
    />
  );
}
