import type { Metadata } from 'next';
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { EmptyState, Panel } from '@/components/dashboard/EmptyState';
import { ThreadPanel } from '@/components/patient/care/ThreadPanel';
import { requireRoleLayout } from '@/lib/auth/role-guard';
import { getThread, listConversations } from '@/lib/services/messagingService';
import { formatDateTime } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

export const metadata: Metadata = {
  title: 'Messages',
  description: 'Conversations with your doctors.',
};

function first(value: string | string[] | undefined): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

/**
 * Messages — conversation list plus the open thread (`?thread=<id>`).
 * Threads are polled by the client panel for replies; the server render here
 * resolves ownership before any message ever reaches the browser.
 */
export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await requireRoleLayout(['PATIENT']);
  const raw = await searchParams;
  const threadId = first(raw.thread);

  const conversations = await listConversations(user.id);

  let thread = null;
  if (threadId) {
    try {
      thread = await getThread(user.id, threadId);
    } catch {
      // Unknown or foreign conversation id → show the empty state instead.
      thread = null;
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold tracking-tight text-navy-900">
          Messages
        </h1>
        <p className="text-sm text-muted-foreground">
          Talk to your doctors before or after a visit — start one from any
          doctor&apos;s card under Find doctors.
        </p>
      </div>

      {conversations.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No conversations yet"
          description="Message a doctor from their card in Find doctors and the thread will live here."
          note="Each conversation is private between you and that doctor — nobody else can read it."
          action={
            <Link
              className="inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-[var(--primary-hover)]"
              href="/patient/doctors"
            >
              Find a doctor
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
          <Panel title="Conversations" bodyClassName="p-2">
            <ul className="space-y-1">
              {conversations.map((item) => (
                <li key={item.conversation.id}>
                  <Link
                    href={`/patient/messages?thread=${item.conversation.id}`}
                    className={cn(
                      'block rounded-xl px-3 py-2.5 transition-colors',
                      threadId === item.conversation.id
                        ? 'bg-teal-50 text-navy-900'
                        : 'hover:bg-muted',
                    )}
                  >
                    <p className="truncate text-sm font-semibold">
                      {item.otherPartyName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.lastMessage?.body ?? 'No messages yet'}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {formatDateTime(item.conversation.lastMessageAt)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>

          <Card className="overflow-hidden">
            {thread ? (
              <ThreadPanel
                conversationId={thread.conversation.id}
                currentUserId={user.id}
                otherPartyName={thread.otherPartyName}
                initialMessages={thread.messages}
              />
            ) : (
              <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-2 p-6 text-center">
                <MessageSquare className="size-6 text-muted-foreground" aria-hidden="true" />
                <p className="font-display text-sm font-bold text-navy-900">
                  Pick a conversation
                </p>
                <p className="max-w-xs text-[13px] text-muted-foreground">
                  Select a thread on the left to read and reply.
                </p>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}