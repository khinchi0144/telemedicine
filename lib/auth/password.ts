import 'server-only';

import bcrypt from 'bcryptjs';

/**
 * Password hashing.
 *
 * bcrypt with a cost factor of 12 — deliberately slow and salted, so a leaked
 * database cannot be used to recover user passwords. Plain text passwords are
 * never stored, logged or returned anywhere in the application.
 */
const SALT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(
  plain: string,
  passwordHash: string | null | undefined,
): Promise<boolean> {
  if (!passwordHash) return false;
  try {
    return await bcrypt.compare(plain, passwordHash);
  } catch {
    return false;
  }
}
