'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { RegistrationStepShell } from '@/components/auth/RegistrationStepShell';
import { FormField, useFieldAria } from '@/components/auth/FormField';
import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/ui/combobox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert } from '@/components/ui/alert';
import {
  doctorProfessionalSchema,
  type DoctorProfessionalInput,
} from '@/lib/validations/doctor';
import { SPECIALIZATION_OPTIONS } from '@/lib/constants/options';
import { MEDICAL_COUNCILS } from '@/lib/constants/geo';
import { DOCTOR_STEPS } from '@/types/doctor';

export interface DoctorProfessionalStepProps {
  onBack: () => void;
  onContinue: (values: DoctorProfessionalInput) => void;
}

/**
 * Step 3 — professional information.
 * The specialisation list is a searchable dropdown; selecting one is not an
 * endorsement of any kind and is verified separately.
 */
export function DoctorProfessionalStep({
  onBack,
  onContinue,
}: DoctorProfessionalStepProps) {
  const form = useForm<DoctorProfessionalInput>({
    resolver: zodResolver(doctorProfessionalSchema),
    mode: 'onBlur',
    defaultValues: {
      medicalRegistrationNumber: '',
      medicalCouncil: '',
      specialization: '',
      qualification: '',
      experienceYears: '',
    },
  });

  const regAria = useFieldAria('medicalRegistrationNumber', { required: true });
  const qualificationAria = useFieldAria('qualification', { required: true });
  const experienceAria = useFieldAria('experienceYears', { required: true });

  return (
    <RegistrationStepShell
      steps={DOCTOR_STEPS}
      currentStep={2}
      form={form as never}
      title="Professional Information"
      description="These details are checked against the documents you upload next."
      onBack={onBack}
      onSubmit={form.handleSubmit(onContinue)}
      loading={form.formState.isSubmitting}
    >
      <FormField
        name="medicalRegistrationNumber"
        label="Medical Registration Number"
        description="Exactly as printed on your registration certificate."
        required
      >
        <Input
          {...form.register('medicalRegistrationNumber')}
          {...regAria}
          placeholder="e.g. KMC-123456"
          autoCapitalize="characters"
        />
      </FormField>

      <FormField name="medicalCouncil" label="Medical Council" required>
        <Controller
          control={form.control}
          name="medicalCouncil"
          render={({ field }) => (
            <Select value={field.value || undefined} onValueChange={field.onChange}>
              <SelectTrigger
                id="field-medicalCouncil"
                aria-invalid={form.formState.errors.medicalCouncil ? true : undefined}
              >
                <SelectValue placeholder="Select your medical council" />
              </SelectTrigger>
              <SelectContent>
                {MEDICAL_COUNCILS.map((council) => (
                  <SelectItem key={council} value={council}>
                    {council}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </FormField>

      <FormField
        name="specialization"
        label="Specialization"
        description="Start typing to search the list."
        required
      >
        <Controller
          control={form.control}
          name="specialization"
          render={({ field }) => (
            <Combobox
              id="field-specialization"
              options={SPECIALIZATION_OPTIONS.map((option) => ({
                value: option,
                label: option,
              }))}
              value={field.value}
              onChange={field.onChange}
              placeholder="Select your specialization"
              searchPlaceholder="Search specializations…"
              emptyMessage="No matching specialization."
              aria-invalid={form.formState.errors.specialization ? true : undefined}
            />
          )}
        />
      </FormField>

      <div className="grid gap-5 sm:grid-cols-[1fr_10rem]">
        <FormField
          name="qualification"
          label="Qualification"
          description="For example: MBBS, MD (General Medicine)."
          required
        >
          <Input
            {...form.register('qualification')}
            {...qualificationAria}
            placeholder="MBBS, MD"
          />
        </FormField>

        <FormField name="experienceYears" label="Years of Experience" required>
          <Input
            {...form.register('experienceYears')}
            {...experienceAria}
            inputMode="numeric"
            maxLength={2}
            placeholder="8"
          />
        </FormField>
      </div>

      <Alert variant="info">
        Selecting a specialization helps patients find you. It is not an
        endorsement and does not replace the verification of your documents.
      </Alert>
    </RegistrationStepShell>
  );
}
