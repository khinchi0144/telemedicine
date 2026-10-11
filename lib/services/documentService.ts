import 'server-only';

import { getStore } from '@/lib/db';
import { getStorage } from '@/lib/storage';
import { createId } from '@/lib/utils/crypto';
import { env } from '@/lib/utils/env';
import { Errors } from '@/lib/utils/errors';
import {
  extensionForMime,
  sanitizeFileName,
  sniffMimeType,
} from '@/lib/utils/file-signature';
import { logger } from '@/lib/utils/logger';
import { canRoleUploadDocument, getDocumentDefinition } from '@/lib/constants/documents';
import type {
  DocumentRecord,
  DocumentType,
} from '@/lib/db/types';
import type { DocumentUploadResult } from '@/types/document';
import type { RegisterableRole } from '@/types/auth';

/**
 * Document service.
 *
 * Uploads are validated (role permission, size, real file signature), stored in
 * PRIVATE storage under an opaque key and never exposed through a public URL.
 * Before the account exists, documents are attached to a registration ticket
 * and moved to the user when the registration completes.
 */

const EXTENSION_ONLY_TYPES: DocumentType[] = ['PROFILE_PHOTO', 'PHARMACY_SHOP_PHOTO'];

export interface UploadDocumentInput {
  file: File;
  documentType: DocumentType;
  role: RegisterableRole;
  registrationId: string;
  userId?: string;
}

export async function uploadDocument({
  file,
  documentType,
  role,
  registrationId,
  userId,
}: UploadDocumentInput): Promise<DocumentUploadResult> {
  if (!canRoleUploadDocument(role, documentType)) {
    throw Errors.invalidDocumentType(
      'This document cannot be uploaded for the selected account type.',
    );
  }

  const definition = getDocumentDefinition(role, documentType);
  const maxBytes = env.maxUploadSizeBytes;

  if (file.size <= 0) {
    throw Errors.validation('The selected file is empty.', [
      { field: 'file', message: 'Please choose a file to upload.' },
    ]);
  }
  if (file.size > maxBytes) throw Errors.fileTooLarge(env.MAX_UPLOAD_SIZE_MB);

  const bytes = Buffer.from(await file.arrayBuffer());
  const sniffed = sniffMimeType(bytes);

  const allowedForType = EXTENSION_ONLY_TYPES.includes(documentType)
    ? ['image/jpeg', 'image/png']
    : env.allowedDocumentMimeTypes;

  if (!allowedForType.includes(sniffed)) {
    throw Errors.invalidDocumentType(
      definition
        ? `${definition.label} must be a PDF, JPG or PNG file.`
        : 'Only PDF, JPG and PNG files are accepted.',
    );
  }

  const extension = extensionForMime(sniffed);
  const safeName = sanitizeFileName(file.name);
  const scope = userId ? `users/${userId}` : `pending/${registrationId}`;
  const storageKey = `${scope}/${documentType.toLowerCase()}/${createId('f')}.${extension}`;

  const store = await getStore();

  // Replacing a document removes the previous file so the account never ends
  // up with several copies of the same certificate.
  await discardPreviousDocument({
    userId,
    registrationId,
    documentType,
  });

  await getStorage().put(storageKey, bytes, sniffed);

  try {
    const record = await store.createDocument({
      userId: userId ?? null,
      registrationId: userId ? null : registrationId,
      documentType,
      fileName: safeName,
      storageKey,
      mimeType: sniffed,
      fileSize: bytes.length,
    });
    logger.info('Document stored', { documentType, registration: !userId });
    return toUploadResult(record);
  } catch (error) {
    // Never leave an orphaned file behind when the record cannot be created.
    await getStorage().delete(storageKey);
    throw error;
  }
}

/** Removes an existing document of the same type (file + record). */
async function discardPreviousDocument(input: {
  userId?: string;
  registrationId: string;
  documentType: DocumentType;
}) {
  const store = await getStore();
  const previous = input.userId
    ? await store.listDocumentsByUserId(input.userId)
    : await store.listDocumentsByRegistrationId(input.registrationId);

  for (const record of previous) {
    if (record.documentType !== input.documentType) continue;
    await getStorage().delete(record.storageKey);
    await store.deleteDocument(record.id);
  }
}

export function toUploadResult(record: DocumentRecord): DocumentUploadResult {
  return {
    id: record.id,
    documentType: record.documentType,
    fileName: record.fileName,
    mimeType: record.mimeType,
    fileSize: record.fileSize,
    verificationStatus: record.verificationStatus,
  };
}

/**
 * Verifies that the document ids submitted with a registration belong to the
 * caller's registration ticket. Any foreign id is rejected.
 */
export async function assertDocumentsBelongToTicket(
  documentIds: string[],
  registrationId: string,
  required: DocumentType[],
): Promise<void> {
  if (documentIds.length === 0) {
    throw Errors.validation('Please upload the required documents.', [
      { field: 'documents', message: 'Please upload the required documents.' },
    ]);
  }

  const store = await getStore();
  const documents = await Promise.all(
    documentIds.map((id) => store.getDocumentById(id)),
  );

  const missing = required.filter(
    (type) =>
      !documents.some(
        (doc) =>
          doc && doc.registrationId === registrationId && doc.documentType === type,
      ),
  );

  if (missing.length > 0) {
    throw Errors.validation(
      'Please upload all the required documents before submitting.',
      [
        {
          field: 'documents',
          message: `Still required: ${missing
            .map((type) => getLabel(type))
            .join(', ')}.`,
        },
      ],
    );
  }
}

function getLabel(type: DocumentType): string {
  return (
    type
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ') ?? type
  );
}

/** Removes a document and its private file (used by "Remove" in the UI). */
export async function removeDocument(id: string, ownerId: string): Promise<void> {
  const store = await getStore();
  const record = await store.getDocumentById(id);
  if (!record) return;
  if (record.userId !== ownerId) throw Errors.forbidden();
  await getStorage().delete(record.storageKey);
  await store.deleteDocument(id);
}
