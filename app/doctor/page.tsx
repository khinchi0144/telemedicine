import type { Metadata } from 'next';

import { DoctorOverview } from '@/components/doctor/DoctorOverview';
import { requireRoleLayout } from '@/lib/auth/role-guard';
import { getDashboardData } from '@/lib/services/dashboardService';

export const metadata: Metadata = {
  title: 'Doctor Dashboard',
  description: 'Your MediCare doctor workspace.',
};

/** Overview built from the doctor profile, documents and verification status. */
export default async function DoctorPage() {
  const user = await requireRoleLayout(['DOCTOR']);
  const data = await getDashboardData(user.id, 'DOCTOR', user.fullName);

  return <DoctorOverview data={data} />;
}