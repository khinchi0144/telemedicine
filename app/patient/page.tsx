import type { Metadata } from 'next';

import { PatientOverview } from '@/components/patient/PatientOverview';
import { requireRoleLayout } from '@/lib/auth/role-guard';
import { getDashboardData } from '@/lib/services/dashboardService';

export const metadata: Metadata = {
  title: 'Patient Dashboard',
  description: 'Your MediCare patient dashboard.',
};

/** Overview built entirely from the signed-in patient's own stored records. */
export default async function PatientPage() {
  const user = await requireRoleLayout(['PATIENT']);
  const data = await getDashboardData(user.id, 'PATIENT', user.fullName);

  return <PatientOverview data={data} />;
}
