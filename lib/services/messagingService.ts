import 'server-only';

import { getStore } from '@/lib/db';
import type {
  ConversationRecord,
  DoctorProfileRecord,
  MessageRecord,
} from '@/lib/db/types';
import { Errors } from '@/lib/utils/errors';

/**
 * Patient ↔ doctor messaging.
 *
 * A conversation is always scoped to one patient / doctor pair. Every read and
 * write verifies the caller actually belongs to the thread, so a hand-crafted
 * conversation id can never expose someone else's messages.
 */

export interface ConversationListItem {
  conversation: ConversationRecord;
  /** The person on the other end of the thread, for the list label. */
  otherPartyName: string;
  lastMessage: MessageRecord | null;
}

export interface ThreadView {
  conversation: ConversationRecord;
  otherPartyName: string;
  messages: MessageRecord[];
}

/** Resolves the display name of the conversation's other participant. */
async function resolveOtherPartyName(
  conversation: ConversationRecord,
  viewerId: string,
): Promise<string> {
  const store = await getStore();
  if (conversation.patientUserId === viewerId) {
    // The viewer is the patient → the other side is the doctor.
    const profile = await store.getDoctorProfileByUserId(conversation.doctorUserId);
    return profile?.fullName ?? 'Doctor';
  }
  const profile = await store.getPatientProfileByUserId(conversation.patientUserId);
  return profile?.fullName ?? 'Patient';
}

/** Threads the signed-in user belongs to, most recently active first. */
export async function listConversations(
  userId: string,
): Promise<ConversationListItem[]> {
  const store = await getStore();
  const conversations = await store.listConversationsByUser(userId);
  const items: ConversationListItem[] = [];
  for (const conversation of conversations) {
    const messages = await store.listMessages(conversation.id);
    items.push({
      conversation,
      otherPartyName: await resolveOtherPartyName(conversation, userId),
      lastMessage: messages[messages.length - 1] ?? null,
    });
  }
  return items;
}

/**
 * Opens (or reuses) the conversation between the patient and a doctor.
 * Only a doctor the patient could actually book is accepted.
 */
export async function startConversation(
  patientUserId: string,
  doctorUserId: string,
): Promise<ConversationRecord> {
  const store = await getStore();
  const doctor: DoctorProfileRecord | null =
    await store.getDoctorProfileByUserId(doctorUserId);
  if (!doctor) throw Errors.notFound('That doctor could not be found.');
  if (doctor.verificationStatus !== 'VERIFIED') {
    throw Errors.forbidden('You can only message verified doctors.');
  }
  return store.getOrCreateConversation({ patientUserId, doctorUserId });
}

/** The full message history of one of the caller's own threads. */
export async function getThread(
  userId: string,
  conversationId: string,
): Promise<ThreadView> {
  const store = await getStore();
  const conversation = await store.getConversationById(conversationId);
  if (
    !conversation ||
    (conversation.patientUserId !== userId && conversation.doctorUserId !== userId)
  ) {
    throw Errors.notFound('That conversation could not be found.');
  }
  return {
    conversation,
    otherPartyName: await resolveOtherPartyName(conversation, userId),
    messages: await store.listMessages(conversationId),
  };
}

/** Appends a message to one of the caller's own threads. */
export async function sendMessage(
  userId: string,
  conversationId: string,
  body: string,
): Promise<MessageRecord> {
  const store = await getStore();
  const conversation = await store.getConversationById(conversationId);
  if (
    !conversation ||
    (conversation.patientUserId !== userId && conversation.doctorUserId !== userId)
  ) {
    throw Errors.notFound('That conversation could not be found.');
  }
  return store.createMessage({ conversationId, senderUserId: userId, body });
}