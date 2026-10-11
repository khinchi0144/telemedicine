/**
 * Headless layout audit for the three registration wizards.
 *
 * For every route and viewport it asserts:
 *   - no horizontal document overflow (no scrollbar)
 *   - the stepper never extends past the registration card
 *   - the card never overlaps the information panel
 *   - no step label is visually clipped
 *
 * Run with the dev server up:  node scripts/layout-audit.mjs
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const ROUTES = [
  '/auth/register/patient',
  '/auth/register/doctor',
  '/auth/register/pharmacy',
];
const WIDTHS = [1280, 1024, 768, 640, 390, 375];

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'medicare-layout-'));
const failures = [];
let checks = 0;

function check(name, passed, detail = '') {
  checks += 1;
  if (!passed) failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
  console.log(`${passed ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

async function launch(width, height) {
  const chrome = spawn(CHROME, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--remote-debugging-port=0',
    `--user-data-dir=${profile}`,
    `--window-size=${width},${height}`,
    'about:blank',
  ]);

  const endpoint = await new Promise((resolve, reject) => {
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

  return { chrome, ws, send };
}

const AUDIT = `(() => {
  const nav = document.querySelector('nav[aria-label]');
  const card = nav ? nav.closest('.rounded-2xl') : null;
  const aside = document.querySelector('aside');
  const de = document.documentElement;
  const navRect = nav ? nav.getBoundingClientRect() : null;
  const cardRect = card ? card.getBoundingClientRect() : null;
  const asideRect = aside ? aside.getBoundingClientRect() : null;
  const labels = [...document.querySelectorAll('nav[aria-label] ol li')].map(
    (li) => li.querySelector('span:last-of-type'),
  ).filter(Boolean);

  // Any element extending past the viewport, which would force a scrollbar.
  let widest = null;
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.right > de.clientWidth + 1) {
      if (!widest || r.right > widest.right) {
        widest = {
          right: Math.round(r.right),
          tag: el.tagName,
          cls: String(el.className || '').slice(0, 60),
        };
      }
    }
  }

  return JSON.stringify({
    scrollW: de.scrollWidth,
    clientW: de.clientWidth,
    docOverflow: de.scrollWidth > de.clientWidth + 1,
    hasNav: Boolean(nav),
    hasCard: Boolean(card),
    navRight: navRect ? Math.round(navRect.right) : null,
    navLeft: navRect ? Math.round(navRect.left) : null,
    cardRight: cardRect ? Math.round(cardRect.right) : null,
    cardLeft: cardRect ? Math.round(cardRect.left) : null,
    // Stepper escaping the card that should contain it.
    stepperOverCard: navRect && cardRect
      ? navRect.right > cardRect.right + 1 || navRect.left < cardRect.left - 1
      : false,
    // Card and information panel overlapping each other.
    overlap:
      cardRect && asideRect && asideRect.width > 0 && asideRect.height > 0
        ? cardRect.right > asideRect.left + 1 &&
          asideRect.top < cardRect.bottom - 1
        : false,
    // Labels whose text is cut off by their own box.
    clippedLabels: labels
      .filter((el) => el.scrollWidth > el.clientWidth + 1)
      .map((el) => el.textContent.trim()),
    widest,
  });
})()`;

async function measure(route, width, height) {
  const { chrome, ws, send } = await launch(width, height);

  const { result: { targetId } } = await send('Target.createTarget', {
    url: 'about:blank',
  });
  const { result: { sessionId } } = await send('Target.attachToTarget', {
    targetId,
    flatten: true,
  });

  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 768,
  }, sessionId);

  await send('Page.enable', {}, sessionId);
  await send('Runtime.enable', {}, sessionId);
  await send('Page.navigate', { url: `${BASE}${route}` }, sessionId);

  // Wait for hydration and the first paint of the stepper.
  await new Promise((r) => setTimeout(r, 2500));

  const { result } = await send(
    'Runtime.evaluate',
    { expression: AUDIT, returnByValue: true },
    sessionId,
  );

  ws.close();
  chrome.kill();
  return JSON.parse(result.result.value);
}

for (const route of ROUTES) {
  for (const width of WIDTHS) {
    const r = await measure(route, width, 900);
    const name = route.replace('/auth/register/', '').padEnd(8);
    const tag = `${name} @${String(width).padStart(4)}px`;

    check(
      `${tag} — no horizontal overflow`,
      !r.docOverflow,
      `scrollW=${r.scrollW} clientW=${r.clientW}` +
        (r.widest ? ` widest=${r.widest.tag}.${r.widest.cls}@${r.widest.right}` : ''),
    );
    check(
      `${tag} — stepper inside card`,
      !r.stepperOverCard,
      `nav=[${r.navLeft},${r.navRight}] card=[${r.cardLeft},${r.cardRight}]`,
    );
    check(`${tag} — panels do not overlap`, !r.overlap);
    check(
      `${tag} — no clipped step labels`,
      r.clippedLabels.length === 0,
      r.clippedLabels.join(', '),
    );
  }
}

console.log(`\n${checks - failures.length}/${checks} layout checks passed`);
if (failures.length) {
  console.log('\nFailures:');
  for (const f of failures) console.log(` - ${f}`);
  process.exitCode = 1;
}
// Chrome can still be flushing the profile directory when it exits, so retry
// briefly instead of crashing the run with ENOTEMPTY.
fs.rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
