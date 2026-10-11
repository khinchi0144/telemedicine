'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/utils/api-client';
import { cn } from '@/lib/utils/cn';
import type { ProfessionalProfileEntry } from '@/lib/db/types';

interface ReviewButtonsProps {
  entry: ProfessionalProfileEntry;
  className?: string;
}

/**
 * Approve / reject controls for one professional profile.
 *
 * The optimistic update is deliberately avoided: the button only reflects the
 * confirmed server response, so the admin can never see a decision that the
 * database rejected.
 */
export function ReviewButtons({ entry, className }: ReviewButtonsProps) {
  const router = useRouter();
  const [pending, setPending] = React.useState<string | null>(null);

  const decide = async (decision: 'VERIFIED' | 'REJECTED') => {
    setPending(decision);
    try {
      await apiRequest(
        `/api/admin/verification/${entry.role}/${encodeURIComponent(entry.profileId)}`,
        { method: 'PATCH', body: { decision } },
      );
      toast.success(
        decision === 'VERIFIED'
          ? `${entry.displayName} is now verified.`
          : `${entry.displayName} was rejected.`,
      );
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'We could not save that decision.',
      );
    } finally {
      setPending(null);
    }
  };

  const busy = pending !== null;

  return (
    <div className={cn('flex shrink-0 items-center gap-2', className)}>
      <Button
        size="sm"
        variant="outline"
        disabled={busy || entry.verificationStatus === 'REJECTED'}
        onClick={() => decide('REJECTED')}
      >
        {pending === 'REJECTED' ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <X className="size-4" aria-hidden="true" />
        )}
        Reject
      </Button>
      <Button
        size="sm"
        disabled={busy || entry.verificationStatus === 'VERIFIED'}
        onClick={() => decide('VERIFIED')}
      >
        {pending === 'VERIFIED' ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Check className="size-4" aria-hidden="true" />
        )}
        Verify
      </Button>
    </div>
  );
}
