/** Formatting helpers shared by the UI. Safe on both server and client. */

/** Normalises a mobile number to 10 digits (accepts +91 / 0 prefixes). */
export function normalizeMobile(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
}

/** +91 98765 43210 style display value. */
export function formatMobile(value: string): string {
  const digits = normalizeMobile(value);
  if (digits.length !== 10) return value;
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}

/** Partially masked mobile number, safe to show on screen and in logs. */
export function maskMobile(value: string): string {
  const digits = normalizeMobile(value);
  if (digits.length < 4) return '••••';
  return `+91 ${digits.slice(0, 2)}•••••${digits.slice(-3)}`;
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb < 10 ? 1 : 0)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
}

/** 00:30 / 01:05 countdown formatting. */
export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/** "12 Mar 1990" style date, safe for SSR (no locale surprises). */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return `${String(date.getDate()).padStart(2, '0')} ${
    months[date.getMonth()]
  } ${date.getFullYear()}`;
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  const time = date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return `${formatDate(date)}, ${time}`;
}

/** Human readable label for verification / account status values. */
export function humanizeStatus(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
/** Human readable label for the document type enums used at registration. */
export function prettyDocumentType(value: string): string {
  return humanizeStatus(value);
}

/** ₹12.50 style display for prices stored in paise. */
export function formatInr(paise: number): string {
  if (!Number.isFinite(paise)) return '—';
  const rupees = paise / 100;
  return `₹${rupees.toLocaleString('en-IN', {
    minimumFractionDigits: rupees % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}
