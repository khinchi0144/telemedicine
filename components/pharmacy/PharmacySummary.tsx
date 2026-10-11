import { WEEK_DAY_OPTIONS } from '@/lib/constants/options';
import type { DayOfWeek } from '@/types/pharmacy';

export interface PharmacySummaryProps {
  profile: {
    pharmacyName: string;
    ownerName: string;
    drugLicenseNumber: string | null;
    gstNumber: string | null;
    pharmacyRegistrationNumber: string | null;
    pharmacyType: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    contactNumber: string;
    verificationStatus: string;
  } | null;
  hours: {
    day: DayOfWeek;
    isClosed: boolean;
    openTime: string;
    closeTime: string;
  }[];
}

/** Read-only summary of the pharmacy profile created at registration. */
export function PharmacySummary({ profile, hours }: PharmacySummaryProps) {
  if (!profile) {
    return (
      <p className="mt-6 border-t border-border pt-6 text-sm text-muted-foreground">
        Your pharmacy profile is being set up.
      </p>
    );
  }

  const typeLabel =
    profile.pharmacyType === 'RETAIL_WHOLESALE'
      ? 'Retail + Wholesale'
      : profile.pharmacyType.charAt(0) + profile.pharmacyType.slice(1).toLowerCase();

  const rows = [
    { label: 'Pharmacy name', value: profile.pharmacyName },
    { label: 'Owner / authorized person', value: profile.ownerName },
    { label: 'Drug license number', value: profile.drugLicenseNumber ?? '—' },
    { label: 'GST number', value: profile.gstNumber ?? '—' },
    {
      label: 'Pharmacy registration number',
      value: profile.pharmacyRegistrationNumber ?? 'Not provided',
    },
    { label: 'Pharmacy type', value: typeLabel },
    { label: 'Address', value: `${profile.address}, ${profile.city}` },
    { label: 'State & pincode', value: `${profile.state} – ${profile.pincode}` },
    { label: 'Contact number', value: `+91 ${profile.contactNumber}` },
    { label: 'Verification status', value: profile.verificationStatus },
  ];

  const byDay = new Map(hours.map((row) => [row.day, row]));

  return (
    <section aria-label="Pharmacy profile" className="mt-6 border-t border-border pt-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Pharmacy profile
      </h2>
      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-baseline justify-between gap-4 border-b border-border/60 pb-2.5"
          >
            <dt className="text-sm text-muted-foreground">{row.label}</dt>
            <dd className="text-right text-sm font-medium">{row.value}</dd>
          </div>
        ))}
      </dl>

      <h3 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Operating hours
      </h3>
      <ul className="grid gap-2 sm:grid-cols-2">
        {WEEK_DAY_OPTIONS.map((day) => {
          const value = byDay.get(day.value);
          return (
            <li
              key={day.value}
              className="flex items-center justify-between rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm"
            >
              <span className="font-medium">{day.label}</span>
              <span className={value?.isClosed ? 'text-muted-foreground' : 'text-foreground'}>
                {value?.isClosed
                  ? 'Closed'
                  : `${value?.openTime ?? '—'} – ${value?.closeTime ?? '—'}`}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
