'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError, apiRequest } from '@/lib/utils/api-client';
import { MEDICAL_RECORD_TYPE_OPTIONS } from '@/lib/constants/options';

const EMPTY = { title: '', recordType: '', recordDate: '', description: '' };

/**
 * Adds a row to the patient's own medical record file. The patient id is
 * taken from the session server side — this form only ever sends the record
 * fields themselves.
 */
export function AddRecordForm() {
  const router = useRouter();
  const [values, setValues] = React.useState(EMPTY);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const set = (key: keyof typeof EMPTY) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setValues((current) => ({ ...current, [key]: event.target.value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await apiRequest('/api/patient/records', {
        method: 'POST',
        body: {
          title: values.title.trim(),
          recordType: values.recordType,
          recordDate: values.recordDate,
          description: values.description.trim(),
        },
      });
      toast.success('Record added to your file.');
      setValues(EMPTY);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'We could not save that record.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="record-title">Title</Label>
          <Input
            id="record-title"
            required
            minLength={2}
            maxLength={120}
            placeholder="e.g. CBC blood test"
            value={values.title}
            onChange={set('title')}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="record-type">Record type</Label>
          <select
            id="record-type"
            required
            value={values.recordType}
            onChange={set('recordType')}
            className="h-11 rounded-lg border border-input bg-card px-3 text-[15px] text-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
          >
            <option value="">Choose a type…</option>
            {MEDICAL_RECORD_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="record-date">
            Record date{' '}
            <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="record-date"
            type="date"
            value={values.recordDate}
            onChange={set('recordDate')}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="record-description">
          Notes <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="record-description"
          maxLength={1000}
          placeholder="Anything your doctor should know about this document"
          value={values.description}
          onChange={set('description')}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" loading={busy}>
          <Plus className="size-4" aria-hidden="true" />
          Add record
        </Button>
      </div>
    </form>
  );
}