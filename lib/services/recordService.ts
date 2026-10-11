import 'server-only';

import { getStore } from '@/lib/db';
import type { MedicalRecordRecord } from '@/lib/db/types';
import { Errors } from '@/lib/utils/errors';
import type { MedicalRecordInput } from '@/lib/validations/care';

/**
 * The patient's own medical record file: list, add and remove.
 *
 * A patient may only ever touch rows whose `patientUserId` is theirs — the
 * delete path re-reads ownership before writing, so a guessed id from another
 * account returns 404 instead of deleting anything.
 */

export function listMedicalRecords(patientUserId: string): Promise<MedicalRecordRecord[]> {
  return getStore().then((store) =>
    store.listMedicalRecordsByPatient(patientUserId),
  );
}

export async function addMedicalRecord(
  patientUserId: string,
  input: MedicalRecordInput,
): Promise<MedicalRecordRecord> {
  const store = await getStore();
  return store.createMedicalRecord({
    patientUserId,
    // `requiredEnumField` validates membership but keeps the output a string;
    // narrowing it here avoids trusting an unchecked cast further down.
    recordType: input.recordType as MedicalRecordRecord['recordType'],
    title: input.title,
    description: input.description ?? null,
    recordDate: input.recordDate ? new Date(`${input.recordDate}T00:00:00Z`) : null,
  });
}

export async function deleteMedicalRecord(
  patientUserId: string,
  recordId: string,
): Promise<void> {
  const store = await getStore();
  const record = await store.getMedicalRecordById(recordId);
  if (!record || record.patientUserId !== patientUserId) {
    throw Errors.notFound('That record could not be found.');
  }
  const removed = await store.deleteMedicalRecord(recordId);
  if (!removed) throw Errors.notFound('That record could not be found.');
}