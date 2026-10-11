'use client';

import * as React from 'react';
import {
  CheckCircle2,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UploadCloud,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ApiError, uploadWithProgress } from '@/lib/utils/api-client';
import { cn } from '@/lib/utils/cn';
import { formatFileSize } from '@/lib/utils/format';
import type { DocumentDefinition, DocumentUploadResult } from '@/types/document';

export interface FileUploadProps {
  definition: DocumentDefinition;
  value?: DocumentUploadResult | null;
  onChange: (document: DocumentUploadResult | null) => void;
  disabled?: boolean;
  className?: string;
}

const ACCEPTED_MIME = ['application/pdf', 'image/jpeg', 'image/png'];

/**
 * Secure document upload card.
 * The file goes to /api/upload/document, which validates the size, the real
 * file signature and the role before writing to PRIVATE storage.
 */
export function FileUpload({
  definition,
  value,
  onChange,
  disabled,
  className,
}: FileUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [progress, setProgress] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const isUploading = progress !== null;

  const validate = (file: File): string | null => {
    if (file.size === 0) return 'This file is empty. Please choose another file.';
    if (file.size > 5 * 1024 * 1024) {
      return 'This file is larger than 5 MB. Please upload a smaller file.';
    }
    if (!ACCEPTED_MIME.includes(file.type)) {
      return definition.accept.includes('.pdf')
        ? 'Only PDF, JPG and PNG files are accepted.'
        : 'Only JPG and PNG images are accepted for this document.';
    }
    return null;
  };

  const upload = async (file: File) => {
    const validationError = validate(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', definition.type);

    try {
      const result = await uploadWithProgress<DocumentUploadResult>(
        '/api/upload/document',
        formData,
        (percent) => setProgress(percent),
      );
      onChange(result);
    } catch (uploadError) {
      setError(
        uploadError instanceof ApiError
          ? uploadError.message
          : 'The file could not be uploaded. Please try again.',
      );
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-4 transition-colors',
        value && 'border-success/35 bg-success/5',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
            {definition.label}
            {definition.required ? (
              <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive">
                Required
              </span>
            ) : (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                Optional
              </span>
            )}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {definition.description}
          </p>
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
          <ShieldCheck className="size-4" aria-hidden="true" />
        </span>
      </div>


      <input
        ref={inputRef}
        id={`upload-${definition.type}`}
        type="file"
        accept={definition.accept}
        className="sr-only"
        disabled={disabled || isUploading}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
      />

      {value ? (
        <div className="mt-3.5 flex items-center gap-3 rounded-lg border border-success/25 bg-card p-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-success/12 text-success">
            <CheckCircle2 className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{value.fileName}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(value.fileSize)} · Awaiting review
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-9"
              disabled={disabled || isUploading}
              aria-label={`Replace ${definition.label}`}
              onClick={() => inputRef.current?.click()}
            >
              <RefreshCw className="size-4" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-9 text-destructive hover:bg-destructive/10"
              disabled={disabled || isUploading}
              aria-label={`Remove ${definition.label}`}
              onClick={() => onChange(null)}
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled || isUploading}
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const file = event.dataTransfer.files?.[0];
            if (file) void upload(file);
          }}
          className={cn(
            'mt-3.5 flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-input bg-surface-muted px-4 py-6 text-center transition-colors',
            'hover:border-primary/50 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-60',
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className="size-5 animate-spin text-primary" aria-hidden="true" />
              <span className="text-sm font-medium">Uploading… {progress}%</span>
              <span className="h-1.5 w-full max-w-48 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full bg-primary transition-[width]"
                  style={{ width: `${progress}%` }}
                />
              </span>
            </>
          ) : (
            <>
              <UploadCloud className="size-5 text-primary" aria-hidden="true" />
              <span className="text-sm font-medium">Choose a file or drag it here</span>
              <span className="text-xs text-muted-foreground">
                PDF, JPG or PNG · up to 5 MB
              </span>
            </>
          )}
        </button>
      )}

      {error && (
        <p role="alert" className="mt-2.5 text-[13px] font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
