import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, Search, Stethoscope } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { BookAppointmentPanel } from '@/components/patient/care/BookAppointmentPanel';
import { MessageDoctorButton } from '@/components/patient/care/MessageDoctorButton';
import { requireRoleLayout } from '@/lib/auth/role-guard';
import { searchDoctors } from '@/lib/services/appointmentService';
import { SPECIALIZATION_OPTIONS } from '@/lib/constants/options';
import { formatInr } from '@/lib/utils/format';
import { doctorSearchSchema } from '@/lib/validations/care';
import type { DoctorProfileRecord } from '@/lib/db/types';

export const metadata: Metadata = {
  title: 'Find Doctors',
  description: 'Search verified doctors and book an appointment.',
};

function first(value: string | string[] | undefined): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function DoctorCard({ doctor }: { doctor: DoctorProfileRecord }) {
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-navy-900 font-display text-sm font-bold text-white">
          {initials(doctor.fullName)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-[15px] font-bold text-navy-900">
              {doctor.fullName}
            </h3>
            <Badge variant="success">Verified</Badge>
          </div>
          <p className="text-[13px] text-muted-foreground">
            {doctor.specialization} · {doctor.experienceYears} yrs experience
          </p>
        </div>
      </div>

      <dl className="space-y-1.5 text-[13px]">
        <div className="flex items-start gap-2 text-muted-foreground">
          <Stethoscope className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <dd>
            {doctor.clinicName} · {doctor.qualification}
          </dd>
        </div>
        <div className="flex items-start gap-2 text-muted-foreground">
          <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <dd>
            {doctor.clinicAddress}, {doctor.city}
          </dd>
        </div>
      </dl>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">
          {doctor.consultationMode === 'ONLINE'
            ? 'Online consults'
            : doctor.consultationMode === 'OFFLINE'
              ? 'In-person consults'
              : 'Online + in-person'}
        </Badge>
        {doctor.consultationFee !== null && (
          <Badge variant="outline">{formatInr(doctor.consultationFee * 100)} fee</Badge>
        )}
      </div>

      <div className="mt-auto flex flex-col gap-3 border-t border-border pt-4">
        <div className="flex flex-wrap gap-2">
          <BookAppointmentPanel doctorId={doctor.id} />
          <MessageDoctorButton doctorUserId={doctor.userId} />
        </div>
      </div>
    </Card>
  );
}

/**
 * Find doctors — the entry point of the booking flow.
 *
 * Search runs server side through a GET form, so the results are linkable
 * and work without JavaScript; only the booking and messaging actions are
 * client components.
 */
export default async function FindDoctorsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireRoleLayout(['PATIENT']);
  const raw = await searchParams;
  const parsed = doctorSearchSchema.safeParse({
    q: first(raw.q),
    city: first(raw.city),
    specialization: first(raw.specialization),
  });
  const filters = parsed.success ? parsed.data : {};
  const doctors = await searchDoctors(filters);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold tracking-tight text-navy-900">
          Find doctors
        </h1>
        <p className="text-sm text-muted-foreground">
          Only verified doctors appear here — book a 30 minute slot or message
          them before you decide.
        </p>
      </div>

      <Card className="p-4">
        <form
          method="GET"
          action="/patient/doctors"
          className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
        >
          <Input
            type="search"
            name="q"
            placeholder="Doctor, clinic or speciality"
            defaultValue={filters.q ?? ''}
            aria-label="Search doctors"
          />
          <select
            name="specialization"
            defaultValue={filters.specialization ?? ''}
            aria-label="Specialization"
            className="h-11 rounded-lg border border-input bg-card px-3 text-[15px] text-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
          >
            <option value="">All specializations</option>
            {SPECIALIZATION_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <Input
            type="text"
            name="city"
            placeholder="City"
            defaultValue={filters.city ?? ''}
            aria-label="City"
          />
          <div className="flex gap-2">
            <Button type="submit" size="md">
              <Search className="size-4" aria-hidden="true" />
              Search
            </Button>
            {(filters.q || filters.city || filters.specialization) && (
              <Button variant="ghost" size="md" asChild>
                <Link href="/patient/doctors">Clear</Link>
              </Button>
            )}
          </div>
        </form>
      </Card>

      {doctors.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No doctors match your search"
          description="Try a different speciality, remove the city filter, or search for a doctor by name."
          note="New doctors appear here as they complete verification, so check back soon."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {doctors.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} />
          ))}
        </div>
      )}
    </div>
  );
}