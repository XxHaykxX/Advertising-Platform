"use server";

import { createApplication } from "@/lib/data/applications";

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

  if (!name) return { ok: false, error: "Please enter your name.", values };
  if (name.length > 200) return { ok: false, error: "Name is too long.", values };

  if (!email) return { ok: false, error: "Please enter your email.", values };
  if (email.length > 200) return { ok: false, error: "Email is too long.", values };
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Please enter a valid email address.", values };
  }

  if (message.length > 5000) return { ok: false, error: "Message is too long.", values };

  const projectIdRaw = String(formData.get("projectId") || "").trim();
  const projectId = projectIdRaw ? Number(projectIdRaw) : undefined;
  const projectTitle = String(formData.get("projectTitle") || "").trim().slice(0, 200) || undefined;

  await createApplication({
    name,
    email,
    message: message || undefined,
    projectId: projectId !== undefined && !Number.isNaN(projectId) ? projectId : undefined,
    projectTitle,
  });

  return { ok: true };
}
