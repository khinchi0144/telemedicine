import type { Metadata } from 'next';

import { AdminOverview } from '@/components/admin/AdminOverview';
import { requireRoleLayout } from '@/lib/auth/role-guard';
import { getPlatformOverview } from '@/lib/services/verificationService';

export const metadata: Metadata = {
  title: 'Admin Console',
  description: 'MediCare administration console.',
};

/** Counts come from the real verification tables — nothing is hard coded. */
export default async function AdminPage() {
  await requireRoleLayout(['ADMIN']);
  const { doctors, pharmacies } = await getPlatformOverview();

  return <AdminOverview doctors={doctors} pharmacies={pharmacies} />;
}
