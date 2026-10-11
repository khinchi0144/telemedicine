import type { Metadata } from 'next';

import { PharmacyOverview } from '@/components/pharmacy/PharmacyOverview';
import { requireRoleLayout } from '@/lib/auth/role-guard';
import { getDashboardData } from '@/lib/services/dashboardService';

export const metadata: Metadata = {
  title: 'Pharmacy Dashboard',
  description: 'Your MediCare pharmacy workspace.',
};

/** Overview built from the pharmacy profile, licences and operating hours. */
export default async function PharmacyPage() {
  const user = await requireRoleLayout(['PHARMACY']);
  const data = await getDashboardData(user.id, 'PHARMACY', user.fullName);

  return <PharmacyOverview data={data} />;
}