'use client';

import { RegistrationStepShell } from '@/components/auth/RegistrationStepShell';
import { DocumentUploadList } from '@/components/auth/DocumentUploadList';
import { ROLE_DOCUMENTS } from '@/lib/constants/documents';
import { DOCTOR_STEPS } from '@/types/doctor';
import type { DocumentUploadResult } from '@/types/document';

export interface DoctorDocumentsStepProps {
  documents: Record<string, DocumentUploadResult | null>;
  onChange: (type: string, document: DocumentUploadResult | null) => void;
  onBack: () => void;
  onContinue: () => void;
}

/** Step 4 — secure upload of the verification documents. */
export function DoctorDocumentsStep({
  documents,
  onChange,
  onBack,
  onContinue,
}: DoctorDocumentsStepProps) {
  const required = ROLE_DOCUMENTS.DOCTOR.filter((document) => document.required);
  const missing = required.filter(
    (document) => !documents[document.type],
  ).length;

  return (
    <RegistrationStepShell
      steps={DOCTOR_STEPS}
      currentStep={3}
      title="Upload Documents"
      description="Upload clear, readable copies. We use them only to verify your professional profile."
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
        definitions={ROLE_DOCUMENTS.DOCTOR}
        documents={documents}
        onChange={onChange}
      />
    </RegistrationStepShell>
  );
}
