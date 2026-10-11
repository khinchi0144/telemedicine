'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { SendHorizonal } from 'lucide-react';
import { toast } from 'sonner';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { ApiError, apiRequest } from '@/lib/utils/api-client';
import { formatDateTime } from '@/lib/utils/format';

export interface ThreadMessage {
  id: string;
  senderUserId: string;
  body: string;
  createdAt: Date;
}

const POLL_MS = 3000;

/**
 * One open conversation: renders the history, polls for replies, and sends
 * new messages. Ownership was already checked when the server rendered the
 * initial thread — the API repeats it on every poll and send.
 */
export function ThreadPanel({
  conversationId,
  currentUserId,
  otherPartyName,
  initialMessages,
}: {
  conversationId: string;
  currentUserId: string;
  otherPartyName: string;
  initialMessages: ThreadMessage[];
}) {
  const router = useRouter();
  const [messages, setMessages] = React.useState<ThreadMessage[]>(initialMessages);
  const [draft, setDraft] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [pollError, setPollError] = React.useState<string | null>(null);
  const bottomRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    setMessages(initialMessages);
  }, [conversationId, initialMessages]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  React.useEffect(() => {
    let active = true;
    let lastError: string | null = null;

    const tick = async () => {
      if (!active || document.hidden) return;
      try {
        const data = await apiRequest<{ messages: ThreadMessage[] }>(
          `/api/patient/conversations/${conversationId}/messages`,
        );
        if (!active) return;
        setMessages(data.messages);
        setPollError(null);
        lastError = null;
      } catch (error) {
        if (!active) return;
        const message =
          error instanceof ApiError ? error.message : 'Connection lost.';
        if (message !== lastError) {
          lastError = message;
          setPollError(message);
        }
      }
    };

    const timer = setInterval(() => void tick(), POLL_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [conversationId]);

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    try {
      const data = await apiRequest<{ message: ThreadMessage }>(
        `/api/patient/conversations/${conversationId}/messages`,
        { method: 'POST', body: { body } },
      );
      setMessages((current) =>
        current.some((item) => item.id === data.message.id)
          ? current
          : [...current, data.message],
      );
      setDraft('');
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'Your message was not sent.',
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[min(60vh,560px)] flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
        <div className="min-w-0">
          <p className="font-display text-[15px] font-bold text-navy-900">
            {otherPartyName}
          </p>
          <p className="text-xs text-muted-foreground">
            Only the two members of this conversation can read it.
          </p>
        </div>
        {pollError && <span className="text-xs text-destructive">{pollError}</span>}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No messages yet — say hello, or mention what you&apos;d like to
            discuss before booking.
          </p>
        )}
        {messages.map((message) => {
          const mine = message.senderUserId === currentUserId;
          return (
            <div
              key={message.id}
              className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                  mine
                    ? 'bg-navy-900 text-white'
                    : 'border border-border bg-card text-foreground'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{message.body}</p>
                <p
                  className={`mt-1 text-[10px] ${mine ? 'text-white/60' : 'text-muted-foreground'}`}
                >
                  {formatDateTime(message.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {pollError && (
        <div className="px-5 pb-2">
          <Alert variant="warning">{pollError}</Alert>
        </div>
      )}

      <form
        onSubmit={send}
        className="flex items-end gap-2 border-t border-border px-5 py-3.5"
      >
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={2000}
          rows={1}
          placeholder={`Message ${otherPartyName}…`}
          className="min-h-10 resize-none"
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <Button
          type="submit"
          size="icon"
          loading={sending}
          disabled={!draft.trim()}
          aria-label="Send message"
        >
          <SendHorizonal aria-hidden="true" />
        </Button>
      </form>
    </div>
  );
}