/**
 * Renders every signed-in dashboard page for each demo role and asserts the
 * shared shell plus role-specific real data are present in the HTML.
 *
 *   node scripts/dashboard-render-check.mjs
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const PASSWORD = 'MediCare@123';

const ROLES = [
  {
    role: 'PATIENT',
    email: 'patient@medicare.dev',
    pages: {
      '/patient': ['O+', 'Bengaluru', 'Profile completeness'],
      '/patient/profile': ['O+', 'Bengaluru', 'Personal details'],
    },
  },
  {
    role: 'DOCTOR',
    email: 'doctor@medicare.dev',
    pages: {
      '/doctor': ['General Physician', 'KMC-123456', 'Document review'],
      '/doctor/profile': ['General Physician', 'KMC-123456', 'Professional details'],
    },
  },
  {
    role: 'PHARMACY',
    email: 'pharmacy@medicare.dev',
    pages: {
      '/pharmacy': ['MediCare Demo Pharmacy', 'KA-20B-778899', 'Documents on file'],
      '/pharmacy/profile': ['MediCare Demo Pharmacy', 'KA-20B-778899'],
      // The documents tab lists uploaded files, not the licence number.
      '/pharmacy/documents': ['Verification status', 'Documents'],
    },
  },
  {
    role: 'ADMIN',
    email: 'admin@medicare.dev',
    pages: {
      // The overview shows aggregate counts and charts, not individual names.
      '/admin': ['Professional profiles', 'Pending review', 'Doctor applications'],
      '/admin/doctors': ['Demo Doctor', 'Applications', 'KMC-123456'],
      '/admin/pharmacies': ['MediCare Demo Pharmacy', 'Applications', 'KA-20B-778899'],
    },
  },
];

const results = [];
function check(name, passed, detail = '') {
  results.push({ name, passed });
  console.log(`${passed ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

const jar = path.join(os.tmpdir(), `medicare-render-${Date.now()}.txt`);

function readJar() {
  if (!fs.existsSync(jar)) return [];
  return fs
    .readFileSync(jar, 'utf8')
    .split('\n')
    .filter((line) => line && !line.startsWith('#'));
}

function writeJar(lines) {
  fs.writeFileSync(jar, lines.join('\n') + '\n');
}

function upsert(pair) {
  const name = pair.split('=')[0];
  const lines = readJar().filter((line) => line.split('\t')[5] !== name);
  lines.push(`localhost\tFALSE\t/\tFALSE\t0\t${pair.replace('=', '\t')}`);
  writeJar(lines);
}

function cookieHeader() {
  return readJar()
    .map((line) => {
      const p = line.split('\t');
      return `${p[5]}=${p[6]}`;
    })
    .join('; ');
}

function csrf() {
  return /medicare_csrf=([^;]+)/.exec(cookieHeader())?.[1] ?? '';
}

async function loadPage(url) {
  const res = await fetch(`${BASE}${url}`, {
    redirect: 'manual',
    headers: { Cookie: cookieHeader() },
  });
  for (const c of res.headers.getSetCookie?.() ?? []) {
    const pair = c.split(';')[0];
    if (pair.startsWith('medicare_csrf=')) upsert(pair);
  }
  return { status: res.status, html: await res.text() };
}

async function login(email) {
  await loadPage('/auth/login');
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: {
      Cookie: cookieHeader(),
      Origin: BASE,
      'x-csrf-token': csrf(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ identifier: email, password: PASSWORD }),
    redirect: 'manual',
  });
  for (const c of res.headers.getSetCookie?.() ?? []) {
    const pair = c.split(';')[0];
    if (pair) upsert(pair);
  }
  return res.status;
}

console.log(`Dashboard render check → ${BASE}\n${'='.repeat(46)}`);

for (const entry of ROLES) {
  const jarBefore = fs.existsSync(jar) ? readJar().join('|') : '';
  const status = await login(entry.email);
  check(
    `${entry.role.padEnd(9)} signs in`,
    status === 200,
    String(status),
  );

  for (const page of Object.keys(entry.pages)) {
    const { status: code, html } = await loadPage(page);
    check(`${entry.role.padEnd(9)} ${page} renders`, code === 200, String(code));

    // Shared shell: sidebar + main landmark must be present.
    const hasShell =
      html.includes('aria-label="Primary"') || html.includes('id="main-content"');
    check(`${entry.role.padEnd(9)} ${page} has the app shell`, hasShell);

    const missing = entry.pages[page].filter((needle) => !html.includes(needle));
    check(
      `${entry.role.padEnd(9)} ${page} shows real datastore data`,
      missing.length === 0,
      missing.length ? `missing: ${missing.join(', ')}` : '',
    );
  }

  await fetch(`${BASE}/api/auth/logout`, {
    method: 'POST',
    headers: { Cookie: cookieHeader(), Origin: BASE, 'x-csrf-token': csrf() },
  });
  // Start each role from a clean jar.
  if (fs.existsSync(jar)) fs.writeFileSync(jar, '');
  void jarBefore;
}

fs.rmSync(jar, { force: true });

const failed = results.filter((r) => !r.passed);
console.log(`\n${'='.repeat(46)}\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) {
  console.log('\nFailures:');
  failed.forEach((f) => console.log(` - ${f.name}`));
  process.exitCode = 1;
}