'use client';

import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { RegistrationStepShell } from '@/components/auth/RegistrationStepShell';
import { FormField, useFieldAria } from '@/components/auth/FormField';
import { Input, Textarea } from '@/components/ui/input';
import { RadioCard, RadioCardGroup } from '@/components/ui/radio-card-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert } from '@/components/ui/alert';
import { AvailabilityFields } from '@/components/doctor/AvailabilityFields';
import {
  doctorClinicSchema,
  type DoctorClinicFormValues,
  type DoctorClinicInput,
} from '@/lib/validations/doctor';
import { CONSULTATION_MODE_OPTIONS } from '@/lib/constants/options';
import { INDIAN_STATES } from '@/lib/constants/geo';
import { DOCTOR_STEPS } from '@/types/doctor';

export interface DoctorClinicStepProps {
  stepIndex: number;
  submitting: boolean;
  serverError: string | null;
  onBack: () => void;
  onSubmit: (values: DoctorClinicInput) => void;
}

/** Step 5 — clinic / practice details, then the registration is submitted. */
export function DoctorClinicStep({
  stepIndex,
  submitting,
  serverError,
  onBack,
  onSubmit,
}: DoctorClinicStepProps) {
  const form = useForm<DoctorClinicFormValues, unknown, DoctorClinicInput>({
    resolver: zodResolver(doctorClinicSchema),
    mode: 'onBlur',
    defaultValues: {
      clinicName: '',
      clinicAddress: '',
      city: '',
      state: '',
      pincode: '',
      consultationMode: '',
      consultationFee: '',
      availability: [],
    },
  });

  const clinicNameAria = useFieldAria('clinicName', { required: true });
  const addressAria = useFieldAria('clinicAddress', { required: true });
  const cityAria = useFieldAria('city', { required: true });
  const pincodeAria = useFieldAria('pincode', { required: true });

  return (
    <RegistrationStepShell
      steps={DOCTOR_STEPS}
      currentStep={stepIndex}
      form={form as never}
      title="Clinic / Practice Details"
      description="Where do you usually practice? Patients will see this once your profile is approved."
      onBack={onBack}
      onSubmit={form.handleSubmit(onSubmit)}
      loading={submitting}
      submitLabel="Submit Registration"
      error={serverError}
      footerNote="Your account stays in PENDING_VERIFICATION until the review is complete."
    >
      <FormField name="clinicName" label="Clinic / Hospital Name" required>
        <Input
          {...form.register('clinicName')}
          {...clinicNameAria}
          placeholder="MediCare City Clinic"
        />
      </FormField>

      <FormField name="clinicAddress" label="Address" required>
        <Textarea
          {...form.register('clinicAddress')}
          {...addressAria}
          rows={2}
          placeholder="Building, street, landmark"
        />
      </FormField>

      <div className="grid gap-5 sm:grid-cols-3">
        <FormField name="city" label="City" required>
          <Input {...form.register('city')} {...cityAria} />
        </FormField>

        <FormField name="state" label="State" required>
          <Controller
            control={form.control}
            name="state"
            render={({ field }) => (
              <Select value={field.value || undefined} onValueChange={field.onChange}>
                <SelectTrigger
                  id="field-state"
                  aria-invalid={form.formState.errors.state ? true : undefined}
                >
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {INDIAN_STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>

        <FormField name="pincode" label="Pincode" required>
          <Input
            {...form.register('pincode')}
            {...pincodeAria}
            inputMode="numeric"
            maxLength={6}
            placeholder="560001"
          />
        </FormField>
      </div>

      <FormField name="consultationMode" label="Consultation Mode" required>
        <Controller
          control={form.control}
          name="consultationMode"
          render={({ field }) => (
            <RadioCardGroup
              value={field.value || ''}
              onValueChange={field.onChange}
              aria-invalid={form.formState.errors.consultationMode ? true : undefined}
            >
              {CONSULTATION_MODE_OPTIONS.map((option) => (
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

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          name="consultationFee"
          label="Consultation Fee"
          optional
          description="Leave blank if patients should contact you directly."
        >
          <Input
            {...form.register('consultationFee')}
            type="number"
            inputMode="numeric"
            min={0}
            max={100000}
            step={1}
            placeholder="500"
            className="max-w-[220px]"
            aria-invalid={form.formState.errors.consultationFee ? true : undefined}
          />
        </FormField>
      </div>

      <AvailabilityFields />

      <Alert variant="warning" title="What happens next">
        Your profile is reviewed by the MediCare team. You can sign in meanwhile,
        but the professional dashboard opens only after approval.
      </Alert>
    </RegistrationStepShell>
  );
}
