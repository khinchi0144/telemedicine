import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, Pill, Search, Store } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { requireRoleLayout } from '@/lib/auth/role-guard';
import { searchPharmacies } from '@/lib/services/orderService';

export const metadata: Metadata = {
  title: 'Nearby Pharmacies',
  description: 'Verified pharmacies you can order from.',
};

function first(value: string | string[] | undefined): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

/** Nearby pharmacies — every verified pharmacy on the platform, searchable. */
export default async function PharmaciesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireRoleLayout(['PATIENT']);
  const raw = await searchParams;
  const q = first(raw.q);
  const city = first(raw.city);
  const pharmacies = await searchPharmacies({ q, city });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold tracking-tight text-navy-900">
          Nearby pharmacies
        </h1>
        <p className="text-sm text-muted-foreground">
          Registered pharmacies whose licences we have verified — order from
          any of them under Find medicines.
        </p>
      </div>

      <Card className="p-4">
        <form
          method="GET"
          action="/patient/pharmacies"
          className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
        >
          <Input
            type="search"
            name="q"
            placeholder="Pharmacy name or area"
            defaultValue={q ?? ''}
            aria-label="Search pharmacies"
          />
          <Input
            type="text"
            name="city"
            placeholder="City"
            defaultValue={city ?? ''}
            aria-label="City"
          />
          <div className="flex gap-2">
            <Button type="submit">
              <Search className="size-4" aria-hidden="true" />
              Search
            </Button>
            {(q || city) && (
              <Button variant="ghost" asChild>
                <Link href="/patient/pharmacies">Clear</Link>
              </Button>
            )}
          </div>
        </form>
      </Card>

      {pharmacies.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No pharmacies match your search"
          description="Try another area or clear the filters to see every verified pharmacy."
          note="Pharmacies appear here only after their drug licence is approved."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {pharmacies.map((pharmacy) => (
            <Card key={pharmacy.id} className="flex flex-col gap-3 p-5">
              <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-white">
                  <Store className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-[15px] font-bold text-navy-900">
                      {pharmacy.pharmacyName}
                    </h3>
                    <Badge variant="success">Verified</Badge>
                  </div>
                  <p className="text-[13px] text-muted-foreground">
                    Owner: {pharmacy.ownerName}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 text-[13px] text-muted-foreground">
                <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <p>
                  {pharmacy.address}, {pharmacy.city}, {pharmacy.state}{' '}
                  {pharmacy.pincode}
                </p>
              </div>
              <div className="mt-auto flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {pharmacy.pharmacyType.replace(/_/g, ' ').toLowerCase()}
                </Badge>
                <Badge variant="outline">{pharmacy.contactNumber}</Badge>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/patient/medicines?city=${encodeURIComponent(pharmacy.city)}`}>
                  <Pill className="size-4" aria-hidden="true" />
                  See medicines in {pharmacy.city}
                </Link>
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}