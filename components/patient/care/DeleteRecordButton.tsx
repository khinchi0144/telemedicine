'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ApiError, apiRequest } from '@/lib/utils/api-client';

/** Two-step delete for one of the patient's own medical records. */
export function DeleteRecordButton({ recordId }: { recordId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const remove = async () => {
    setBusy(true);
    try {
      await apiRequest(`/api/patient/records/${recordId}`, { method: 'DELETE' });
      toast.success('Record removed.');
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'We could not delete that record.',
      );
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  };

  if (!confirming) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
        Delete
      </Button>
    );
  }

  return (
    <span className="inline-flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Delete permanently?</span>
      <Button variant="destructive" size="sm" onClick={remove} loading={busy}>
        Yes, delete
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
        Keep
      </Button>
    </span>
  );
}