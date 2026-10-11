import type { Metadata } from 'next';

import { LegalPage } from '@/components/common/LegalPage';
import { APP_NAME, APP_SUPPORT_EMAIL, APP_SUPPORT_PHONE } from '@/lib/constants/app';

export const metadata: Metadata = {
  title: 'Support',
  description: `Get help with your ${APP_NAME} account or registration.`,
};

export default function SupportPage() {
  return (
    <LegalPage
      title="Support"
      updated="Available while the platform is in preview"
      intro={`Need help with registration or your account? Our support team can help with sign in issues, OTP delivery and professional verification.`}
      sections={[
        {
          heading: 'Common questions',
          body: 'If an OTP does not arrive, check the mobile number you entered and use the resend option after the countdown finishes. If a doctor or pharmacy account is not approved yet, the verification team is still reviewing the submitted documents.',
        },
        {
          heading: 'Account and privacy requests',
          body: 'You can request a correction or deletion of your account data. Identity documents are removed from private storage once verification is complete and no longer required.',
        },
        {
          heading: 'Emergencies',
          body: `${APP_NAME} is not an emergency service. In an emergency, contact your local emergency number immediately.`,
        },
      ]}
      footerNote={
        <span>
          Email <strong>{APP_SUPPORT_EMAIL}</strong> · Helpline {APP_SUPPORT_PHONE} ·
          Hours 9:00 – 21:00 IST
        </span>
      }
    />
  );
}
