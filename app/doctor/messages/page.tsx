import type { Metadata } from 'next';
import Link from 'next/link';
import { MessageSquare, ShieldCheck } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { EmptyState, Panel } from '@/components/dashboard/EmptyState';
import { ThreadPanel } from '@/components/patient/care/ThreadPanel';
import { requireRoleLayout } from '@/lib/auth/role-guard';
import { getThread, listConversations } from '@/lib/services/messagingService';
import { formatDateTime } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

export const metadata: Metadata = {
  title: 'Messages',
  description: 'Conversations with your patients.',
};

function first(value: string | string[] | undefined): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

/**
 * Doctor messages — conversation list plus the open thread (`?thread=<id>`).
 *
 * Same two-pane layout and ThreadPanel the patient inbox uses; the messaging
 * service is role-agnostic and enforces thread membership on every read and
 * write, so this simply renders the signed-in doctor's own threads. A VERIFIED
 * profile is required for clinical messaging — the API repeats the same gate —
 * so an unverified doctor sees a clear notice instead of patient threads.
 */
export default async function DoctorMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await requireRoleLayout(['DOCTOR']);
  const raw = await searchParams;
  const threadId = first(raw.thread);

  if (user.verificationStatus !== 'VERIFIED') {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight text-navy-900">
            Messages
          </h1>
          <p className="text-sm text-muted-foreground">
            Private conversations with your patients.
          </p>
        </div>
        <EmptyState
          icon={ShieldCheck}
          title="Verification required"
          description="Patient messages unlock once an admin approves your profile."
          note="Patients who message you before approval will appear here automatically afterwards."
        />
      </div>
    );
  }

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
          Patients reach you here before or after a visit — replies are private
          between you and each patient.
        </p>
      </div>

      {conversations.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No conversations yet"
          description="When a patient messages you from your doctor card, the thread appears here."
          note="Each conversation is private between you and that patient — nobody else can read it."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
          <Panel title="Conversations" bodyClassName="p-2">
            <ul className="space-y-1">
              {conversations.map((item) => (
                <li key={item.conversation.id}>
                  <Link
                    href={`/doctor/messages?thread=${item.conversation.id}`}
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
