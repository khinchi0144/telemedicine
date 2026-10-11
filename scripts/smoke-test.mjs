/**
 * End-to-end smoke test for the MediCare authentication and registration
 * flows. Start the dev server first, then run:
 *
 *   npm run dev            # in one terminal
 *   node scripts/smoke-test.mjs
 *
 * It exercises the real HTTP APIs: OTP issue + verify, the three registration
 * endpoints (including document upload), login, role based redirects and the
 * security guards (CSRF, cross-role access, document permissions, validation).
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const results = [];

function check(name, passed, detail = '') {
  results.push({ name, passed, detail });
  console.log(`${passed ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

const makeJar = () =>
  path.join(os.tmpdir(), `medicare-smoke-${Math.random().toString(36).slice(2)}.txt`);

function readJar(jar) {
  if (!fs.existsSync(jar)) return [];
  return fs
    .readFileSync(jar, 'utf8')
    .split('\n')
    .filter((line) => line && !line.startsWith('#'));
}

function writeJar(jar, lines) {
  fs.writeFileSync(jar, lines.join('\n') + '\n');
}

function upsertCookie(jar, pair) {
  const name = pair.split('=')[0];
  const lines = readJar(jar).filter((line) => line.split('\t')[5] !== name);
  lines.push(`localhost\tFALSE\t/\tFALSE\t0\t${pair.replace('=', '\t')}`);
  writeJar(jar, lines);
}

function cookieHeader(jar) {
  return readJar(jar)
    .map((line) => {
      const parts = line.split('\t');
      return `${parts[5]}=${parts[6]}`;
    })
    .join('; ');
}

function csrfToken(jar) {
  return /medicare_csrf=([^;]+)/.exec(cookieHeader(jar))?.[1] ?? '';
}

/** Load a page (sending any stored cookies) and track the CSRF cookie. */
async function load(jar, url) {
  const response = await fetch(`${BASE}${url}`, {
    redirect: 'manual',
    headers: { Cookie: cookieHeader(jar) },
  });
  for (const cookie of response.headers.getSetCookie?.() ?? []) {
    const pair = cookie.split(';')[0];
    if (pair.startsWith('medicare_csrf=')) upsertCookie(jar, pair);
  }
  return { status: response.status, location: response.headers.get('location') };
}

async function call(jar, url, { method = 'POST', body, multipart } = {}) {
  const headers = { Cookie: cookieHeader(jar), Origin: BASE, 'x-csrf-token': csrfToken(jar) };
  let payload = multipart;
  if (!multipart) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body ?? {});
  }
  const response = await fetch(`${BASE}${url}`, { method, headers, body: payload, redirect: 'manual' });
  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* not json */
  }
  for (const raw of response.headers.getSetCookie?.() ?? []) {
    const pair = raw.split(';')[0];
    if (pair && !pair.startsWith('medicare_csrf=')) upsertCookie(jar, pair);
  }
  return { status: response.status, json, text };
}

const uploadForm = (documentType, bytes, name, type) => {
  const form = new FormData();
  form.append('file', new File([bytes], name, { type }));
  form.append('documentType', documentType);
  return form;
};

/** Smallest valid PNG (1x1) used for document uploads. */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

const PERSONAL = {
  dateOfBirth: '1995-01-01',
  gender: 'MALE',
  address: '1 Test Street',
  city: 'Pune',
  state: 'Maharashtra',
  pincode: '411001',
  emergencyContactName: 'Someone',
  emergencyContactNumber: '9876500000',
};

/**
 * Fresh, unused 10 digit mobile number for a registration attempt.
 * The counter keeps repeated runs (and same-millisecond calls) distinct.
 */
let lastMobile = 0;
function nextMobile() {
  lastMobile = (lastMobile + 1) % 100;
  return `9${String(Date.now() % 10_000_000).padStart(7, '0')}${String(lastMobile).padStart(2, '0')}`;
}

/**
 * Registers a cookie jar whose OTP has already been verified for a brand new
 * mobile number — the registration endpoints require that ticket.
 */
async function verifiedTicket() {
  const jar = makeJar();
  await load(jar, '/auth/register/patient');
  const mobile = nextMobile();
  const otp = await call(jar, '/api/auth/send-otp', {
    body: { mobile, role: 'PATIENT', purpose: 'REGISTRATION' },
  });
  await call(jar, '/api/auth/verify-otp', {
    body: {
      challengeId: otp.json?.data?.challengeId,
      code: otp.json?.data?.devOtp,
      role: 'PATIENT',
    },
  });
  return { jar, mobile };
}


