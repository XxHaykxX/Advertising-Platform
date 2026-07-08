"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export interface ApplicationValues {
  name: string;
  phone: string;
  email: string;
  company: string;
  message: string;
}

export interface ApplicationState {
  ok: boolean;
  error?: string;
  values?: ApplicationValues;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ── In-memory submit rate limit (per IP) — mirrors the legacy site's
   /api/applications route so filmmakers can't be spammed with fake leads. ── */
const WINDOW_MS = 10 * 60 * 1000;
const MAX = 5;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || rec.resetAt < now) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  rec.count += 1;
  return rec.count > MAX;
}

async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  return (fwd ? fwd.split(",")[0] : h.get("x-real-ip"))?.trim() || "local";
}

export async function submitApplication(
  _prev: ApplicationState,
  formData: FormData,
): Promise<ApplicationState> {
  // Honeypot: bots fill the hidden "website" field → silently accept, store nothing.
  const honeypot = String(formData.get("website") || "").trim();
  if (honeypot) return { ok: true };

  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const company = String(formData.get("company") || "").trim();
  const message = String(formData.get("message") || "").trim();
  const consent = formData.get("consent") === "on";
  const values: ApplicationValues = { name, phone, email, company, message };

  if (name.length < 2) return { ok: false, error: "Please enter your name.", values };
  if (name.length > 200) return { ok: false, error: "Name is too long.", values };

  if (!phone) return { ok: false, error: "Please enter your phone number.", values };
  if (phone.length > 40) return { ok: false, error: "Phone number is too long.", values };

  if (email) {
    if (email.length > 200) return { ok: false, error: "Email is too long.", values };
    if (!EMAIL_RE.test(email)) {
      return { ok: false, error: "Please enter a valid email address.", values };
    }
  }

  if (message.length > 5000) return { ok: false, error: "Message is too long.", values };

  if (!consent) {
    return { ok: false, error: "Please confirm you agree to be contacted.", values };
  }

  if (rateLimited(await clientIp())) {
    return { ok: false, error: "Too many requests. Please try again later.", values };
  }

  const projectIdRaw = String(formData.get("projectId") || "").trim();
  const projectId = projectIdRaw ? Number(projectIdRaw) : undefined;
  const projectTitle = String(formData.get("projectTitle") || "").trim().slice(0, 200) || undefined;

  await prisma.application.create({
    data: {
      name,
      phone,
      email: email || undefined,
      company: company || undefined,
      message: message || undefined,
      projectId: projectId !== undefined && !Number.isNaN(projectId) ? projectId : undefined,
      projectTitle,
    },
  });

  return { ok: true };
}
