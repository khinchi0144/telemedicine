import { formatMobile } from '@/lib/utils/format';
import { formatDate } from '@/lib/utils/format';
import type { SessionUser } from '@/types/auth';

export interface PatientSummaryProps {
  user: SessionUser;
  profile: {
    fullName: string;
    city: string | null;
    state: string | null;
    bloodGroup: string | null;
    dateOfBirth: string | null;
  } | null;
}

/** Read-only summary of the data captured during registration. */
export function PatientSummary({ user, profile }: PatientSummaryProps) {
  const rows = [
    { label: 'Full name', value: profile?.fullName ?? user.fullName },
    { label: 'Mobile number', value: formatMobile(user.mobile) },
    { label: 'Email address', value: user.email ?? '—' },
    { label: 'Date of birth', value: formatDate(profile?.dateOfBirth) },
    { label: 'City', value: profile?.city ?? '—' },
    { label: 'State', value: profile?.state ?? '—' },
    { label: 'Blood group', value: profile?.bloodGroup ?? 'Not provided' },
    { label: 'Account status', value: 'Active' },
  ];

  return (
    <section aria-label="Account summary" className="mt-6 border-t border-border pt-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Your details
      </h2>
      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-4 border-b border-border/60 pb-2.5">
            <dt className="text-sm text-muted-foreground">{row.label}</dt>
            <dd className="text-sm font-medium">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
