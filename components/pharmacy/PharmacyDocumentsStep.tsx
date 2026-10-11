'use client';

import { RegistrationStepShell } from '@/components/auth/RegistrationStepShell';
import { DocumentUploadList } from '@/components/auth/DocumentUploadList';
import { ROLE_DOCUMENTS } from '@/lib/constants/documents';
import { PHARMACY_STEPS } from '@/types/pharmacy';
import type { DocumentUploadResult } from '@/types/document';

export interface PharmacyDocumentsStepProps {
  documents: Record<string, DocumentUploadResult | null>;
  onChange: (type: string, document: DocumentUploadResult | null) => void;
  onBack: () => void;
  onContinue: () => void;
}

/** Step 4 — secure upload of licence and identity documents. */
export function PharmacyDocumentsStep({
  documents,
  onChange,
  onBack,
  onContinue,
}: PharmacyDocumentsStepProps) {
  const required = ROLE_DOCUMENTS.PHARMACY.filter((document) => document.required);
  const missing = required.filter((document) => !documents[document.type]).length;

  return (
    <RegistrationStepShell
      steps={PHARMACY_STEPS}
      currentStep={3}
      title="Upload Documents"
      description="Upload clear, readable copies of the certificates for your premises."
      onBack={onBack}
      onSubmit={onContinue}
      submitLabel="Continue"
      submitDisabled={missing > 0}
      footerNote={
        missing > 0
          ? `${missing} required document${missing > 1 ? 's' : ''} still to upload`
          : 'All required documents are ready'
      }
    >
      <DocumentUploadList
        definitions={ROLE_DOCUMENTS.PHARMACY}
        documents={documents}
        onChange={onChange}
      />
    </RegistrationStepShell>
  );
}
