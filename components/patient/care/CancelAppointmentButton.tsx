'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ApiError, apiRequest } from '@/lib/utils/api-client';

/**
 * Two-step cancel: first click asks for confirmation, second click sends
 * `PATCH /api/patient/appointments/[id]` with `status: "CANCELLED"` — the
 * only payload the API accepts for patients.
 */
export function CancelAppointmentButton({ appointmentId }: { appointmentId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const cancel = async () => {
    setBusy(true);
    try {
      await apiRequest(`/api/patient/appointments/${appointmentId}`, {
        method: 'PATCH',
        body: { status: 'CANCELLED' },
      });
      toast.success('Appointment cancelled.');
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'We could not cancel that appointment.',
      );
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  };

  if (!confirming) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
        Cancel
      </Button>
    );
  }

  return (
    <span className="inline-flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Cancel this visit?</span>
      <Button variant="destructive" size="sm" onClick={cancel} loading={busy}>
        Yes, cancel
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
        Keep it
      </Button>
    </span>
  );
}