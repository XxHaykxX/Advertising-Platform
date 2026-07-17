"use server";

import { notifyContactMessage } from "@/lib/mail";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";

export interface LeadValues {
  name: string;
  email: string;
  message: string;
}

export interface LeadState {
  ok: boolean;
  error?: string;
  values?: LeadValues;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitLead(
  _prev: LeadState,
  formData: FormData,
): Promise<LeadState> {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const message = String(formData.get("message") || "").trim();
  const values: LeadValues = { name, email, message };

  const t = makeUI(await getLocale());

  if (!name) return { ok: false, error: t("formErr.name"), values };
  if (name.length > 200) return { ok: false, error: t("formErr.nameLong"), values };

  if (!email) return { ok: false, error: t("formErr.email"), values };
  if (email.length > 200) return { ok: false, error: t("formErr.emailLong"), values };
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: t("formErr.emailInvalid"), values };
  }

  if (message.length > 5000) return { ok: false, error: t("formErr.messageLong"), values };

  const projectTitle = String(formData.get("projectTitle") || "").trim().slice(0, 200) || undefined;

  // Used to land in the Application table alongside placement leads; that
  // inbox is gone now (#37), so this stays the public "get in touch" form
  // but just notifies the admin by email instead. Best-effort: a flaky SMTP
  // hop must not turn into a broken "message sent" screen for the visitor.
  try {
    await notifyContactMessage({ name, email, message: message || undefined, projectTitle });
  } catch (err) {
    console.error("[leads] failed to notify admin of contact message:", err);
  }

  return { ok: true };
}
