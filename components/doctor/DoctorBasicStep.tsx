'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { RegistrationStepShell } from '@/components/auth/RegistrationStepShell';
import { FormField, useFieldAria } from '@/components/auth/FormField';
import { PasswordField } from '@/components/auth/PasswordField';
import { MobileInput } from '@/components/auth/MobileInput';
import { Input } from '@/components/ui/input';
import { basicDetailsSchema, type BasicDetailsInput } from '@/lib/validations/auth';
import { DOCTOR_STEPS } from '@/types/doctor';
import { normalizeMobile } from '@/lib/utils/format';

export interface DoctorBasicStepProps {
  onBack: () => void;
  onContinue: (values: BasicDetailsInput) => void;
}

/** Step 1 — account credentials for a doctor account. */
export function DoctorBasicStep({ onBack, onContinue }: DoctorBasicStepProps) {
  const form = useForm<BasicDetailsInput>({
    resolver: zodResolver(basicDetailsSchema),
    mode: 'onBlur',
    defaultValues: {
      fullName: '',
      mobile: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const fullNameAria = useFieldAria('fullName', { required: true });
  const emailAria = useFieldAria('email', { required: true });

  return (
    <RegistrationStepShell
      steps={DOCTOR_STEPS}
      currentStep={0}
      form={form as never}
      title="Create Your Account"
      description="Create your account as a Doctor"
      onBack={onBack}
      backLabel="Change account type"
      onSubmit={form.handleSubmit((values) =>
        onContinue({ ...values, mobile: normalizeMobile(values.mobile) }),
      )}
      loading={form.formState.isSubmitting}
      footerNote="Your professional details are verified before your profile goes live."
    >
      <FormField name="fullName" label="Full Name" required>
        <Input
          {...form.register('fullName')}
          {...fullNameAria}
          autoComplete="name"
          placeholder="Dr. Your full name"
        />
      </FormField>

      <MobileInput name="mobile" label="Mobile Number" />

      <FormField
        name="email"
        label="Email Address"
        description="Used for verification updates and account notices."
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
          placeholder="you@hospital.example"
        />
      </FormField>

      <PasswordField
        name="password"
        label="Password"
        autoComplete="new-password"
        showStrength
        hint="At least 8 characters with upper and lower case letters and a number."
      />

      <PasswordField
        name="confirmPassword"
        label="Confirm Password"
        autoComplete="new-password"
      />
    </RegistrationStepShell>
  );
}
