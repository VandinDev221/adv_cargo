import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export const CODE_LENGTH = 6;
export const CODE_EXPIRY_MS = 15 * 60 * 1000;
export const MAX_VERIFY_ATTEMPTS = 5;
export const RESEND_COOLDOWN_MS = 60 * 1000;

export function generateVerificationCode() {
  return crypto.randomInt(0, 10 ** CODE_LENGTH).toString().padStart(CODE_LENGTH, '0');
}

export async function hashVerificationCode(code) {
  return bcrypt.hash(code, 10);
}

export async function verifyCode(code, codeHash) {
  return bcrypt.compare(code, codeHash);
}

export function normalizeEmail(email) {
  return email.trim().toLowerCase();
}
