import { assertCsrf } from '@/lib/auth/csrf';
import { requireApiUser } from '@/lib/auth/dal';
import { requireRegistrationTicket } from '@/lib/auth/registration-guard';
import { handleRouteError, ok } from '@/lib/utils/api-response';
import { clientKey, enforceRateLimit } from '@/lib/utils/rate-limit';
import { env } from '@/lib/utils/env';
import { Errors } from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';
import { getStore } from '@/lib/db';
import { uploadDocument } from '@/lib/services/documentService';
import { removeDocument } from '@/lib/services/documentService';
import { DOCUMENT_TYPES, type DocumentType } from '@/types/document';
import { canRoleUploadDocument } from '@/lib/constants/documents';
import type { DocumentUploadResult } from '@/types/document';
import type { RegisterableRole } from '@/types/auth';

/**
 * POST /api/upload/document
 *
 * Uploads a private document. Authorisation is checked twice:
 *  - an OTP registration ticket (documents are uploaded before the account
 *    exists) or a signed in doctor / pharmacy account
 *  - the document type must be allowed for that role
 *
 * The file is validated (size + real file signature) and written to private
 * storage. It is never placed in /public and never returned with a public URL.
 */
export async function POST(request: Request) {
  try {
    assertCsrf(request);
    enforceRateLimit(
      clientKey(request, 'upload-document'),
      env.RATE_LIMIT_UPLOAD_PER_HOUR,
      60 * 60 * 1000,
      'Too many uploads. Please try again later.',
    );

    const formData = await request.formData().catch(() => null);
    if (!formData) {
      throw Errors.validation('The upload could not be read. Please try again.');
    }

    const file = formData.get('file');
    const documentType = String(formData.get('documentType') ?? '');
    const documentTypeValue = documentType as DocumentType;

    if (!(file instanceof File)) {
      throw Errors.validation('Please choose a file to upload.', [
        { field: 'file', message: 'Please choose a file to upload.' },
      ]);
    }
    if (!DOCUMENT_TYPES.includes(documentTypeValue)) {
      throw Errors.invalidDocumentType();
    }

    // Either an in-progress registration or an already signed in account.
    const sessionUser = await requireApiUser(['DOCTOR', 'PHARMACY']).catch(
      () => null,
    );

    if (sessionUser) {
      if (!canRoleUploadDocument(sessionUser.role as RegisterableRole, documentTypeValue)) {
        throw Errors.invalidDocumentType(
          'This document cannot be uploaded for the selected account type.',
        );
      }
      const result: DocumentUploadResult = await uploadDocument({
        file,
        documentType: documentTypeValue,
        role: sessionUser.role as RegisterableRole,
        registrationId: 'account',
        userId: sessionUser.id,
      });
      return ok(result);
    }

    // During registration the documents are attached to the OTP ticket.
    const ticket = await requireRegistrationTicket('DOCTOR').catch(() =>
      requireRegistrationTicket('PHARMACY'),
    );

    if (!canRoleUploadDocument(ticket.role, documentTypeValue)) {
      throw Errors.invalidDocumentType(
        'This document cannot be uploaded for the selected account type.',
      );
    }

    const result = await uploadDocument({
      file,
      documentType: documentTypeValue,
      role: ticket.role,
      registrationId: ticket.jti,
    });

    logger.info('Registration document uploaded', {
      documentType: documentTypeValue,
    });
    return ok(result);
  } catch (error) {
    return handleRouteError(error, 'upload-document');
  }
}

/** DELETE /api/upload/document?id=... — removes a document of the caller. */
export async function DELETE(request: Request) {
  try {
    assertCsrf(request);
    const user = await requireApiUser();
    const id = new URL(request.url).searchParams.get('id');
    if (!id) throw Errors.validation('Which document should be removed?');

    const store = await getStore();
    const record = await store.getDocumentById(id);
    if (!record) throw Errors.notFound('Document not found.');
    if (record.userId !== user.id && record.registrationId) {
      throw Errors.forbidden();
    }
    if (record.userId && record.userId !== user.id) throw Errors.forbidden();

    await removeDocument(id, record.userId ?? record.registrationId ?? '');
    return ok({ removed: true });
  } catch (error) {
    return handleRouteError(error, 'remove-document');
  }
}
