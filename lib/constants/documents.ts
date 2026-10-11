import type { DocumentDefinition, DocumentType } from '@/types/document';
import type { RegisterableRole } from '@/types/auth';
import { DOCUMENT_FILE_ACCEPT, IMAGE_FILE_ACCEPT } from './options';

/**
 * Document requirements per role.
 * The API re-validates these server side — the client only mirrors them for
 * the upload UI.
 */
export const ROLE_DOCUMENTS: Record<
  RegisterableRole,
  DocumentDefinition[]
> = {
  PATIENT: [],
  DOCTOR: [
    {
      type: 'MEDICAL_REGISTRATION_CERTIFICATE',
      label: 'Medical Registration Certificate',
      description:
        'Issued by your state medical council. Used only for verification.',
      required: true,
      accept: DOCUMENT_FILE_ACCEPT,
    },
    {
      type: 'QUALIFICATION_CERTIFICATE',
      label: 'Qualification Certificate',
      description: 'Your highest medical degree certificate.',
      required: true,
      accept: DOCUMENT_FILE_ACCEPT,
    },
    {
      type: 'IDENTITY_PROOF',
      label: 'Identity Proof',
      description: 'Government issued photo identity document.',
      required: true,
      accept: DOCUMENT_FILE_ACCEPT,
    },
    {
      type: 'PROFILE_PHOTO',
      label: 'Profile Photo',
      description: 'A clear, recent photo shown on your professional profile.',
      required: false,
      accept: IMAGE_FILE_ACCEPT,
    },
  ],
  PHARMACY: [
    {
      type: 'DRUG_LICENSE',
      label: 'Drug License',
      description: 'Valid drug license issued by the drug controller.',
      required: true,
      accept: DOCUMENT_FILE_ACCEPT,
    },
    {
      type: 'GST_CERTIFICATE',
      label: 'GST Certificate',
      description: 'GST registration certificate for the pharmacy.',
      required: true,
      accept: DOCUMENT_FILE_ACCEPT,
    },
    {
      type: 'PHARMACY_REGISTRATION_CERTIFICATE',
      label: 'Pharmacy Registration Certificate',
      description: 'Certificate of registration for your premises.',
      required: true,
      accept: DOCUMENT_FILE_ACCEPT,
    },
    {
      type: 'IDENTITY_PROOF',
      label: 'Identity Proof',
      description: 'Identity document of the owner or authorized person.',
      required: true,
      accept: DOCUMENT_FILE_ACCEPT,
    },
    {
      type: 'PHARMACY_SHOP_PHOTO',
      label: 'Pharmacy / Shop Photo',
      description: 'Clear photo of the storefront or shop interior.',
      required: false,
      accept: IMAGE_FILE_ACCEPT,
    },
  ],
};

export function getDocumentDefinition(
  role: RegisterableRole,
  type: DocumentType,
): DocumentDefinition | undefined {
  return ROLE_DOCUMENTS[role].find((doc) => doc.type === type);
}

/** Server side permission check: can this role upload this document type? */
export function canRoleUploadDocument(
  role: RegisterableRole,
  type: DocumentType,
): boolean {
  return Boolean(getDocumentDefinition(role, type));
}
