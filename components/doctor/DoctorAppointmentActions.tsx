'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ApiError, apiRequest } from '@/lib/utils/api-client';

/**
 * Doctor status actions for one eligible appointment row.
 *
 * Rendered only for CONFIRMED upcoming visits: Complete and Mark no-show act
 * immediately, while Cancel asks for confirmation first. Every action PATCHes
 * the doctor-only endpoint and refreshes the page on success.
 */
export function DoctorAppointmentActions({
  appointmentId,
}: {
  appointmentId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [confirmingCancel, setConfirmingCancel] = React.useState(false);

  const update = async (status: 'COMPLETED' | 'NO_SHOW' | 'CANCELLED') => {
    setBusy(status);
    try {
      await apiRequest(`/api/doctor/appointments/${appointmentId}`, {
        method: 'PATCH',
        body: { status },
      });
      toast.success(
        status === 'COMPLETED'
          ? 'Appointment marked as completed.'
          : status === 'NO_SHOW'
            ? 'Appointment marked as no-show.'
            : 'Appointment cancelled.',
      );
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'We could not update that appointment.',
      );
    } finally {
      setBusy(null);
      setConfirmingCancel(false);
    }
  };

  if (confirmingCancel) {
    return (
      <span className="inline-flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Cancel this visit?</span>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => update('CANCELLED')}
          loading={busy === 'CANCELLED'}
        >
          Yes, cancel
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setConfirmingCancel(false)}
        >
          Keep it
        </Button>
      </span>
    );
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <Button
        variant="primary"
        size="sm"
        onClick={() => update('COMPLETED')}
        loading={busy === 'COMPLETED'}
      >
        Complete
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => update('NO_SHOW')}
        loading={busy === 'NO_SHOW'}
      >
        No-show
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setConfirmingCancel(true)}
      >
        Cancel
      </Button>
    </span>
  );
}
