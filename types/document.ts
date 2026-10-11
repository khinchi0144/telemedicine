/**
 * Document types and upload contracts.
 * Documents are stored in PRIVATE storage and are only ever served through an
 * authenticated endpoint — there is no public URL for a medical document.
 */

export const DOCUMENT_TYPES = [
  'MEDICAL_REGISTRATION_CERTIFICATE',
  'QUALIFICATION_CERTIFICATE',
  'IDENTITY_PROOF',
  'PROFILE_PHOTO',
  'DRUG_LICENSE',
  'GST_CERTIFICATE',
  'PHARMACY_REGISTRATION_CERTIFICATE',
  'PHARMACY_SHOP_PHOTO',
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export interface DocumentDefinition {
  type: DocumentType;
  label: string;
  description: string;
  /** Documents that must be provided to complete the registration. */
  required: boolean;
  /** Image formats are also accepted for this document. */
  accept: string;
}

export interface UploadedDocument {
  id: string;
  documentType: DocumentType;
  fileName: string;
  mimeType: string;
  fileSize: number;
  verificationStatus: DocumentStatus;
}

/** Alias used by the client after a successful upload. */
export type DocumentUploadResult = UploadedDocument;
