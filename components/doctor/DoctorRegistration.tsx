'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { OTPVerification } from '@/components/auth/OTPVerification';
import { SuccessScreen } from '@/components/auth/SuccessScreen';
import { DoctorBasicStep } from './DoctorBasicStep';
import { DoctorProfessionalStep } from './DoctorProfessionalStep';
import { DoctorDocumentsStep } from './DoctorDocumentsStep';
import { DoctorClinicStep } from './DoctorClinicStep';
import type { BasicDetailsInput } from '@/lib/validations/auth';
import type {
  DoctorClinicInput,
  DoctorProfessionalInput,
} from '@/lib/validations/doctor';
import { DOCTOR_STEPS } from '@/types/doctor';
import { ApiError, apiRequest } from '@/lib/utils/api-client';
import { maskMobile } from '@/lib/utils/format';
import type { RegisterResult } from '@/types/auth';
import type { DocumentUploadResult } from '@/types/document';

type StepId = (typeof DOCTOR_STEPS)[number]['id'];

/**
 * Doctor registration wizard.
 *
 * Step 1 → Basic details        Step 4 → Document upload
 * Step 2 → OTP verification     Step 5 → Clinic / practice details
 * Step 3 → Professional info    Step 6 → Registration submitted
 *
 * The account is created in PENDING_VERIFICATION and no session is issued:
 * the professional dashboard only opens after an admin approves the profile.
 */
export function DoctorRegistration() {
  const router = useRouter();
  const [step, setStep] = React.useState<StepId>('basic');
  const [basic, setBasic] = React.useState<BasicDetailsInput | null>(null);
  const [professional, setProfessional] =
    React.useState<DoctorProfessionalInput | null>(null);
  const [clinic, setClinic] = React.useState<DoctorClinicInput | null>(null);
  const [documents, setDocuments] = React.useState<
    Record<string, DocumentUploadResult | null>
  >({});
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const stepIndex = DOCTOR_STEPS.findIndex((item) => item.id === step);

  const goTo = (next: StepId) => {
    setServerError(null);
    setStep(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const documentIds = Object.values(documents)
    .filter((document): document is DocumentUploadResult => Boolean(document))
    .map((document) => document.id);

  /** Submits the wizard; the clinic step passes its freshly validated values. */
  const submit = async (clinicDetails?: DoctorClinicInput) => {
    const finalClinic = clinicDetails ?? clinic;
    if (!basic || !professional || !finalClinic) return;
    setSubmitting(true);
    setServerError(null);
    try {
      await apiRequest<RegisterResult>('/api/auth/register/doctor', {
        method: 'POST',
        body: { basic, professional, clinic: finalClinic, documentIds },
      });
      goTo('submitted');
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

  if (step === 'submitted') {
    return (
      <SuccessScreen
        variant="pending"
        title="Registration Submitted"
        message="Your doctor profile is under verification. We will notify you once your details are approved."
        points={[
          'Our team reviews your registration and qualification documents.',
          'You can sign in to track the status of your application.',
          'The professional dashboard unlocks automatically after approval.',
        ]}
        actionLabel="Go to Login"
        onAction={() => {
          router.push('/auth/login');
          router.refresh();
        }}
      />
    );
  }

  if (step === 'otp' && basic) {
    return (
      <OTPVerification
        role="DOCTOR"
        mobile={basic.mobile}
        maskedMobile={maskMobile(basic.mobile)}
        onVerified={() => goTo('professional')}
        onBack={() => goTo('basic')}
        onChangeMobile={() => goTo('basic')}
      />
    );
  }

  if (step === 'basic') {
    return (
      <DoctorBasicStep
        onBack={() => router.push('/auth/register')}
        onContinue={(values) => {
          setBasic(values);
          goTo('otp');
        }}
      />
    );
  }

  if (step === 'professional') {
    return (
      <DoctorProfessionalStep
        onBack={() => goTo('otp')}
        onContinue={(values) => {
          setProfessional(values);
          goTo('documents');
        }}
      />
    );
  }

  if (step === 'documents') {
    return (
      <DoctorDocumentsStep
        documents={documents}
        onChange={(type, document) =>
          setDocuments((previous) => ({ ...previous, [type]: document }))
        }
        onBack={() => goTo('professional')}
        onContinue={() => goTo('clinic')}
      />
    );
  }

  return (
    <DoctorClinicStep
      stepIndex={stepIndex}
      submitting={submitting}
      serverError={serverError}
      onBack={() => goTo('documents')}
      onSubmit={(values) => {
        setClinic(values);
        void submit(values);
      }}
    />
  );
}
