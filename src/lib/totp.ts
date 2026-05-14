// TOTP helpers: generate enrollment payload (secret + QR), verify a 6-digit
// code. Uses otplib v13 functional API (RFC 6238). Secrets persist via
// totp-crypto.ts; this module only sees plaintext base32 secrets while in
// memory during enroll/verify.

import { generateSecret, generateURI, verifySync } from 'otplib';
import QRCode from 'qrcode';

const ISSUER = 'Advertising Platform';

export interface EnrollmentPayload {
  secret: string;          // base32 (plaintext — must be encrypted before persist)
  otpauthUrl: string;      // canonical otpauth:// URL for QR scanners
  qrDataUrl: string;       // data: URL ready to drop into an <img src>
}

export async function generateEnrollment(label: string): Promise<EnrollmentPayload> {
  const secret = generateSecret();
  const otpauthUrl = generateURI({ issuer: ISSUER, label, secret });
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl, {
    margin: 1,
    width: 240,
    color: {
      dark: '#0a0a0f',
      light: '#ffffff',
    },
  });
  return { secret, otpauthUrl, qrDataUrl };
}

export function verifyCode(secret: string, code: string): boolean {
  // RFC 6238 §5.2 — accept ±1 step (30s) for clock skew tolerance.
  const result = verifySync({
    secret,
    token: code.trim(),
    epochTolerance: 30,
  });
  return result.valid;
}
