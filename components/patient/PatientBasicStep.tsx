'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { RegistrationStepShell } from '@/components/auth/RegistrationStepShell';
import { FormField, useFieldAria } from '@/components/auth/FormField';
import { PasswordField } from '@/components/auth/PasswordField';
import { MobileInput } from '@/components/auth/MobileInput';
import { Input } from '@/components/ui/input';
import { basicDetailsSchema, type BasicDetailsInput } from '@/lib/validations/auth';
import { PATIENT_STEPS } from '@/types/patient';
import { normalizeMobile } from '@/lib/utils/format';

export interface PatientBasicStepProps {
  onContinue: (values: BasicDetailsInput) => void;
}

/** Step 1 — account credentials for a patient account. */
export function PatientBasicStep({ onContinue }: PatientBasicStepProps) {
  const form = useForm<BasicDetailsInput>({
    resolver: zodResolver(basicDetailsSchema),
    mode: 'onBlur',
    defaultValues: { fullName: '', mobile: '', email: '', password: '', confirmPassword: '' },
  });

  const fullNameAria = useFieldAria('fullName', { required: true });
  const emailAria = useFieldAria('email', { required: true });

  return (
    <RegistrationStepShell
      steps={PATIENT_STEPS}
      currentStep={0}
      form={form as never}
      title="Create Your Account"
      description="Create your account as a Patient"
      onSubmit={form.handleSubmit((values) =>
        onContinue({ ...values, mobile: normalizeMobile(values.mobile) }),
      )}
      loading={form.formState.isSubmitting}
      footerNote="You will verify your mobile number in the next step."
    >
      <FormField name="fullName" label="Full Name" required>
        <Input
          {...form.register('fullName')}
          {...fullNameAria}
          autoComplete="name"
          placeholder="Enter your full name"
        />
      </FormField>

      <MobileInput name="mobile" label="Mobile Number" />

      <FormField
        name="email"
        label="Email Address"
        description="We use this for account updates and never share it."
        required
      >
        <Input
          {...form.register('email')}
          {...emailAria}
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="you@example.com"
        />
      </FormField>

      <PasswordField
        name="password"
        label="Password"
        autoComplete="new-password"
        placeholder="Create a strong password"
        showStrength
        hint="At least 8 characters with upper and lower case letters and a number."
      />

      <PasswordField
        name="confirmPassword"
        label="Confirm Password"
        autoComplete="new-password"
        placeholder="Re-enter your password"
      />
    </RegistrationStepShell>
  );
}
