# MediCare

**Your Health, Our Priority**

A production-quality telemedicine onboarding system built with **Next.js 16 (App Router)**,
**TypeScript**, **Tailwind CSS v4**, **Prisma** and **PostgreSQL**.

This phase delivers the complete authentication and registration experience for three
account types — **Patient**, **Doctor** and **Pharmacy** — on a single shared entry flow.
Video consultations, appointments, prescriptions, pharmacy ordering, inventory and payments
are intentionally *not* part of this phase; the architecture is designed so they can be
added later without rebuilding the auth system.

---

## Quick start

```bash
npm install

# 1. Create your local environment (no database or API keys required)
cp .env.example .env.local
openssl rand -base64 48            # put the output into SESSION_SECRET

# 2. Generate the Prisma client
npm run db:generate

# 3. Start the app
npm run dev
```

Open <http://localhost:3000>.

### Demo accounts (mock mode only)

| Role     | Mobile       | Email                   | Password       |
| -------- | ------------ | ----------------------- | -------------- |
| Patient  | `9876500001` | `patient@medicare.dev`  | `MediCare@123` |
| Doctor   | `9876500002` | `doctor@medicare.dev`   | `MediCare@123` |
| Pharmacy | `9876500003` | `pharmacy@medicare.dev` | `MediCare@123` |

In mock mode the OTP is returned by the API and shown in a development banner
(`MOCK_OTP=123456`). Mock OTP is **hard-disabled in production**.

### Connecting PostgreSQL

1. Set `DATABASE_URL` in `.env.local` (and `USE_MOCK_DB=false`).
2. `npm run db:generate`
3. `npm run db:deploy` (or `npx prisma migrate dev` while developing).

The app switches to the Prisma/PostgreSQL datastore automatically — the service layer
talks to the `DataStore` contract, so no code changes are required.

---

## Scripts

| Script                | Description                                |
| --------------------- | ------------------------------------------ |
| `npm run dev`         | Start the development server               |
| `npm run build`       | Production build                           |
| `npm start`           | Run the production build                   |
| `npm run lint`        | ESLint (next/core-web-vitals + typescript) |
| `npm run typecheck`   | `tsc --noEmit`                             |
| `npm run db:generate` | Generate the Prisma client                 |
| `npm run db:migrate`  | Create and apply a development migration   |
| `npm run db:deploy`   | Apply migrations (CI / production)         |
| `npm run db:studio`   | Prisma Studio                              |
| `npm run test:e2e`    | End-to-end smoke test against a running dev server |

### End-to-end smoke test

With `npm run dev` running in another terminal:

```bash
npm run test:e2e
```

It drives the real HTTP APIs across all three registration wizards (OTP issue and
verify, document upload, submission), login, logout, role based redirects and the
security guards (CSRF, cross-role access, document type permissions, file signature
validation, duplicate registration, account enumeration).

---

## Application flow

```
App open  →  /  (splash ~1.6 s)  →  /auth  →  /auth/login
                                           or
                                      /auth/register  →  role selection
                                          ├── /auth/register/patient
                                          ├── /auth/register/doctor
                                          └── /auth/register/pharmacy
```

All three roles share the same entry flow. The account type is chosen **only** inside the
registration wizard.

| Wizard   | Steps |
| -------- | ----- |
| Patient  | Basic details → OTP → Personal details → Health information (optional) → Success |
| Doctor   | Basic details → OTP → Professional details → Documents → Clinic details → Submitted |
| Pharmacy | Basic details → OTP → Pharmacy details → Documents → Address & hours → Submitted |

Patients are activated immediately. Doctors and pharmacies are created as
`PENDING_VERIFICATION` and are **never** auto-approved.


---

## Project structure

