'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { RegistrationStepShell } from '@/components/auth/RegistrationStepShell';
import { FormField, useFieldAria } from '@/components/auth/FormField';
import { PasswordField } from '@/components/auth/PasswordField';
import { MobileInput } from '@/components/auth/MobileInput';
import { Input } from '@/components/ui/input';
import {
  pharmacyBasicSchema,
  type PharmacyBasicInput,
} from '@/lib/validations/pharmacy';
import { PHARMACY_STEPS } from '@/types/pharmacy';
import { normalizeMobile } from '@/lib/utils/format';

export interface PharmacyBasicStepProps {
  onBack: () => void;
  onContinue: (values: PharmacyBasicInput) => void;
}

/** Step 1 — pharmacy identity and account credentials. */
export function PharmacyBasicStep({ onBack, onContinue }: PharmacyBasicStepProps) {
  const form = useForm<PharmacyBasicInput>({
    resolver: zodResolver(pharmacyBasicSchema),
    mode: 'onBlur',
    defaultValues: {
      pharmacyName: '',
      ownerName: '',
      mobile: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const nameAria = useFieldAria('pharmacyName', { required: true });
  const ownerAria = useFieldAria('ownerName', { required: true });
  const emailAria = useFieldAria('email', { required: true });

  return (
    <RegistrationStepShell
      steps={PHARMACY_STEPS}
      currentStep={0}
      form={form as never}
      title="Create Your Account"
      description="Create your account as a Pharmacy"
      onBack={onBack}
      backLabel="Change account type"
      onSubmit={form.handleSubmit((values) =>
        onContinue({ ...values, mobile: normalizeMobile(values.mobile) }),
      )}
      loading={form.formState.isSubmitting}
      footerNote="Your licence details are verified before the pharmacy profile goes live."
    >
      <FormField
        name="pharmacyName"
        label="Pharmacy Name"
        description="The name shown to customers on their orders."
        required
      >
        <Input
          {...form.register('pharmacyName')}
          {...nameAria}
          placeholder="MediCare Pharmacy"
          autoComplete="organization"
        />
      </FormField>

      <FormField
        name="ownerName"
        label="Owner / Authorized Person Name"
        description="The person responsible for the licence."
        required
      >
        <Input
          {...form.register('ownerName')}
          {...ownerAria}
          autoComplete="name"
          placeholder="Full name"
        />
      </FormField>

      <MobileInput name="mobile" label="Mobile Number" />

      <FormField name="email" label="Email Address" required>
        <Input
          {...form.register('email')}
          {...emailAria}
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="you@pharmacy.example"
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
