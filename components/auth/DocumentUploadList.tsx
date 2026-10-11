'use client';

import { FileText, ShieldCheck } from 'lucide-react';

import { Alert } from '@/components/ui/alert';
import { FileUpload } from './FileUpload';
import type { DocumentDefinition, DocumentUploadResult } from '@/types/document';

export interface DocumentUploadListProps {
  definitions: DocumentDefinition[];
  documents: Record<string, DocumentUploadResult | null>;
  onChange: (documentType: string, document: DocumentUploadResult | null) => void;
  error?: string;
  className?: string;
}

/** Renders the complete document set of a registration step. */
export function DocumentUploadList({
  definitions,
  documents,
  onChange,
  error,
  className,
}: DocumentUploadListProps) {
  return (
    <div className={className}>
      <Alert variant="info" title="Your documents stay private" className="mb-4">
        Files are stored in private, encrypted storage. Only the MediCare
        verification team can review them — they are never made public.
      </Alert>

      <div className="space-y-3">
        {definitions.map((definition) => (
          <FileUpload
            key={definition.type}
            definition={definition}
            value={documents[definition.type] ?? null}
            onChange={(document) => onChange(definition.type, document)}
          />
        ))}
      </div>

      {error && (
        <Alert variant="error" className="mt-4">
          {error}
        </Alert>
      )}

      <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
        <FileText className="size-3.5" aria-hidden="true" />
        Accepted formats: PDF, JPG, PNG. Maximum size 5 MB per file.
      </p>
    </div>
  );
}

export { ShieldCheck };
