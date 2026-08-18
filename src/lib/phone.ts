/* Phone validation, shared by the client fields and the server actions behind
   them. Deliberately NOT "server-only": the application dialog and the callback
   form disable their submit button with the same predicate the action rejects a
   direct POST with, and a rule that lives in two places drifts. It used to live
   in three — application-dialog.tsx (client), account/brand/actions.ts (server)
   and, by import, phone.test.ts, which had to reach into a "use client" module
   to test a pure function. */

/** Exact national-number lengths per dial code. Armenia is always 8 digits
 *  after +374 (+37499105115), so a number one digit short or long is a typo,
 *  not a variant — and a typo'd number is a lead nobody can call back.
 *  Codes not listed fall back to the loose international range. */
const PHONE_RULES: Array<{ code: string; digits: number }> = [{ code: "+374", digits: 8 }];

/** Armenia — the marketplace's home country, so an empty phone field starts
 *  here. Someone from elsewhere just types their own code over it. */
export const DEFAULT_DIAL_CODE = "+374";

/** Accepts an international number: a "+", a country code, then the national
 *  part. Separators (spaces, dashes, parens) are ignored. */
export function isValidPhone(value: string): boolean {
  const cleaned = value.replace(/[\s()-]/g, "");
  if (!/^\+[1-9]\d{6,15}$/.test(cleaned)) return false;
  const rule = PHONE_RULES.find((r) => cleaned.startsWith(r.code));
  if (rule) return cleaned.length === rule.code.length + rule.digits;
  return cleaned.length >= 8 && cleaned.length <= 16;
}
