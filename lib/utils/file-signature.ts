/**
 * File signature sniffing.
 *
 * The browser supplied MIME type is never trusted on its own: the first bytes
 * of the upload are checked so a renamed executable cannot be stored as a
 * "medical certificate".
 */

export type SniffedType =
  | 'application/pdf'
  | 'image/jpeg'
  | 'image/png'
  | 'application/octet-stream';

export function sniffMimeType(buffer: Buffer): SniffedType {
  if (buffer.length < 4) return 'application/octet-stream';

  // %PDF-
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return 'application/pdf';
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  return 'application/octet-stream';
}

export const ACCEPTED_MIME_TYPES: SniffedType[] = [
  'application/pdf',
  'image/jpeg',
  'image/png',
];

/** Strips directory information and unsafe characters from a file name. */
export function sanitizeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? 'document';
  const cleaned = base
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(-120);
  return cleaned || 'document';
}

/** Extension that matches the sniffed type (used for the storage key). */
export function extensionForMime(mime: SniffedType): string {
  switch (mime) {
    case 'application/pdf':
      return 'pdf';
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    default:
      return 'bin';
  }
}
