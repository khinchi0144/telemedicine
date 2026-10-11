'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ApiError, apiRequest } from '@/lib/utils/api-client';

/**
 * Opens (or reuses) the conversation with a doctor and jumps straight to the
 * thread. One conversation per pair, so clicking twice lands in the same
 * place instead of creating duplicates.
 */
export function MessageDoctorButton({ doctorUserId }: { doctorUserId: string }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  const open = async () => {
    setBusy(true);
    try {
      const data = await apiRequest<{ conversation: { id: string } }>(
        '/api/patient/conversations',
        { method: 'POST', body: { doctorUserId } },
      );
      router.push(`/patient/messages?thread=${data.conversation.id}`);
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'We could not open the conversation.',
      );
      setBusy(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={open} loading={busy}>
      <MessageSquare aria-hidden="true" />
      Message
    </Button>
  );
}