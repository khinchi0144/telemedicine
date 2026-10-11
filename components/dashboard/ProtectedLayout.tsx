import { AppShell } from '@/components/dashboard/AppShell';
import { requireRoleLayout } from '@/lib/auth/role-guard';
import type { Role } from '@/types/auth';

const SUBTITLES: Record<Role, string> = {
  PATIENT: 'Your health workspace — profile, care and prescriptions.',
  DOCTOR: 'Your clinical workspace — verification, patients and consultations.',
  PHARMACY: 'Your pharmacy workspace — licences, inventory and orders.',
  ADMIN: 'MediCare operations — verification queue and platform health.',
};

/**
 * Renders the shared dashboard chrome after the server side role guard passes.
 *
 * Keeping this in one place guarantees the sidebar, top bar and mobile nav can
 * never drift between roles. The page heading is derived from the active route
 * inside `AppShell`, so nested pages label themselves without boilerplate here.
 */
export async function ProtectedLayout({
  allowed,
  children,
}: {
  allowed: Role[];
  children: React.ReactNode;
}) {
  const user = await requireRoleLayout(allowed);

  return (
    <AppShell user={user} subtitle={SUBTITLES[user.role]}>
      {children}
    </AppShell>
  );
}