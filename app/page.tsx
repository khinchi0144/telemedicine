import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { MarketingNav } from '@/components/marketing/MarketingNav';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';
import { Hero } from '@/components/marketing/Hero';
import { HowItWorks } from '@/components/marketing/sections/HowItWorks';
import { Services } from '@/components/marketing/sections/Services';
import { DoctorHighlights } from '@/components/marketing/sections/DoctorHighlights';
import { PharmacyNetwork } from '@/components/marketing/sections/PharmacyNetwork';
import { AccountTypes } from '@/components/marketing/sections/AccountTypes';
import { WhyChoose } from '@/components/marketing/sections/WhyChoose';
import { Faq } from '@/components/marketing/sections/Faq';
import { FinalCta } from '@/components/marketing/sections/FinalCta';
import { getSessionUser } from '@/lib/auth/dal';
import { APP_NAME, APP_TAGLINE } from '@/lib/constants/app';
import { ROLE_HOME } from '@/lib/constants/roles';

export const metadata: Metadata = {
  title: APP_NAME,
  description: `${APP_TAGLINE}. Consult verified doctors, manage prescriptions and reach registered pharmacies from one secure account.`,
};

/**
 * Public landing page.
 *
 * Behaviour preserved from the previous splash screen: a signed-in user is
 * still forwarded straight to their own workspace instead of the marketing
 * site. Everyone else gets the full public experience.
 */
export default async function LandingPage() {
  const user = await getSessionUser();
  if (user) redirect(ROLE_HOME[user.role] ?? '/auth');

  return (
    <div className="flex min-h-dvh flex-col">
      <MarketingNav />
      <main id="main-content" className="flex-1">
        <Hero />
        <HowItWorks />
        <Services />
        <DoctorHighlights />
        <PharmacyNetwork />
        <AccountTypes />
        <WhyChoose />
        <Faq />
        <FinalCta />
      </main>
      <MarketingFooter />
    </div>
  );
}
