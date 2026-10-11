'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError, apiRequest } from '@/lib/utils/api-client';
import { prescriptionItemSchema } from '@/lib/validations/care';

interface MedicineRow {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

const EMPTY_ROW: MedicineRow = {
  medicineName: '',
  dosage: '',
  frequency: '',
  duration: '',
  instructions: '',
};

/**
 * Doctor prescription writer for one eligible appointment.
 *
 * Only the appointment id is sent to the server; the patient and doctor are
 * resolved from the appointment and session server-side, so they cannot be
 * forged here. Medicine rows are validated client-side against the same schema
 * the server re-checks, the submit button is disabled while a request is in
 * flight to prevent duplicate submissions, and the page refreshes on success.
 */
export function DoctorPrescriptionForm({
  appointmentId,
  patientName,
  scheduledLabel,
}: {
  appointmentId: string;
  patientName: string;
  scheduledLabel: string;
}) {
  const router = useRouter();
  const [diagnosis, setDiagnosis] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [rows, setRows] = React.useState<MedicineRow[]>([{ ...EMPTY_ROW }]);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const setRow = (index: number, key: keyof MedicineRow, value: string) =>
    setRows((current) =>
      current.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    );

  const addRow = () => setRows((current) => [...current, { ...EMPTY_ROW }]);

  const removeRow = (index: number) =>
    setRows((current) =>
      current.length === 1 ? current : current.filter((_, i) => i !== index),
    );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    setFormError(null);

    try {
      const items = rows.map((row) => ({
        medicineName: row.medicineName.trim(),
        dosage: row.dosage.trim() || undefined,
        frequency: row.frequency.trim() || undefined,
        duration: row.duration.trim() || undefined,
        instructions: row.instructions.trim() || undefined,
      }));

      // Client-side guard mirroring the server: every medicine needs a name.
      const rowErrors: Record<string, string> = {};
      items.forEach((item, index) => {
        const check = prescriptionItemSchema.safeParse(item);
        if (!check.success) {
          rowErrors[`items.${index}.medicineName`] = check.error.issues[0].message;
        }
      });
      if (Object.keys(rowErrors).length > 0) {
        setErrors(rowErrors);
        setFormError('Please name every medicine before saving.');
        return;
      }

      await apiRequest('/api/doctor/prescriptions', {
        method: 'POST',
        body: {
          appointmentId,
          diagnosis: diagnosis.trim() || undefined,
          notes: notes.trim() || undefined,
          items,
        },
      });

      toast.success('Prescription saved for the patient.');
      setDiagnosis('');
      setNotes('');
      setRows([{ ...EMPTY_ROW }]);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors.length > 0) {
        // The form keeps field errors as plain strings keyed by field path.
        setErrors(
          Object.fromEntries(
            err.fieldErrors.map((fe) => [fe.field, fe.message]),
          ),
        );
        setFormError('Please review the highlighted fields.');
      } else {
        setFormError(
          err instanceof ApiError
            ? err.message
            : 'We could not save that prescription.',
        );
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {formError && <Alert variant="error">{formError}</Alert>}

      <div className="rounded-lg bg-muted px-3 py-2 text-[13px] text-muted-foreground">
        For <span className="font-semibold text-navy-900">{patientName}</span> ·{' '}
        {scheduledLabel}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rx-diagnosis">
          Diagnosis <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="rx-diagnosis"
          maxLength={300}
          placeholder="e.g. Acute bronchitis"
          value={diagnosis}
          onChange={(event) => setDiagnosis(event.target.value)}
          aria-invalid={Boolean(errors.diagnosis)}
        />
        {errors.diagnosis && (
          <p className="text-xs text-red-600" role="alert">
            {errors.diagnosis}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Medicines</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addRow}
            disabled={busy}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add medicine
          </Button>
        </div>

        <ul className="space-y-3">
          {rows.map((row, index) => (
            <li
              key={index}
              className="space-y-2 rounded-xl border border-border bg-card p-3"
            >
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-1">
                  <Label htmlFor={`rx-medicine-${index}`}>Medicine name</Label>
                  <Input
                    id={`rx-medicine-${index}`}
                    maxLength={160}
                    placeholder="e.g. Azithromycin"
                    value={row.medicineName}
                    onChange={(event) =>
                      setRow(index, 'medicineName', event.target.value)
                    }
                    aria-invalid={Boolean(errors[`items.${index}.medicineName`])}
                  />
                  {errors[`items.${index}.medicineName`] && (
                    <p className="text-xs text-red-600" role="alert">
                      {errors[`items.${index}.medicineName`]}
                    </p>
                  )}
                </div>
                {rows.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRow(index)}
                    disabled={busy}
                    aria-label={`Remove medicine ${index + 1}`}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                )}
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label htmlFor={`rx-dosage-${index}`}>Dosage</Label>
                  <Input
                    id={`rx-dosage-${index}`}
                    maxLength={80}
                    placeholder="500 mg"
                    value={row.dosage}
                    onChange={(event) =>
                      setRow(index, 'dosage', event.target.value)
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`rx-frequency-${index}`}>Frequency</Label>
                  <Input
                    id={`rx-frequency-${index}`}
                    maxLength={80}
                    placeholder="Twice daily"
                    value={row.frequency}
                    onChange={(event) =>
                      setRow(index, 'frequency', event.target.value)
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`rx-duration-${index}`}>Duration</Label>
                  <Input
                    id={`rx-duration-${index}`}
                    maxLength={80}
                    placeholder="5 days"
                    value={row.duration}
                    onChange={(event) =>
                      setRow(index, 'duration', event.target.value)
                    }
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor={`rx-instructions-${index}`}>
                  Instructions{' '}
                  <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id={`rx-instructions-${index}`}
                  maxLength={300}
                  placeholder="e.g. After food"
                  value={row.instructions}
                  onChange={(event) =>
                    setRow(index, 'instructions', event.target.value)
                  }
                />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rx-notes">
          Clinical notes <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="rx-notes"
          maxLength={2000}
          placeholder="Advice, follow-up, or anything the patient should know"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          aria-invalid={Boolean(errors.notes)}
        />
        {errors.notes && (
          <p className="text-xs text-red-600" role="alert">
            {errors.notes}
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="submit" loading={busy} disabled={busy}>
          Save prescription
        </Button>
      </div>
    </form>
  );
}
