"use server";

import { prisma } from "@/lib/prisma";
import { notifyCallRequest } from "@/lib/mail";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";
import { isValidPhone } from "@/lib/phone";

export interface CallRequestValues {
  name: string;
  phone: string;
  comment: string;
}

export interface CallRequestState {
  ok: boolean;
  error?: string;
  values?: CallRequestValues;
}

export async function submitCallRequest(
  _prev: CallRequestState,
  formData: FormData,
): Promise<CallRequestState> {
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const comment = String(formData.get("comment") || "").trim();
  const values: CallRequestValues = { name, phone, comment };

  const locale = await getLocale();
  const t = makeUI(locale);

  if (!name) return { ok: false, error: t("formErr.name"), values };
  if (name.length > 200) return { ok: false, error: t("formErr.nameLong"), values };

  if (!isValidPhone(phone)) return { ok: false, error: t("formErr.phone"), values };

  if (comment.length > 2000) return { ok: false, error: t("formErr.messageLong"), values };

  // DB write first, email second (best-effort, see mail.ts): a dead SMTP hop
  // must not make the lead itself disappear along with the notification.
  await prisma.callRequest.create({
    data: { name, phone, comment: comment || null, locale },
  });

  try {
    await notifyCallRequest({ name, phone, comment: comment || undefined });
  } catch (err) {
    console.error("[call-request] failed to notify admin:", err);
  }

  return { ok: true };
}
