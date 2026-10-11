'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { RegistrationStepShell } from '@/components/auth/RegistrationStepShell';
import { FormField } from '@/components/auth/FormField';
import { MobileInput } from '@/components/auth/MobileInput';
import { Input, Textarea } from '@/components/ui/input';
import { RadioCard, RadioCardGroup } from '@/components/ui/radio-card-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFieldAria } from '@/components/auth/FormField';
import {
  patientPersonalSchema,
  type PatientPersonalInput,
} from '@/lib/validations/patient';
import { GENDER_OPTIONS } from '@/lib/constants/options';
import { INDIAN_STATES } from '@/lib/constants/geo';
import { PATIENT_STEPS } from '@/types/patient';

export interface PatientPersonalStepProps {
  onBack: () => void;
  onContinue: (values: PatientPersonalInput) => void;
}

/** Step 3 — personal information of the patient. */
export function PatientPersonalStep({ onBack, onContinue }: PatientPersonalStepProps) {
  const form = useForm<PatientPersonalInput>({
    resolver: zodResolver(patientPersonalSchema),
    mode: 'onBlur',
    defaultValues: {
      dateOfBirth: '',
      gender: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      emergencyContactName: '',
      emergencyContactNumber: '',
    },
  });

  const dobAria = useFieldAria('dateOfBirth', { required: true });
  const addressAria = useFieldAria('address', { required: true });
  const cityAria = useFieldAria('city', { required: true });
  const pincodeAria = useFieldAria('pincode', { required: true });
  const emergencyNameAria = useFieldAria('emergencyContactName', { required: true });

  return (
    <RegistrationStepShell
      steps={PATIENT_STEPS}
      currentStep={2}
      form={form as never}
      title="Personal Information"
      description="These details help us identify you and keep your records accurate."
      onBack={onBack}
      onSubmit={form.handleSubmit(onContinue)}
      loading={form.formState.isSubmitting}
      submitLabel="Continue"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField name="dateOfBirth" label="Date of Birth" required>
          <Input
            {...form.register('dateOfBirth')}
            {...dobAria}
            type="date"
            autoComplete="bday"
            max={new Date().toISOString().split('T')[0]}
          />
        </FormField>

        <div className="sm:col-span-1">
          <FormField name="gender" label="Gender" required>
            <Controller
              control={form.control}
              name="gender"
              render={({ field }) => (
                <RadioCardGroup
                  value={(field.value as string) || ''}
                  onValueChange={field.onChange}
                  className="grid-cols-1 sm:grid-cols-2"
                  aria-invalid={form.formState.errors.gender ? true : undefined}
                >
                  {GENDER_OPTIONS.map((option) => (
                    <RadioCard key={option.value} value={option.value}>
                      {option.label}
                    </RadioCard>
                  ))}
                </RadioCardGroup>
              )}
            />
          </FormField>
        </div>
      </div>

      <FormField name="address" label="Address" required>
        <Textarea
          {...form.register('address')}
          {...addressAria}
          rows={2}
          autoComplete="street-address"
          placeholder="House / flat, street, landmark"
        />
      </FormField>

      <div className="grid gap-5 sm:grid-cols-3">
        <FormField name="city" label="City" required>
          <Input {...form.register('city')} {...cityAria} autoComplete="address-level2" />
        </FormField>

        <FormField name="state" label="State" required>
          <Controller
            control={form.control}
            name="state"
            render={({ field }) => (
              <Select
                value={(field.value as string) || undefined}
                onValueChange={field.onChange}
              >
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
            autoComplete="postal-code"
            maxLength={6}
            placeholder="560001"
          />
        </FormField>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField name="emergencyContactName" label="Emergency Contact Name" required>
          <Input
            {...form.register('emergencyContactName')}
            {...emergencyNameAria}
            autoComplete="off"
            placeholder="Full name"
          />
        </FormField>

        <MobileInput name="emergencyContactNumber" label="Emergency Contact Number" />
      </div>
    </RegistrationStepShell>
  );
}
