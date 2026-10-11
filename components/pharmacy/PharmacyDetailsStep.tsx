'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { RegistrationStepShell } from '@/components/auth/RegistrationStepShell';
import { FormField, useFieldAria } from '@/components/auth/FormField';
import { Input } from '@/components/ui/input';
import { RadioCard, RadioCardGroup } from '@/components/ui/radio-card-group';
import { Alert } from '@/components/ui/alert';
import {
  pharmacyDetailsSchema,
  type PharmacyDetailsInput,
  type PharmacyDetailsValues,
} from '@/lib/validations/pharmacy';
import { PHARMACY_TYPE_OPTIONS } from '@/lib/constants/options';
import { PHARMACY_STEPS } from '@/types/pharmacy';

export interface PharmacyDetailsStepProps {
  onBack: () => void;
  onContinue: (values: PharmacyDetailsValues) => void;
}

/**
 * Step 3 — pharmacy licence details.
 * Required / optional status is configurable in lib/validations/pharmacy.ts:
 * the pharmacy registration number stays optional because not every state
 * issues one.
 */
export function PharmacyDetailsStep({
  onBack,
  onContinue,
}: PharmacyDetailsStepProps) {
  const form = useForm<PharmacyDetailsInput>({
    resolver: zodResolver(pharmacyDetailsSchema),
    mode: 'onBlur',
    defaultValues: {
      drugLicenseNumber: '',
      gstNumber: '',
      pharmacyRegistrationNumber: '',
      pharmacyType: '',
    },
  });

  const drugAria = useFieldAria('drugLicenseNumber', { required: true });
  const gstAria = useFieldAria('gstNumber', { required: true });

  return (
    <RegistrationStepShell
      steps={PHARMACY_STEPS}
      currentStep={2}
      form={form as never}
      title="Pharmacy Details"
      description="Enter your licence numbers exactly as they appear on the certificates."
      onBack={onBack}
      onSubmit={form.handleSubmit((values) =>
        onContinue(values as PharmacyDetailsValues),
      )}
      loading={form.formState.isSubmitting}
    >
      <FormField
        name="drugLicenseNumber"
        label="Drug License Number"
        description="Issued by the state drug controller."
        required
      >
        <Input
          {...form.register('drugLicenseNumber')}
          {...drugAria}
          placeholder="e.g. KA-20B-778899"
          autoCapitalize="characters"
        />
      </FormField>

      <FormField
        name="gstNumber"
        label="GST Number"
        description="15 characters, for example 29ABCDE1234F1Z5."
        required
      >
        <Input
          {...form.register('gstNumber')}
          {...gstAria}
          placeholder="29ABCDE1234F1Z5"
          autoCapitalize="characters"
          maxLength={15}
        />
      </FormField>

      <FormField
        name="pharmacyRegistrationNumber"
        label="Pharmacy Registration Number"
        description="Not available in every state — leave it blank if you do not have one."
        optional
      >
        <Input
          {...form.register('pharmacyRegistrationNumber')}
          id="field-pharmacyRegistrationNumber"
          placeholder="PHA-2024-5566"
          autoCapitalize="characters"
        />
      </FormField>

      <FormField name="pharmacyType" label="Pharmacy Type" required>
        <Controller
          control={form.control}
          name="pharmacyType"
          render={({ field }) => (
            <RadioCardGroup
              value={field.value || ''}
              onValueChange={field.onChange}
              aria-invalid={form.formState.errors.pharmacyType ? true : undefined}
            >
              {PHARMACY_TYPE_OPTIONS.map((option) => (
                <RadioCard
                  key={option.value}
                  value={option.value}
                  description={option.description}
                >
                  {option.label}
                </RadioCard>
              ))}
            </RadioCardGroup>
          )}
        />
      </FormField>

      <Alert variant="info">
        Your licence details are checked against the documents you upload in the
        next step.
      </Alert>
    </RegistrationStepShell>
  );
}
