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