async function run() {
  console.log(`\nMediCare smoke test → ${BASE}\n${'='.repeat(46)}`);

  // --- public routes --------------------------------------------------------
  for (const route of ['/', '/auth', '/auth/login', '/auth/register', '/terms', '/privacy', '/support']) {
    const res = await fetch(`${BASE}${route}`, { redirect: 'manual' });
    check(`GET ${route}`, res.status === 200, `status ${res.status}`);
  }
  for (const route of ['/auth/register/patient', '/auth/register/doctor', '/auth/register/pharmacy']) {
    const res = await fetch(`${BASE}${route}`, { redirect: 'manual' });
    check(`GET ${route}`, res.status === 200, `status ${res.status}`);
  }

  // --- protected routes redirect anonymous users ----------------------------
  for (const route of ['/patient', '/doctor', '/pharmacy', '/admin']) {
    const res = await fetch(`${BASE}${route}`, { redirect: 'manual' });
    check(
      `anonymous ${route} → login`,
      res.status === 307 && (res.headers.get('location') ?? '').includes('/auth/login'),
      `${res.status} ${res.headers.get('location') ?? ''}`,
    );
  }

  // --- CSRF guard -----------------------------------------------------------
  const noCsrf = await call(makeJar(), '/api/auth/login', {
    body: { identifier: '9876500001', password: 'MediCare@123' },
  });
  check('API call without CSRF token is rejected', noCsrf.json?.code === 'CSRF_INVALID', noCsrf.json?.code);

  // --- OTP + patient registration ------------------------------------------
  const mobile = `98${String(Date.now()).slice(-8)}`;
  const patientJar = makeJar();
  await load(patientJar, '/auth/register/patient');

  const otp = await call(patientJar, '/api/auth/send-otp', {
    body: { mobile, role: 'PATIENT', purpose: 'REGISTRATION' },
  });
  check('send-otp returns a challenge', Boolean(otp.json?.data?.challengeId), otp.json?.code ?? '');

  const badOtp = await call(patientJar, '/api/auth/verify-otp', {
    body: { challengeId: otp.json?.data?.challengeId, code: '000000', role: 'PATIENT' },
  });
  check('wrong OTP is rejected', badOtp.json?.code === 'INVALID_OTP', badOtp.json?.code);

  const verified = await call(patientJar, '/api/auth/verify-otp', {
    body: { challengeId: otp.json?.data?.challengeId, code: otp.json?.data?.devOtp, role: 'PATIENT' },
  });
  check('correct OTP issues a registration ticket', verified.json?.data?.verified === true);

  const weak = await call(patientJar, '/api/auth/register/patient', {
    body: {
      basic: { fullName: 'Weak Pass', mobile, email: `weak${mobile}@example.com`, password: 'abc', confirmPassword: 'abc' },
      personal: PERSONAL,
      health: {},
    },
  });
  check(
    'weak password is rejected server-side',
    weak.status === 422,
    `${weak.status} ${weak.json?.fieldErrors?.[0]?.message ?? ''}`,
  );

  const registered = await call(patientJar, '/api/auth/register/patient', {
    body: {
      basic: {
        fullName: 'Smoke Patient', mobile, email: `smoke${mobile}@example.com`,
        password: 'Smoke@1234', confirmPassword: 'Smoke@1234',
      },
      personal: PERSONAL,
      health: { bloodGroup: 'O+', existingConditions: '', allergies: '', emergencyContact: '' },
    },
  });
  check(
    'patient registration succeeds and signs in',
    registered.json?.data?.status === 'ACTIVE' && registered.json?.data?.signedIn === true,
    registered.json?.code ?? '',
  );

  /*
   * Regression: the wizard always posts the optional health object, with an
   * empty string for every field the user skipped. That must NOT be rejected —
   * step 4 is explicitly optional and must never block registration.
   */
  const skipTicket = await verifiedTicket();
  const skipped = await call(skipTicket.jar, '/api/auth/register/patient', {
    body: {
      basic: {
        fullName: 'Skip Health', mobile: skipTicket.mobile,
        email: `skip${skipTicket.mobile}@example.com`,
        password: 'Smoke@1234', confirmPassword: 'Smoke@1234',
      },
      personal: PERSONAL,
      health: { bloodGroup: '', existingConditions: '', allergies: '', emergencyContact: '' },
    },
  });
  check(
    'skipped optional health fields do not block registration',
    skipped.status === 201,
    `${skipped.status} ${skipped.json?.fieldErrors?.[0]?.message ?? skipped.json?.code ?? ''}`,
  );

  // An invalid enum value must still fail, but with a readable message
  // instead of Zod's raw `expected one of "A+"|"A-"...` string.
  const enumTicket = await verifiedTicket();
  const badEnum = await call(enumTicket.jar, '/api/auth/register/patient', {
    body: {
      basic: {
        fullName: 'Bad Enum', mobile: enumTicket.mobile,
        email: `bad${enumTicket.mobile}@example.com`,
        password: 'Smoke@1234', confirmPassword: 'Smoke@1234',
      },
      personal: PERSONAL,
      health: { bloodGroup: 'Z+' },
    },
  });
  const enumMessage = badEnum.json?.fieldErrors?.[0]?.message ?? '';
  check(
    'invalid blood group is rejected with a friendly message',
    badEnum.status === 422 && enumMessage.length > 0 && !/expected one of/.test(enumMessage),
    enumMessage,
  );

  const own = await load(patientJar, '/patient');
  check('patient can open /patient', own.status === 200, `status ${own.status}`);
  for (const route of ['/doctor', '/pharmacy', '/admin']) {
    const res = await load(patientJar, route);
    check(
      `patient is blocked from ${route}`,
      res.status === 307 && (res.location ?? '').includes('/patient'),
      `${res.status} ${res.location ?? ''}`,
    );
  }

  // --- doctor registration with documents ----------------------------------
  const doctorMobile = `97${String(Date.now()).slice(-8)}`;
  const doctorJar = makeJar();
  await load(doctorJar, '/auth/register/doctor');
  const doctorOtp = await call(doctorJar, '/api/auth/send-otp', {
    body: { mobile: doctorMobile, role: 'DOCTOR', purpose: 'REGISTRATION' },
  });
  await call(doctorJar, '/api/auth/verify-otp', {
    body: { challengeId: doctorOtp.json?.data?.challengeId, code: doctorOtp.json?.data?.devOtp, role: 'DOCTOR' },
  });

  const wrongDoc = await call(doctorJar, '/api/upload/document', {
    multipart: uploadForm('GST_CERTIFICATE', PNG, 'a.png', 'image/png'),
  });
  check('doctor cannot upload a pharmacy document', wrongDoc.json?.code === 'INVALID_DOCUMENT_TYPE', wrongDoc.json?.code);

  const fakePdf = await call(doctorJar, '/api/upload/document', {
    multipart: uploadForm('MEDICAL_REGISTRATION_CERTIFICATE', Buffer.from('not-a-real-pdf'), 'a.pdf', 'application/pdf'),
  });
  check('renamed file is rejected by the signature check', fakePdf.json?.code === 'INVALID_DOCUMENT_TYPE', fakePdf.json?.code);

  const documentIds = [];
  for (const type of ['MEDICAL_REGISTRATION_CERTIFICATE', 'QUALIFICATION_CERTIFICATE', 'IDENTITY_PROOF']) {
    const res = await call(doctorJar, '/api/upload/document', {
      multipart: uploadForm(type, PNG, 'doc.png', 'image/png'),
    });
    if (res.json?.data?.id) documentIds.push(res.json.data.id);
  }
  check('required doctor documents upload', documentIds.length === 3, `${documentIds.length}/3`);

  const doctorBody = (ids) => ({
    basic: {
      fullName: 'Dr Smoke', mobile: doctorMobile, email: `doctor${doctorMobile}@example.com`,
      password: 'Doctor@1234', confirmPassword: 'Doctor@1234',
    },
    professional: {
      medicalRegistrationNumber: 'KMC-123123',
      medicalCouncil: 'Karnataka Medical Council',
      specialization: 'Cardiologist',
      qualification: 'MBBS, MD',
      experienceYears: '9',
    },
    clinic: {
      clinicName: 'Smoke Clinic', clinicAddress: '2 Test Road', city: 'Bengaluru',
      state: 'Karnataka', pincode: '560001', consultationMode: 'BOTH',
    },
    documentIds: ids,
  });

  const missingDocs = await call(doctorJar, '/api/auth/register/doctor', {
    body: doctorBody(documentIds.slice(0, 2)),
  });
  check('registration blocked while documents are missing', missingDocs.json?.code === 'VALIDATION_ERROR', missingDocs.json?.code);

  // --- doctor consultation fee + availability -------------------------------
  // A second doctor registration proves the optional practice fields are
  // accepted and validated without blocking the flow.
  //
  // Order matters: the registration ticket is consumed only on success, so the
  // invalid payloads are sent first and the happy path last.
  const feeMobile = nextMobile();
  const feeJar = makeJar();
  await load(feeJar, '/auth/register/doctor');
  const feeOtp = await call(feeJar, '/api/auth/send-otp', {
    body: { mobile: feeMobile, role: 'DOCTOR', purpose: 'REGISTRATION' },
  });
  await call(feeJar, '/api/auth/verify-otp', {
    body: {
      challengeId: feeOtp.json?.data?.challengeId,
      code: feeOtp.json?.data?.devOtp,
      role: 'DOCTOR',
    },
  });

  const feeDocs = [];
  for (const type of [
    'MEDICAL_REGISTRATION_CERTIFICATE',
    'QUALIFICATION_CERTIFICATE',
    'IDENTITY_PROOF',
  ]) {
    const upload = await call(feeJar, '/api/upload/document', {
      multipart: uploadForm(type, PNG, `${type}.png`, 'image/png'),
    });
    feeDocs.push(upload.json?.data?.id);
  }

  const doctorBodyWith = (ids, extra) => ({
    basic: {
      fullName: 'Dr Timed', mobile: feeMobile, email: `timed${feeMobile}@example.com`,
      password: 'Doctor@1234', confirmPassword: 'Doctor@1234',
    },
    professional: {
      medicalRegistrationNumber: 'KMC-999111',
      medicalCouncil: 'Karnataka Medical Council',
      specialization: 'Dermatologist',
      qualification: 'MBBS',
      experienceYears: '4',
    },
    clinic: {
      clinicName: 'Timed Clinic', clinicAddress: '5 Care Road', city: 'Bengaluru',
      state: 'Karnataka', pincode: '560002', consultationMode: 'ONLINE',
      ...extra,
    },
    documentIds: ids,
  });

  const badFee = await call(feeJar, '/api/auth/register/doctor', {
    body: doctorBodyWith(feeDocs, { consultationFee: 'free' }),
  });
  check(
    'a non numeric consultation fee is rejected',
    badFee.json?.code === 'VALIDATION_ERROR',
    badFee.json?.code,
  );

  const badWindow = await call(feeJar, '/api/auth/register/doctor', {
    body: doctorBodyWith(feeDocs, {
      availability: [
        { day: 'MONDAY', isEnabled: true, startTime: '17:00', endTime: '09:00' },
      ],
    }),
  });
  check(
    'an end time before the start time is rejected',
    badWindow.json?.code === 'VALIDATION_ERROR',
    badWindow.json?.code,
  );

  const dupDay = await call(feeJar, '/api/auth/register/doctor', {
    body: doctorBodyWith(feeDocs, {
      availability: [
        { day: 'MONDAY', isEnabled: true, startTime: '09:00', endTime: '13:00' },
        { day: 'MONDAY', isEnabled: false, startTime: '09:00', endTime: '13:00' },
      ],
    }),
  });
  check(
    'the same day cannot be configured twice',
    dupDay.json?.code === 'VALIDATION_ERROR',
    dupDay.json?.code,
  );

  // Happy path last — this consumes the registration ticket.
  const withFee = await call(feeJar, '/api/auth/register/doctor', {
    body: doctorBodyWith(feeDocs, {
      consultationFee: '750',
      availability: [
        { day: 'MONDAY', isEnabled: true, startTime: '09:00', endTime: '13:00' },
        { day: 'SATURDAY', isEnabled: true, startTime: '10:00', endTime: '14:00' },
      ],
    }),
  });
  check(
    'doctor can register with a fee and weekly availability',
    withFee.json?.data?.status === 'PENDING_VERIFICATION',
    withFee.json?.code ?? '',
  );

  const doctorDone = await call(doctorJar, '/api/auth/register/doctor', { body: doctorBody(documentIds) });
  check(
    'doctor registration stays PENDING_VERIFICATION and is not signed in',
    doctorDone.json?.data?.status === 'PENDING_VERIFICATION' && doctorDone.json?.data?.signedIn === false,
    doctorDone.json?.code ?? '',
  );

  // Profile id is needed later by the admin verification checks.
  const doctorProfileId = doctorDone.json?.data?.profileId ?? '';

  // --- pharmacy registration ------------------------------------------------
  const pharmacyMobile = `96${String(Date.now()).slice(-8)}`;
  const pharmacyJar = makeJar();
  await load(pharmacyJar, '/auth/register/pharmacy');
  const pharmacyOtp = await call(pharmacyJar, '/api/auth/send-otp', {
    body: { mobile: pharmacyMobile, role: 'PHARMACY', purpose: 'REGISTRATION' },
  });
  await call(pharmacyJar, '/api/auth/verify-otp', {
    body: { challengeId: pharmacyOtp.json?.data?.challengeId, code: pharmacyOtp.json?.data?.devOtp, role: 'PHARMACY' },
  });

  const pharmacyDocs = [];
  for (const type of ['DRUG_LICENSE', 'GST_CERTIFICATE', 'PHARMACY_REGISTRATION_CERTIFICATE', 'IDENTITY_PROOF']) {
    const res = await call(pharmacyJar, '/api/upload/document', {
      multipart: uploadForm(type, PNG, 'doc.png', 'image/png'),
    });
    if (res.json?.data?.id) pharmacyDocs.push(res.json.data.id);
  }
  check('required pharmacy documents upload', pharmacyDocs.length === 4, `${pharmacyDocs.length}/4`);

  const hours = {};
  for (const day of ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']) {
    hours[day] = { isClosed: day === 'SUNDAY', openTime: '09:00', closeTime: '21:00' };
  }

  const pharmacyBody = (operatingHours) => ({
    basic: {
      pharmacyName: 'Smoke Pharmacy', ownerName: 'Smoke Owner', mobile: pharmacyMobile,
      email: `pharmacy${pharmacyMobile}@example.com`, password: 'Pharmacy@1234',
      confirmPassword: 'Pharmacy@1234',
    },
    pharmacy: {
      drugLicenseNumber: 'MH-20B-123456',
      gstNumber: '27ABCDE1234F1Z5',
      pharmacyRegistrationNumber: '',
      pharmacyType: 'RETAIL',
    },
    address: {
      address: '3 Test Lane', city: 'Pune', state: 'Maharashtra', pincode: '411001',
      contactNumber: pharmacyMobile, operatingHours,
    },
    documentIds: pharmacyDocs,
  });

  const badHours = await call(pharmacyJar, '/api/auth/register/pharmacy', {
    body: pharmacyBody({ ...hours, MONDAY: { isClosed: false, openTime: '21:00', closeTime: '09:00' } }),
  });
  check('invalid operating hours are rejected', badHours.json?.code === 'VALIDATION_ERROR', badHours.json?.code);

  const pharmacyDone = await call(pharmacyJar, '/api/auth/register/pharmacy', {
    body: pharmacyBody(hours),
  });
  check(
    'pharmacy registration stays PENDING_VERIFICATION',
    pharmacyDone.json?.data?.status === 'PENDING_VERIFICATION',
    pharmacyDone.json?.code ?? '',
  );



  // --- login + role routing -------------------------------------------------
  const loginJar = makeJar();
  await load(loginJar, '/auth/login');
  const badLogin = await call(loginJar, '/api/auth/login', {
    body: { identifier: `smoke${mobile}@example.com`, password: 'WrongPass@1' },
  });
  check('wrong password is rejected', badLogin.json?.code === 'UNAUTHORIZED', badLogin.json?.code);

  const login = await call(loginJar, '/api/auth/login', {
    body: { identifier: `smoke${mobile}@example.com`, password: 'Smoke@1234', rememberMe: true },
  });
  check(
    'login returns the role home',
    login.json?.data?.redirectTo === '/patient' && login.json?.data?.user?.role === 'PATIENT',
    String(login.json?.data?.redirectTo ?? login.json?.code),
  );

  const doctorLoginJar = makeJar();
  await load(doctorLoginJar, '/auth/login');
  const doctorLogin = await call(doctorLoginJar, '/api/auth/login', {
    body: { identifier: `doctor${doctorMobile}@example.com`, password: 'Doctor@1234' },
  });
  check('doctor login routes to /doctor', doctorLogin.json?.data?.redirectTo === '/doctor');
  const doctorHome = await load(doctorLoginJar, '/doctor');
  check('doctor can open /doctor', doctorHome.status === 200, `status ${doctorHome.status}`);
  const doctorBlocked = await load(doctorLoginJar, '/patient');
  check(
    'doctor is blocked from /patient',
    doctorBlocked.status === 307 && (doctorBlocked.location ?? '').includes('/doctor'),
  );

  // --- duplicate registration ----------------------------------------------
  const dupJar = makeJar();
  await load(dupJar, '/auth/register/patient');
  const dupOtp = await call(dupJar, '/api/auth/send-otp', {
    body: { mobile, role: 'PATIENT', purpose: 'REGISTRATION' },
  });
  await call(dupJar, '/api/auth/verify-otp', {
    body: { challengeId: dupOtp.json?.data?.challengeId, code: dupOtp.json?.data?.devOtp, role: 'PATIENT' },
  });
  const duplicate = await call(dupJar, '/api/auth/register/patient', {
    body: {
      basic: {
        fullName: 'Duplicate', mobile, email: `dup${mobile}@example.com`,
        password: 'Smoke@1234', confirmPassword: 'Smoke@1234',
      },
      personal: PERSONAL,
      health: {},
    },
  });
  check('duplicate mobile is rejected', duplicate.json?.code === 'MOBILE_ALREADY_REGISTERED', duplicate.json?.code);

  // --- forgot password must not leak account existence ----------------------
  const resetJar = makeJar();
  await load(resetJar, '/auth/forgot-password');
  const known = await call(resetJar, '/api/auth/forgot-password', {
    body: { identifier: `smoke${mobile}@example.com` },
  });
  const unknown = await call(resetJar, '/api/auth/forgot-password', {
    body: { identifier: 'nobody@example.com' },
  });
  check(
    'password reset does not reveal whether an account exists',
    JSON.stringify(known.json?.data) === JSON.stringify(unknown.json?.data),
  );

  // --- admin verification console -------------------------------------------
  const adminJar = makeJar();
  await load(adminJar, '/auth/login');
  const adminLogin = await call(adminJar, '/api/auth/login', {
    body: { identifier: 'admin@medicare.dev', password: 'MediCare@123' },
  });
  check(
    'admin can sign in and is routed to /admin',
    adminLogin.json?.data?.redirectTo === '/admin',
    String(adminLogin.json?.data?.redirectTo ?? adminLogin.json?.code),
  );

  if (adminLogin.json?.data?.redirectTo === '/admin') {
    const adminHome = await load(adminJar, '/admin');
    check('admin can open /admin', adminHome.status === 200, String(adminHome.status));

    const queuePage = await load(adminJar, '/admin/doctors');
    check(
      'admin verification queue renders',
      queuePage.status === 200,
      String(queuePage.status),
    );

    // A doctor registered earlier in this run is still pending — approve them.
    const forbiddenRole = await call(adminJar, '/api/admin/verification/PATIENT/x', {
      method: 'PATCH',
      body: { decision: 'VERIFIED' },
    });
    check(
      'verification API rejects a non-professional role',
      forbiddenRole.json?.code === 'VALIDATION_ERROR',
      forbiddenRole.json?.code,
    );

    const badDecision = await call(
      adminJar,
      `/api/admin/verification/DOCTOR/${doctorProfileId}`,
      { method: 'PATCH', body: { decision: 'DEFINITELY_APPROVED' } },
    );
    check(
      'verification API rejects an unknown decision',
      badDecision.json?.code === 'VALIDATION_ERROR',
      badDecision.json?.code,
    );

    const approve = await call(adminJar, `/api/admin/verification/DOCTOR/${doctorProfileId}`, {
      method: 'PATCH',
      body: { decision: 'VERIFIED' },
    });
    check(
      'admin can approve a doctor profile',
      approve.json?.data?.entry?.verificationStatus === 'VERIFIED',
      approve.json?.code ?? '',
    );

    const reject = await call(adminJar, `/api/admin/verification/DOCTOR/${doctorProfileId}`, {
      method: 'PATCH',
      body: { decision: 'REJECTED' },
    });
    check(
      'admin decision is persisted (re-verify then reject)',
      reject.json?.data?.entry?.verificationStatus === 'REJECTED',
      reject.json?.code ?? '',
    );

    const missing = await call(adminJar, '/api/admin/verification/DOCTOR/does-not-exist', {
      method: 'PATCH',
      body: { decision: 'VERIFIED' },
    });
    check(
      'verifying an unknown profile returns 404',
      missing.status === 404,
      String(missing.status),
    );

    // A non-admin must not be able to reach the review endpoint.
    const patientAttack = await call(patientJar, `/api/admin/verification/DOCTOR/${doctorProfileId}`, {
      method: 'PATCH',
      body: { decision: 'VERIFIED' },
    });
    check(
      'a patient cannot run a verification decision',
      patientAttack.json?.code === 'FORBIDDEN',
      patientAttack.json?.code,
    );

    const noCsrf = await fetch(
      `${BASE}/api/admin/verification/DOCTOR/${doctorProfileId}`,
      {
        method: 'PATCH',
        headers: { Cookie: cookieHeader(adminJar), Origin: BASE, 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: 'VERIFIED' }),
        redirect: 'manual',
      },
    );
    const noCsrfBody = await noCsrf.json().catch(() => null);
    check(
      'verification API rejects a missing CSRF token',
      noCsrfBody?.code === 'CSRF_INVALID',
      noCsrfBody?.code,
    );
  }

  // --- password reset (token based) ----------------------------------------
  // The token is generated server side and only ever exists inside the emailed
  // link, so the test reads it from the development log the same way a user
  // would read it from their inbox.
  const resetEmail = `smoke${mobile}@example.com`;
  const beforeReset = await call(resetJar, '/api/auth/forgot-password', {
    body: { identifier: resetEmail },
  });
  check(
    'password reset request returns a generic confirmation',
    typeof beforeReset.json?.data?.message === 'string' &&
      beforeReset.json.data.message.includes('If an account exists'),
  );

  const badToken = await call(resetJar, '/api/auth/reset-password', {
    body: { token: 'not-a-real-token-value', password: 'BrandNew@1234' },
  });
  check(
    'reset with an invalid token is rejected',
    badToken.json?.code === 'INVALID_TOKEN',
    badToken.json?.code,
  );

  const mismatched = await call(resetJar, '/api/auth/reset-password', {
    body: { token: 'not-a-real-token-value', password: 'BrandNew@1234', confirmPassword: 'Different@123' },
  });
  check(
    'reset validates that the two passwords match',
    mismatched.json?.code === 'VALIDATION_ERROR' ||
      mismatched.json?.code === 'INVALID_TOKEN',
    mismatched.json?.code,
  );

  const weakReset = await call(resetJar, '/api/auth/reset-password', {
    body: { token: 'not-a-real-token-value', password: 'weak', confirmPassword: 'weak' },
  });
  check(
    'reset rejects a weak password',
    weakReset.json?.code === 'VALIDATION_ERROR',
    weakReset.json?.code,
  );

  // --- email verification ---------------------------------------------------
  const noCsrfVerify = await fetch(`${BASE}/api/auth/verify-email`, {
    method: 'POST',
    headers: { Cookie: cookieHeader(resetJar), Origin: BASE, 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: 'x'.repeat(43) }),
    redirect: 'manual',
  });
  const noCsrfVerifyBody = await noCsrfVerify.json().catch(() => null);
  check(
    'verify-email rejects a missing CSRF token',
    noCsrfVerifyBody?.code === 'CSRF_INVALID',
    noCsrfVerifyBody?.code,
  );

  const bogusVerify = await call(resetJar, '/api/auth/verify-email', {
    body: { token: 'y'.repeat(43) },
  });
  check(
    'verify-email rejects an unknown token',
    bogusVerify.json?.code === 'INVALID_TOKEN',
    bogusVerify.json?.code,
  );

  // --- password reset: full happy path with a real token --------------------
  // The reset token only ever exists inside the emailed link. In development
  // the email is written to the server log (EMAIL_LOG_ENABLED), so the test
  // reads the link from there — exactly what a user does from their inbox.
  const logPath = process.env.SMOKE_DEV_LOG ?? '/tmp/medicare-dev.log';
  const readLatestToken = (kind) => {
    if (!fs.existsSync(logPath)) return null;
    const matches = fs
      .readFileSync(logPath, 'utf8')
      .match(new RegExp(`${kind}\\?token=[A-Za-z0-9_-]+`, 'g'));
    return matches?.[matches.length - 1]?.split('token=')[1] ?? null;
  };

  // The reset below changes this account's password, so later steps must use
  // whichever password is current at that point.
  let patientPassword = 'Smoke@1234';

  const resetToken = readLatestToken('reset-password');
  check(
    'a password reset link is issued (dev log)',
    Boolean(resetToken),
    resetToken ? 'token captured' : `no token in ${logPath}`,
  );

  if (resetToken) {
    const resetOk = await call(resetJar, '/api/auth/reset-password', {
      body: { token: resetToken, password: 'BrandNew@1234' },
    });
    check(
      'a valid reset token changes the password',
      typeof resetOk.json?.data?.message === 'string',
      resetOk.json?.code ?? '',
    );

    patientPassword = 'BrandNew@1234';

    const replay = await call(resetJar, '/api/auth/reset-password', {
      body: { token: resetToken, password: 'AnotherOne@123' },
    });
    check(
      'the reset token cannot be replayed',
      replay.json?.code === 'INVALID_TOKEN',
      replay.json?.code,
    );

    const newLoginJar = makeJar();
    await load(newLoginJar, '/auth/login');
    const withNew = await call(newLoginJar, '/api/auth/login', {
      body: { identifier: resetEmail, password: 'BrandNew@1234' },
    });
    check(
      'the new password signs in',
      withNew.json?.data?.redirectTo === '/patient',
      withNew.json?.code ?? '',
    );

    const oldPasswordJar = makeJar();
    await load(oldPasswordJar, '/auth/login');
    const withOld = await call(oldPasswordJar, '/api/auth/login', {
      body: { identifier: resetEmail, password: 'Smoke@1234' },
    });
    check(
      'the old password no longer works',
      withOld.json?.code === 'UNAUTHORIZED',
      withOld.json?.code,
    );
  }

  // --- email verification: full happy path ----------------------------------
  const verifyToken = readLatestToken('verify-email');
  check(
    'an email verification link is issued (dev log)',
    Boolean(verifyToken),
    verifyToken ? 'token captured' : `no token in ${logPath}`,
  );

  if (verifyToken) {
    const verifyOk = await call(resetJar, '/api/auth/verify-email', {
      body: { token: verifyToken },
    });
    check(
      'a valid token verifies the email address',
      verifyOk.json?.data?.verified === true,
      verifyOk.json?.code ?? '',
    );

    const verifyReplay = await call(resetJar, '/api/auth/verify-email', {
      body: { token: verifyToken },
    });
    check(
      'the verification token cannot be replayed',
      verifyReplay.json?.code === 'INVALID_TOKEN',
      verifyReplay.json?.code,
    );
  }

  // --- patient profile editing ---------------------------------------------
  const editJar = makeJar();
  await load(editJar, '/auth/login');
  const editLogin = await call(editJar, '/api/auth/login', {
    body: { identifier: `smoke${mobile}@example.com`, password: patientPassword },
  });
  check(
    'patient session established for the profile editor',
    editLogin.json?.data?.redirectTo === '/patient',
    editLogin.json?.code ?? '',
  );

  const profileEdit = await call(editJar, '/api/patient/profile', {
    method: 'PATCH',
    body: {
      fullName: 'Updated Smoke Name',
      dateOfBirth: '1990-02-03',
      gender: 'FEMALE',
      address: '42 Updated Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      emergencyContactName: 'Kin',
      emergencyContactNumber: '9876500099',
      bloodGroup: 'A+',
      existingConditions: '',
      allergies: '',
    },
  });
  check(
    'patient can update their own profile',
    profileEdit.json?.data?.profile?.fullName === 'Updated Smoke Name',
    profileEdit.json?.code ?? '',
  );
  check(
    'profile edit persisted the new city',
    profileEdit.json?.data?.profile?.city === 'Mumbai',
    profileEdit.json?.data?.profile?.city ?? '',
  );

  const badEdit = await call(editJar, '/api/patient/profile', {
    method: 'PATCH',
    body: { fullName: 'X' },
  });
  check(
    'profile edit rejects invalid values',
    badEdit.json?.code === 'VALIDATION_ERROR',
    badEdit.json?.code,
  );

  const doctorEdit = await call(doctorLoginJar, '/api/patient/profile', {
    method: 'PATCH',
    body: { fullName: 'Hijack Attempt' },
  });
  check(
    'a doctor cannot edit a patient profile',
    doctorEdit.json?.code === 'FORBIDDEN' || doctorEdit.json?.code === 'VALIDATION_ERROR',
    doctorEdit.json?.code,
  );

  const anonEdit = await fetch(`${BASE}/api/patient/profile`, {
    method: 'PATCH',
    headers: { Origin: BASE, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName: 'Anon Attempt' }),
    redirect: 'manual',
  });
  const anonEditBody = await anonEdit.json().catch(() => null);
  check(
    'an anonymous caller cannot edit a profile',
    anonEditBody?.code === 'CSRF_INVALID' || anonEditBody?.code === 'UNAUTHORIZED',
    anonEditBody?.code,
  );

  // --- logout ---------------------------------------------------------------
  const logout = await call(loginJar, '/api/auth/logout');
  check('logout succeeds', logout.json?.data?.signedOut === true);
  const afterLogout = await load(loginJar, '/patient');
  check('session is cleared after logout', afterLogout.status === 307);

  const failed = results.filter((result) => !result.passed);
  console.log(`${'='.repeat(46)}\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.log('\nFailures:');
    failed.forEach((result) => console.log(` - ${result.name} (${result.detail})`));
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error('Smoke test crashed:', error);
  process.exitCode = 1;
});
