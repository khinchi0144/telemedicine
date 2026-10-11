/**
 * Responsive + content audit for the registration selection page.
 *
 * For every viewport it asserts:
 *   - no horizontal document overflow
 *   - all three account cards render and stay inside the viewport
 *   - desktop lays the cards out in ONE row, mobile stacks them
 *   - the CTA of every card is on screen and not clipped
 *   - the right hand ecosystem visual only appears on large screens
 *   - the required marketing copy is present
 *
 *   node scripts/register-page-audit.mjs
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const ROUTE = '/auth/register';

const VIEWPORTS = [
  { width: 1440, height: 900, label: 'desktop' },
  { width: 1280, height: 800, label: 'laptop' },
  { width: 1024, height: 768, label: 'tablet-land' },
  { width: 768, height: 1024, label: 'tablet' },
  { width: 640, height: 900, label: 'phablet' },
  { width: 390, height: 844, label: 'mobile' },
  { width: 360, height: 740, label: 'mobile-sm' },
];

const REQUIRED_COPY = [
  'Your Health Journey',
  'Starts Here.',
  'Connect with trusted doctors',
  'Create Your Account',
  'Choose your account type to continue.',
  'Book online consultations.',
  'Manage patient appointments.',
  'Manage medicine inventory.',
  'One Platform. Complete Healthcare.',
];

const profiles = [];
const failures = [];
let checks = 0;

function check(name, passed, detail = '') {
  checks += 1;
  if (!passed) failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
  console.log(`${passed ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

const AUDIT = `(() => {
  const doc = document.documentElement;
  const cards = Array.from(document.querySelectorAll('a[href^="/auth/register/"]'))
    .filter((a) => a.className.includes('animated-ring'));
  const rects = cards.map((card) => {
    const box = card.getBoundingClientRect();
    const cta = card.querySelector('span.mt-auto');
    const ctaBox = cta ? cta.getBoundingClientRect() : null;
    return {
      href: card.getAttribute('href'),
      left: Math.round(box.left),
      right: Math.round(box.right),
      top: Math.round(box.top),
      ctaLeft: ctaBox ? Math.round(ctaBox.left) : null,
      ctaRight: ctaBox ? Math.round(ctaBox.right) : null,
      ctaVisible: ctaBox ? ctaBox.width > 0 && ctaBox.height > 0 : false,
    };
  });
  const aside = document.querySelector('aside[aria-label]');
  return {
    scrollW: doc.scrollWidth,
    clientW: doc.clientWidth,
    cardCount: rects.length,
    rects,
    asideVisible: aside ? getComputedStyle(aside).display !== 'none' : false,
    html: document.body.innerHTML,
  };
})()`;

async function measure(viewport) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'medicare-register-'));
  profiles.push(profile);

  const chrome = spawn(CHROME, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--remote-debugging-port=0',
    `--user-data-dir=${profile}`,
    'about:blank',
  ]);

  const endpoint = await new Promise((resolve, reject) => {
    // Chrome can emit the URL across several stderr chunks, so accumulate.
    let buffer = '';
    const timer = setTimeout(() => reject(new Error('Chrome did not start')), 20000);
    chrome.stderr.on('data', (chunk) => {
      buffer += chunk.toString();
      const match = /ws:\/\/[^\s]+/.exec(buffer);
      if (match) {
        clearTimeout(timer);
        resolve(match[0]);
      }
    });
    chrome.on('error', reject);
  });

  const ws = new WebSocket(endpoint);
  await new Promise((resolve) => ws.addEventListener('open', resolve));

  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
    }
  });

  const send = (method, params = {}, sessionId) =>
    new Promise((resolve) => {
      const messageId = ++id;
      pending.set(messageId, resolve);
      ws.send(JSON.stringify({ id: messageId, method, params, sessionId }));
    });

  const { result: target } = await send('Target.createTarget', { url: 'about:blank' });
  const { result: attach } = await send('Target.attachToTarget', {
    targetId: target.targetId,
    flatten: true,
  });
  const sessionId = attach.sessionId;

  // Real viewport emulation so media queries match the target breakpoint.
  await send(
    'Emulation.setDeviceMetricsOverride',
    {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      mobile: viewport.width < 768,
    },
    sessionId,
  );

  await send('Page.enable', {}, sessionId);
  await send('Runtime.enable', {}, sessionId);
  await send('Page.navigate', { url: `${BASE}${ROUTE}` }, sessionId);

  // Wait for hydration and the first paint (framer-motion entrance).
  await new Promise((resolve) => setTimeout(resolve, 3000));

  const { result } = await send(
    'Runtime.evaluate',
    { expression: AUDIT, returnByValue: true },
    sessionId,
  );

  ws.close();
  chrome.kill();
  // `returnByValue` hands back the real object, not a JSON string.
  return result.result.value;
}

console.log(`Registration page audit → ${BASE}${ROUTE}\n${'='.repeat(52)}`);

for (const viewport of VIEWPORTS) {
  const r = await measure(viewport);
  const tag = `${viewport.label.padEnd(12)} @${String(viewport.width).padStart(4)}px`;
  // Desktop: cards in one row beside the visual. Tablet: 2 + 1 grid.
  // Mobile: fully stacked, visual hidden.
  const expectSingleRow = viewport.width >= 1024;
  const expectRows = viewport.width >= 1024 ? 1 : viewport.width >= 640 ? 2 : 3;

  check(
    `${tag} — no horizontal overflow`,
    r.scrollW <= r.clientW,
    `scrollW=${r.scrollW} clientW=${r.clientW}`,
  );

  check(`${tag} — three account cards`, r.cardCount === 3, `found ${r.cardCount}`);

  const offscreen = r.rects.filter(
    (rect) => rect.left < -1 || rect.right > viewport.width + 1,
  );
  check(
    `${tag} — cards inside the viewport`,
    offscreen.length === 0,
    offscreen.map((o) => `${o.href}@${o.left}-${o.right}`).join(', '),
  );

  const rows = new Set(r.rects.map((rect) => rect.top));
  check(
    `${tag} — card grid has ${expectRows} row${expectRows === 1 ? '' : 's'}`,
    rows.size === expectRows,
    `distinct top offsets: ${rows.size}`,
  );

  const clippedCta = r.rects.filter(
    (rect) =>
      !rect.ctaVisible || rect.ctaLeft < -1 || rect.ctaRight > viewport.width + 1,
  );
  check(
    `${tag} — every CTA is visible`,
    clippedCta.length === 0,
    clippedCta.map((c) => c.href).join(', '),
  );

  check(
    `${tag} — ecosystem visual ${expectSingleRow ? 'shown' : 'hidden'}`,
    r.asideVisible === expectSingleRow,
  );
}

const final = await measure(VIEWPORTS[0]);
const missing = REQUIRED_COPY.filter((line) => !final.html.includes(line));
check(
  'required copy is present',
  missing.length === 0,
  missing.length ? `missing: ${missing.join(' | ')}` : '',
);

for (const profile of profiles) {
  fs.rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
}

console.log(`\n${'='.repeat(52)}\n${checks - failures.length}/${checks} checks passed`);
if (failures.length) {
  console.log('\nFailures:');
  for (const f of failures) console.log(` - ${f}`);
  process.exitCode = 1;
}