export interface DoctorSummaryProps {
  profile: {
    fullName: string;
    medicalRegistrationNumber: string;
    medicalCouncil: string;
    specialization: string;
    qualification: string;
    experienceYears: number;
    clinicName: string;
    city: string;
    state: string;
    consultationMode: string;
    verificationStatus: string;
  } | null;
}

/** Read-only summary of the professional profile created at registration. */
export function DoctorSummary({ profile }: DoctorSummaryProps) {
  if (!profile) {
    return (
      <p className="mt-6 border-t border-border pt-6 text-sm text-muted-foreground">
        Your professional profile is being set up.
      </p>
    );
  }

  const rows = [
    { label: 'Full name', value: profile.fullName },
    { label: 'Medical registration number', value: profile.medicalRegistrationNumber },
    { label: 'Medical council', value: profile.medicalCouncil },
    { label: 'Specialization', value: profile.specialization },
    { label: 'Qualification', value: profile.qualification },
    { label: 'Experience', value: `${profile.experienceYears} years` },
    { label: 'Clinic / hospital', value: profile.clinicName },
    { label: 'Location', value: `${profile.city}, ${profile.state}` },
    {
      label: 'Consultation mode',
      value: profile.consultationMode.charAt(0) + profile.consultationMode.slice(1).toLowerCase(),
    },
    { label: 'Verification status', value: profile.verificationStatus },
  ];

  return (
    <section aria-label="Professional profile" className="mt-6 border-t border-border pt-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Professional profile
      </h2>
      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-baseline justify-between gap-4 border-b border-border/60 pb-2.5"
          >
            <dt className="text-sm text-muted-foreground">{row.label}</dt>
            <dd className="text-sm font-medium">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
