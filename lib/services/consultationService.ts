import 'server-only';

import { getStore } from '@/lib/db';
import type { AppointmentRecord, ConsultationSignalRecord } from '@/lib/db/types';
import { Errors } from '@/lib/utils/errors';

/**
 * Video consultation rooms.
 *
 * Room access is limited to the appointment's own patient and doctor — the
 * same guard the API repeats for every signalling call. Signalling itself is
 * a simple polling exchange: each side appends SDP / ICE payloads and polls
 * for the other side's, which the room component then feeds into a
 * hand-rolled `RTCPeerConnection`.
 */

export interface RoomView {
  appointment: AppointmentRecord;
  /** The other participant's display name. */
  otherPartyName: string;
  /**
   * Who opens the WebRTC handshake: the patient joining first creates the
   * offer and the doctor answers when they arrive (the patient is the
   * initiator so a doctor joining later still finds a waiting peer).
   */
  isInitiator: boolean;
}

/** Signals written after `since`, restricted to appointments the user is in. */
export interface SignalPollResult {
  signals: ConsultationSignalRecord[];
  /** Server time, so clients can send an exact `since` next round. */
  now: string;
}

/**
 * Minutes before the scheduled start that the room opens. Both sides can
 * connect and check their camera/mic a little early; once the appointment's
 * end time passes the room no longer accepts new signalling. The codebase had
 * no prior join-window policy, so this is the chosen, easily tunable rule.
 */
const JOIN_GRACE_MINUTES = 10;

/**
 * Parses an "HH:mm" wall-clock value into minutes-since-midnight, or NaN when
 * malformed. Uses the same convention as the booking/slot code: `scheduledDate`
 * is a UTC-midnight instant and the times are minute offsets into that instant.
 */
function minutesOf(time: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) return NaN;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return NaN;
  return hours * 60 + minutes;
}

/**
 * True only inside the appointment's join window: from `JOIN_GRACE_MINUTES`
 * before the start through the scheduled end time (inclusive at both ends).
 *
 * Computed in the same UTC frame as slot generation, so the window lines up
 * with the times the patient and doctor actually booked. Malformed or missing
 * timing can never grant access — it returns false and the room stays closed.
 */
export function isWithinJoinWindow(
  appointment: AppointmentRecord,
  now: number = Date.now(),
): boolean {
  const dayStart = appointment.scheduledDate.getTime();
  const startMinutes = minutesOf(appointment.startTime);
  const endMinutes = minutesOf(appointment.endTime);
  if (
    Number.isNaN(dayStart) ||
    Number.isNaN(startMinutes) ||
    Number.isNaN(endMinutes)
  ) {
    return false;
  }
  const opensAt = dayStart + startMinutes * 60_000 - JOIN_GRACE_MINUTES * 60_000;
  const closesAt = dayStart + endMinutes * 60_000;
  return now >= opensAt && now <= closesAt;
}

async function loadRoom(
  userId: string,
  appointmentId: string,
): Promise<{ appointment: AppointmentRecord; isInitiator: boolean }> {
  const store = await getStore();
  const appointment = await store.getAppointmentById(appointmentId);
  const isPatient = appointment?.patientUserId === userId;
  const isDoctor = appointment?.doctorUserId === userId;
  if (!appointment || (!isPatient && !isDoctor)) {
    // Same 404 for "does not exist" and "not yours" so room ids cannot be
    // probed for existence.
    throw Errors.notFound('That consultation room could not be found.');
  }
  // Server-side status gate: only CONFIRMED appointments may open video
  // consultation rooms. CANCELLED, NO_SHOW, and COMPLETED are terminal states
  // with no room; REQUESTED is the pre-confirmation seed state. This enforces
  // the same eligibility rule the patient and doctor lobbies use, so a
  // non-confirmed booking cannot reach the room or its signalling even if it
  // is still within its registered time window.
  // Runs after the membership check so non-members still get an indistinguishable
  // 404 and cannot learn whether a room exists.
  if (appointment.status !== 'CONFIRMED') {
    throw Errors.forbidden(
      'This room is only open shortly before and during the scheduled appointment time.',
    );
  }
  // Timing gate (server side): a member may only open the room within the
  // appointment's time window, not merely on the same calendar day. Runs after
  // the membership check so non-members still get an indistinguishable 404 and
  // cannot learn whether a room exists.
  if (!isWithinJoinWindow(appointment)) {
    throw Errors.forbidden(
      'This room is only open shortly before and during the scheduled appointment time.',
    );
  }
  return { appointment, isInitiator: Boolean(isPatient) };
}

/** Room context for the participant opening it. */
export async function getRoom(
  userId: string,
  appointmentId: string,
): Promise<RoomView> {
  const store = await getStore();
  const { appointment, isInitiator } = await loadRoom(userId, appointmentId);

  const otherPartyUserId =
    appointment.patientUserId === userId
      ? appointment.doctorUserId
      : appointment.patientUserId;
  const doctorProfile = await store.getDoctorProfileByUserId(otherPartyUserId);
  const patientProfile = doctorProfile
    ? null
    : await store.getPatientProfileByUserId(otherPartyUserId);

  return {
    appointment,
    otherPartyName: doctorProfile?.fullName ?? patientProfile?.fullName ?? 'Participant',
    isInitiator,
  };
}

/** Appends one signalling payload after verifying room membership. */
export async function postSignal(
  userId: string,
  appointmentId: string,
  payload: string,
): Promise<ConsultationSignalRecord> {
  await loadRoom(userId, appointmentId);
  const store = await getStore();
  return store.createSignal({ appointmentId, senderUserId: userId, payload });
}

/**
 * Polls for signals since `since` (ISO timestamp). Rows written before the
 * caller's own join are dropped client side by id; anything older than an
 * hour is pruned so a closed room leaves no residue.
 */
export async function pollSignals(
  userId: string,
  appointmentId: string,
  since: Date,
): Promise<SignalPollResult> {
  await loadRoom(userId, appointmentId);
  const store = await getStore();
  await store.pruneSignals(appointmentId, new Date(Date.now() - 60 * 60_000));
  const signals = await store.listSignalsSince(appointmentId, since);
  return { signals, now: new Date().toISOString() };
}