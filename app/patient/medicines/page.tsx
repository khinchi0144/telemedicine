import type { Metadata } from 'next';
import Link from 'next/link';
import { Pill, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { MedicineShop } from '@/components/patient/care/MedicineShop';
import { requireRoleLayout } from '@/lib/auth/role-guard';
import { searchMedicines } from '@/lib/services/orderService';
import { medicineSearchSchema } from '@/lib/validations/care';

export const metadata: Metadata = {
  title: 'Find Medicines',
  description: 'Search verified pharmacies and order medicines.',
};

function first(value: string | string[] | undefined): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

/**
 * Find medicines — server-side search across every verified pharmacy's
 * stock; adding to the cart and checking out are handled by the client shop.
 */
export default async function MedicinesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireRoleLayout(['PATIENT']);
  const raw = await searchParams;
  const parsed = medicineSearchSchema.safeParse({
    q: first(raw.q),
    city: first(raw.city),
  });
  const filters = parsed.success ? parsed.data : {};
  const results = await searchMedicines(filters);
  const searched = Boolean(filters.q || filters.city);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold tracking-tight text-navy-900">
          Find medicines
        </h1>
        <p className="text-sm text-muted-foreground">
          Live stock from verified pharmacies — prices and availability update
          as orders are placed.
        </p>
      </div>

      <Card className="p-4">
        <form
          method="GET"
          action="/patient/medicines"
          className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
        >
          <Input
            type="search"
            name="q"
            placeholder="Medicine name or brand"
            defaultValue={filters.q ?? ''}
            aria-label="Search medicines"
          />
          <Input
            type="text"
            name="city"
            placeholder="City (optional)"
            defaultValue={filters.city ?? ''}
            aria-label="City"
          />
          <div className="flex gap-2">
            <Button type="submit">
              <Search className="size-4" aria-hidden="true" />
              Search
            </Button>
            {searched && (
              <Button variant="ghost" asChild>
                <Link href="/patient/medicines">Clear</Link>
              </Button>
            )}
          </div>
        </form>
      </Card>

      {results.length === 0 ? (
        <EmptyState
          icon={Pill}
          title={searched ? 'No medicines match your search' : 'No stock listed yet'}
          description={
            searched
              ? 'Try a different spelling, a brand name, or remove the city filter.'
              : 'Verified pharmacies publish their inventory here as they stock it.'
          }
          note="Prescription-only medicines are marked with an Rx badge."
          action={
            <Button variant="outline" asChild>
              <Link href="/patient/pharmacies">Browse pharmacies</Link>
            </Button>
          }
        />
      ) : (
        <MedicineShop items={results} />
      )}
    </div>
  );
}