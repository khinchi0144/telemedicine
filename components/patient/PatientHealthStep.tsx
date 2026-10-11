'use client';

import { RegistrationStepShell } from '@/components/auth/RegistrationStepShell';
import { FormField } from '@/components/auth/FormField';
import { Textarea } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BLOOD_GROUP_OPTIONS } from '@/lib/constants/options';
import { PATIENT_STEPS } from '@/types/patient';
import type { PatientHealthInput } from '@/lib/validations/patient';

export interface PatientHealthStepProps {
  stepIndex: number;
  value: PatientHealthInput;
  onChange: (value: PatientHealthInput) => void;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
  serverError: string | null;
}

/**
 * Step 4 — optional health information.
 * Every field may be left empty: registration never depends on it.
 */
export function PatientHealthStep({
  stepIndex,
  value,
  onChange,
  onBack,
  onSubmit,
  submitting,
  serverError,
}: PatientHealthStepProps) {
  const update = (patch: Partial<PatientHealthInput>) =>
    onChange({ ...value, ...patch });

  return (
    <RegistrationStepShell
      steps={PATIENT_STEPS}
      currentStep={stepIndex}
      title="Health Information"
      description="This section is optional. Share only what you are comfortable with — you can add it later."
      onBack={onBack}
      onSubmit={onSubmit}
      loading={submitting}
      submitLabel="Complete Registration"
      error={serverError}
      footerNote="Your information is stored securely and is never shared without your consent."
    >
      <Alert variant="info" title="Optional — you can skip this for now">
        Leaving these fields empty will not stop you from completing your
        registration.
      </Alert>

      <FormField name="bloodGroup" label="Blood Group" optional>
        <Select
          value={value.bloodGroup || undefined}
          onValueChange={(next) => update({ bloodGroup: next as PatientHealthInput['bloodGroup'] })}
        >
          <SelectTrigger id="field-bloodGroup">
            <SelectValue placeholder="Select blood group" />
          </SelectTrigger>
          <SelectContent>
            {BLOOD_GROUP_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField
        name="existingConditions"
        label="Existing Conditions"
        description="For example: diabetes, hypertension, asthma."
        optional
      >
        <Textarea
          id="field-existingConditions"
          value={value.existingConditions}
          onChange={(event) => update({ existingConditions: event.target.value })}
          rows={2}
          placeholder="Separate multiple conditions with commas"
        />
      </FormField>

      <FormField
        name="allergies"
        label="Allergies"
        description="Medication or food allergies we should be aware of."
        optional
      >
        <Textarea
          id="field-allergies"
          value={value.allergies}
          onChange={(event) => update({ allergies: event.target.value })}
          rows={2}
          placeholder="For example: penicillin, peanuts"
        />
      </FormField>

      <FormField
        name="emergencyContact"
        label="Emergency Notes"
        description="Anything our team should know in an emergency."
        optional
      >
        <Textarea
          id="field-emergencyContact"
          value={value.emergencyContact}
          onChange={(event) => update({ emergencyContact: event.target.value })}
          rows={2}
          placeholder="Optional notes"
        />
      </FormField>

      <p className="text-xs leading-relaxed text-muted-foreground">
        MediCare does not provide medical advice. Information you share here helps
        healthcare professionals during your consultations.
      </p>
    </RegistrationStepShell>
  );
}
