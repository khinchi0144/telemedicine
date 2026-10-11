'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ApiError, apiRequest } from '@/lib/utils/api-client';

/**
 * Cancels the patient's own `PLACED` order (two-step, like the appointment
 * cancel button). The API refuses once the pharmacy has started preparing it.
 */
export function CancelOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const cancel = async () => {
    setBusy(true);
    try {
      await apiRequest(`/api/patient/orders/${orderId}`, {
        method: 'PATCH',
        body: { status: 'CANCELLED' },
      });
      toast.success('Order cancelled.');
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'We could not cancel that order.',
      );
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  };

  if (!confirming) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
        Cancel order
      </Button>
    );
  }

  return (
    <span className="inline-flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Cancel this order?</span>
      <Button variant="destructive" size="sm" onClick={cancel} loading={busy}>
        Yes, cancel
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
        Keep it
      </Button>
    </span>
  );
}