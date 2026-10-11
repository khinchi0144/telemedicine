import { FileCheck2, MapPin, Phone, UserRound } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { ReviewButtons } from '@/components/admin/ReviewButtons';
import { cn } from '@/lib/utils/cn';
import { formatDate, humanizeStatus } from '@/lib/utils/format';
import type { ProfessionalProfileEntry } from '@/lib/db/types';

const STATUS_VARIANT = {
  VERIFIED: 'success',
  REJECTED: 'destructive',
} as const;

/** Table of professional applications awaiting a verification decision. */
export function VerificationList({
  entries,
  emptyTitle,
  emptyDescription,
  className,
}: {
  entries: ProfessionalProfileEntry[];
  emptyTitle: string;
  emptyDescription: string;
  className?: string;
}) {
  if (entries.length === 0) {
    return (
      <EmptyState
        icon={FileCheck2}
        title={emptyTitle}
        description={emptyDescription}
        className={className}
      />
    );
  }

  return (
    <ul className={cn('space-y-3', className)}>
      {entries.map((entry) => (
        <li key={entry.profileId}>
          <Card className="p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-display text-[15px] font-bold text-navy-900">
                    {entry.displayName}
                  </h3>
                  <Badge
                    variant={
                      STATUS_VARIANT[
                        entry.verificationStatus as keyof typeof STATUS_VARIANT
                      ] ?? 'warning'
                    }
                  >
                    {humanizeStatus(entry.verificationStatus)}
                  </Badge>
                </div>

                <p className="mt-1 text-[13px] text-muted-foreground">
                  {humanizeStatus(entry.descriptor)} ·{' '}
                  <span className="font-medium text-navy-700">
                    {entry.registrationNumber}
                  </span>
                </p>

                <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Phone className="size-3.5" aria-hidden="true" />
                    <dd>{entry.mobile}</dd>
                  </div>
                  {entry.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="size-3.5" aria-hidden="true" />
                      <dd>{entry.location}</dd>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <FileCheck2 className="size-3.5" aria-hidden="true" />
                    <dd>
                      {entry.documentCount} document
                      {entry.documentCount === 1 ? '' : 's'}
                    </dd>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <UserRound className="size-3.5" aria-hidden="true" />
                    <dd>Applied {formatDate(entry.createdAt)}</dd>
                  </div>
                </dl>
              </div>

              <ReviewButtons entry={entry} />
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}