```
app/
  page.tsx                     Splash (redirects to /auth, or to the role home when signed in)
  auth/                        Landing, login, forgot password, role selection, 3 wizards
  patient/ doctor/ pharmacy/ admin/     Protected areas (layout level server guards)
  api/
    auth/    send-otp · verify-otp · login · logout · register/{patient,doctor,pharmacy}
             forgot-password · oauth/google[/callback]
    upload/  document
components/
  auth/       AuthLayout, AuthLanding, RoleCard, ProgressSteps, RegistrationStepShell,
              RegistrationLayout, FormField, PasswordField, MobileInput, OTPInput,
              OTPVerification, FileUpload, DocumentUploadList, SuccessScreen,
              LoginForm, GoogleButton, ForgotPasswordForm
  dashboard/  DashboardHeader, ComingSoon
  patient/ doctor/ pharmacy/  Role specific wizards + profile summaries
  ui/         shadcn-style primitives (button, input, select, radio-card, combobox, …)
  common/     Logo, SplashScreen, LegalPage
lib/
  auth/       session (JWT cookie), registration-ticket, dal, rbac, role-guard,
              csrf, password, oauth-config
  db/         store contract, Prisma repositories, memory (dev) store, seed
  services/   authService, patientService, doctorService, pharmacyService,
              documentService, otpService, sms-provider, userService
  storage/    private storage contract + local / S3 drivers
  validations/  common, auth, patient, doctor, pharmacy (Zod)
  constants/  app, roles, options, geo, documents
  utils/      env, errors, api-response, api-client, logger, crypto, rate-limit,
              format, file-signature, cn
prisma/       schema.prisma + migrations
proxy.ts      Fast optimistic route protection + CSRF cookie issuance
types/        Shared domain and API types
```

---

## Security model

| Concern | Implementation |
| ------- | -------------- |
| Passwords | bcrypt, cost factor 12. Never stored, logged or returned in plain text. |
| Sessions | Signed (HS256) JWT in an **HTTP-only, SameSite=Lax, Secure-in-production** cookie carrying only `sub`, `role` and `status`. |
| Role changes | Session claims are re-checked against the database on every server read, so a role or status change invalidates an existing cookie. |
| OTP | Cryptographically random, stored as a **salted hash**, deleted the moment it is consumed, auto-expired, max 5 attempts. |
| CSRF | Double-submit cookie + `Origin`/`Referer` check on every unsafe API call. |
| Authorisation | Enforced in the server layouts, the DAL and every API route — never only in the UI. |
| Rate limiting | OTP, login, registration and upload endpoints (`lib/utils/rate-limit.ts`; swap for Redis in multi-instance deployments). |
| File uploads | Role permission check, size limit and **real file-signature sniffing** (PDF/JPEG/PNG) — a renamed executable is rejected. |
| Document privacy | Files are written to private storage (`.storage/` locally, a private S3 bucket in production) and are never served from a public URL. |
| Logging | Structured logger that redacts passwords, OTPs, tokens and file contents. |
| Errors | Raw database/driver errors never reach the user; unexpected errors return a generic message. |
| Enumeration | Login and password reset always return the same generic message. |

### Two-layer route protection

1. `proxy.ts` — fast, optimistic redirects for anonymous users of `/patient`, `/doctor`,
   `/pharmacy`, `/admin`, and for signed-in users revisiting `/auth`. It also issues the
   CSRF cookie.
2. `app/<role>/layout.tsx` — the authoritative server-side guard, plus `requireApiUser()`
   in every API route.

---

## Data model

`prisma/schema.prisma` (PostgreSQL):

- **User** — role, email, mobile, passwordHash, status, verification flags
- **PatientProfile** · **DoctorProfile** · **PharmacyProfile** (+ operating hours)
- **Document** — type, file name, opaque storage key, mime type, size, verification status
- **OtpChallenge** — salted hash, expiry, attempts
- **LinkedAccount** — optional OAuth identity

Roles: `PATIENT · DOCTOR · PHARMACY · ADMIN`
Status: `ACTIVE · PENDING_VERIFICATION · REJECTED · SUSPENDED · DELETED`
Verification: `PENDING_VERIFICATION · VERIFIED · REJECTED · SUSPENDED`
Document status: `PENDING · APPROVED · REJECTED`

Later phases (appointments, consultations, prescriptions, orders, payments) are added as
**new models** and never require changes to the auth layer.

---

## Accessibility & responsiveness

- Labelled controls with `aria-invalid` / `aria-describedby` wired to inline errors
- `role="alert"` / `role="status"` for errors and outcomes
- Full keyboard support: OTP boxes (auto-advance, arrows, paste), visible focus rings,
  skip-to-content link
- Mobile-first single column, large touch targets, sticky action bar in the wizards
- Verified contrast for body text, placeholders and error states
- `prefers-reduced-motion` respected; animations are minimal by design

---

## What is intentionally not built yet

Video consultations · appointments · doctor search · prescriptions · pharmacy inventory ·
medicine availability · orders · payments · delivery · chat · AI diagnosis · health
analytics · the admin verification console. The dashboards are placeholders that show the
signed-in user, their verification status and the profile captured during registration.

