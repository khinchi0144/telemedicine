'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { OTPVerification } from '@/components/auth/OTPVerification';
import { SuccessScreen } from '@/components/auth/SuccessScreen';
import { PatientBasicStep } from './PatientBasicStep';
import { PatientPersonalStep } from './PatientPersonalStep';
import { PatientHealthStep } from './PatientHealthStep';
import type { BasicDetailsInput } from '@/lib/validations/auth';
import type {
  PatientHealthInput,
  PatientPersonalInput,
} from '@/lib/validations/patient';
import { PATIENT_STEPS } from '@/types/patient';
import { ApiError, apiRequest } from '@/lib/utils/api-client';
import { maskMobile } from '@/lib/utils/format';
import type { RegisterResult } from '@/types/auth';


type StepId = (typeof PATIENT_STEPS)[number]['id'];

/**
 * Patient registration wizard.
 *
 * Step 1 → Basic details      Step 4 → Health information (optional)
 * Step 2 → OTP verification   Step 5 → Success
 * Step 3 → Personal details
 *
 * Values are kept in component state between steps and submitted once, so the
 * wizard stays responsive while the server re-validates everything.
 */
export function PatientRegistration() {
  const router = useRouter();
  const [step, setStep] = React.useState<StepId>('basic');
  const [basic, setBasic] = React.useState<BasicDetailsInput | null>(null);
  const [personal, setPersonal] = React.useState<PatientPersonalInput | null>(null);
  const [health, setHealth] = React.useState<PatientHealthInput>({
    bloodGroup: '',
    existingConditions: '',
    allergies: '',
    emergencyContact: '',
  });
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const stepIndex = PATIENT_STEPS.findIndex((item) => item.id === step);

  const goTo = (next: StepId) => {
    setServerError(null);
    setStep(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submitRegistration = async () => {
    if (!basic || !personal) return;
    setSubmitting(true);
    setServerError(null);
    try {
      await apiRequest<RegisterResult>('/api/auth/register/patient', {
        method: 'POST',
        body: { basic, personal, health },
      });
      // The account is created and signed in, but the success screen is kept
      // on screen: redirecting straight away would skip step 5 entirely.
      goTo('success');
    } catch (error) {
      setServerError(
        error instanceof ApiError
          ? error.message
          : 'Something went wrong. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'success') {
    return (
      <SuccessScreen
        title="Account Created Successfully!"
        message="Your MediCare patient account has been created."
        points={[
          'Your mobile number is verified and your account is active.',
          'Complete your health information whenever you want.',
          'Book a consultation with a verified doctor from your dashboard.',
        ]}
        actionLabel="Go to Patient Home"
        onAction={() => {
          // NOTE: do not call router.refresh() here. Refreshing synchronously
          // after push revalidates the current (register) route and aborts the
          // pending navigation, leaving the user stuck on the success screen.
          // Pushing to a new route already renders it fresh from the server,
          // and the httpOnly session cookie set at registration travels along.
          router.push('/patient');
        }}
      />
    );
  }

  if (step === 'otp' && basic) {
    return (
      <OTPVerification
        role="PATIENT"
        mobile={basic.mobile}
        maskedMobile={maskMobile(basic.mobile)}
        onVerified={() => goTo('personal')}
        onBack={() => goTo('basic')}
        onChangeMobile={() => goTo('basic')}
      />
    );
  }

  if (step === 'basic') {
    return (
      <PatientBasicStep
        onContinue={(values) => {
          setBasic(values);
          goTo('otp');
        }}
      />
    );
  }

  if (step === 'personal') {
    return (
      <PatientPersonalStep
        onBack={() => goTo('otp')}
        onContinue={(values) => {
          setPersonal(values);
          goTo('health');
        }}
      />
    );
  }

  return (
    <PatientHealthStep
      stepIndex={stepIndex}
      submitting={submitting}
      serverError={serverError}
      value={health}
      onChange={setHealth}
      onBack={() => goTo('personal')}
      onSubmit={submitRegistration}
    />
  );
}
