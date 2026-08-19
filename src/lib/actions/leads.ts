"use server";

import { notifyContactMessage } from "@/lib/mail";
import { getLocale } from "@/lib/data/locale";
import { isValidPhone } from "@/lib/phone";
import { makeUI } from "@/lib/i18n";

export interface LeadValues {
  name: string;
  /** E.164, the same shape the callback form collected — see phone.ts. */
  phone: string;
  message: string;
}

export interface LeadState {
  ok: boolean;
  error?: string;
  values?: LeadValues;
}

export async function submitLead(
  _prev: LeadState,
  formData: FormData,
): Promise<LeadState> {
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const message = String(formData.get("message") || "").trim();
  const values: LeadValues = { name, phone, message };

  const t = makeUI(await getLocale());

  if (!name) return { ok: false, error: t("formErr.name"), values };
  if (name.length > 200) return { ok: false, error: t("formErr.nameLong"), values };

  // A number, not an address, since 2026-08-19 (owner). isValidPhone is the
  // same predicate the field disables the button with — one rule, not two.
  if (!isValidPhone(phone)) return { ok: false, error: t("formErr.phone"), values };

  // Both contact forms mark this mandatory (the contact page always did, the
  // landing form joined it on 2026-08-03), so the action agrees rather than
  // accepting a blank lead from anything that skips the client check.
  if (!message) return { ok: false, error: t("formErr.message"), values };
  if (message.length > 5000) return { ok: false, error: t("formErr.messageLong"), values };

  const projectTitle = String(formData.get("projectTitle") || "").trim().slice(0, 200) || undefined;

  // Used to land in the Application table alongside placement leads; that
  // inbox is gone now (#37), so this stays the public "get in touch" form
  // but just notifies the admin by email instead. Best-effort: a flaky SMTP
  // hop must not turn into a broken "message sent" screen for the visitor.
  try {
    await notifyContactMessage({ name, phone, message, projectTitle });
  } catch (err) {
    console.error("[leads] failed to notify admin of contact message:", err);
  }

  return { ok: true };
}
