import type { Metadata } from 'next';
import Link from 'next/link';

import { LegalPage } from '@/components/common/LegalPage';
import { APP_NAME } from '@/lib/constants/app';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: `How ${APP_NAME} collects, uses and protects your information.`,
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="Last updated: Phase 1 release"
      intro={`${APP_NAME} handles sensitive health information. This page explains what we collect, why we need it and how we protect it.`}
      sections={[
        {
          heading: 'What we collect',
          body: 'Account details (name, mobile number, email), the information you choose to share in your profile, and — for doctors and pharmacies — the qualification and licence documents required for verification.',
        },
        {
          heading: 'How we use it',
          body: 'To create and secure your account, to verify professional registrations, and to provide the services you ask for. We do not sell your information and we do not share it for advertising.',
        },
        {
          heading: 'How we protect it',
          body: 'Passwords are hashed and never stored in plain text. Sessions use secure, HTTP-only cookies. Medical documents are kept in private storage that cannot be reached through a public link, and access is limited to the verification team and the account owner.',
        },
        {
          heading: 'Your choices',
          body: 'You can update the optional health information you provided, and you can ask us to correct or delete your account by contacting support.',
        },
        {
          heading: 'No medical claims',
          body: `${APP_NAME} does not guarantee any medical outcome. Specializations and pharmacy details shown in the platform are self-declared and verified only for identity and licence purposes.`,
        },
      ]}
      footerNote={
        <>
          See our{' '}
          <Link href="/terms" className="font-medium text-primary hover:underline">
            Terms of Use
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
