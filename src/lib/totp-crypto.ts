// AES-256-GCM encryption for TOTP secrets at rest.
// Architecture ADR-003 + S-08.1 notes: TOTP secret must be encrypted with
// TWOFACTOR_ENCRYPTION_KEY before persisting to User.twoFactorSecret.

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12; // 96-bit IV is the GCM standard
const TAG_BYTES = 16;

function getKey(): Buffer {
  const raw = process.env.TWOFACTOR_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      'TWOFACTOR_ENCRYPTION_KEY is not set. Generate one with `openssl rand -base64 32` and add it to .env.'
    );
  }
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) {
    throw new Error(
      `TWOFACTOR_ENCRYPTION_KEY must decode to 32 bytes (got ${key.length}).`
    );
  }
  return key;
}

/** Encrypt a TOTP secret. Returns base64(iv || tag || ciphertext). */
export function encryptSecret(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString('base64');
}

/** Decrypt a TOTP secret previously produced by encryptSecret(). */
export function decryptSecret(payload: string): string {
  const key = getKey();
  const buf = Buffer.from(payload, 'base64');
  if (buf.length < IV_BYTES + TAG_BYTES + 1) {
    throw new Error('Encrypted payload is too short to be valid.');
  }
  const iv = buf.subarray(0, IV_BYTES);
  const tag = buf.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
  const ciphertext = buf.subarray(IV_BYTES + TAG_BYTES);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return plaintext.toString('utf8');
}
