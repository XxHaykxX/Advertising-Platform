"use server";

import { revalidatePath } from "next/cache";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/auth/require";
import { sendMail, siteUrl } from "@/lib/mail";

/* Admin broadcast (#push/email) — a super-admin composes one message and fans
   it out to a filtered set of members, either as an in-app notification
   (type BROADCAST) or as an email. Every action re-gates requireSuperadmin(). */

export type BroadcastAudience = "all" | "brands" | "creators";

export type BroadcastState = { ok?: true; error?: string; count?: number };

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

/** Map the audience selector to the member roles it targets. Broadcasts only
 *  ever reach self-serve members (BRAND / CREATOR), never staff. */
function audienceRoles(audience: string): Role[] {
  switch (audience) {
    case "brands":
      return ["BRAND"];
    case "creators":
      return ["CREATOR"];
    default:
      return ["BRAND", "CREATOR"];
  }
}

/** Recipients for an audience: approved, active members of the target roles. */
function recipientWhere(audience: string) {
  return {
    role: { in: audienceRoles(audience) },
    status: "APPROVED" as const,
    isActive: true,
  };
}

/** Fan out an in-app notification (type BROADCAST) to every targeted member. */
export async function sendPushBroadcast(
  _prev: BroadcastState,
  fd: FormData,
): Promise<BroadcastState> {
  await requireSuperadmin();

  const audience = str(fd, "audience") || "all";
  const title = str(fd, "title");
  const message = str(fd, "message");
  // Only accept an internal (relative) link — it is pushed via router.push on
  // every recipient's client, so an external URL would be an open redirect.
  const linkRaw = str(fd, "link");
  const link = linkRaw.startsWith("/") ? linkRaw : "";

  if (!message) return { error: "Введите текст сообщения" };

  const recipients = await prisma.user.findMany({
    where: recipientWhere(audience),
    select: { id: true },
  });
  if (recipients.length === 0) return { error: "Нет получателей по этому фильтру" };

  const data = JSON.stringify({ title: title || undefined, message });
  await prisma.notification.createMany({
    data: recipients.map((r) => ({
      userId: r.id,
      type: "BROADCAST",
      data,
      link: link || "",
    })),
  });

  // Refresh both member notification feeds so badges/lists update.
  revalidatePath("/account/notifications");
  revalidatePath("/account/brand/notifications");
  return { ok: true, count: recipients.length };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Simple branded email wrapper around the admin's plain-text message. */
function broadcastEmail(subject: string, message: string): { subject: string; html: string; text: string } {
  const body = escapeHtml(message).replace(/\n/g, "<br>");
  const html = `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
  <h1 style="font-size:20px;margin:0 0 16px">${escapeHtml(subject)}</h1>
  <div style="font-size:15px;line-height:1.6">${body}</div>
  <p style="margin-top:24px;font-size:13px;color:#666">
    <a href="${siteUrl()}" style="color:#666">igovazd.am</a>
  </p>
</div>`;
  return { subject, html, text: message };
}

/** Fan out an email to every targeted member. sendMail is a warn-only no-op
 *  when SMTP is unconfigured, so this never throws on a missing transport —
 *  the returned count reflects successful deliveries. */
export async function sendEmailBroadcast(
  _prev: BroadcastState,
  fd: FormData,
): Promise<BroadcastState> {
  await requireSuperadmin();

  const audience = str(fd, "audience") || "all";
  const subject = str(fd, "subject");
  const message = str(fd, "message");

  if (!subject) return { error: "Введите тему письма" };
  if (!message) return { error: "Введите текст сообщения" };

  const recipients = await prisma.user.findMany({
    where: recipientWhere(audience),
    select: { email: true },
  });
  if (recipients.length === 0) return { error: "Нет получателей по этому фильтру" };

  const tpl = broadcastEmail(subject, message);
  // Fan out in small sequential batches — the transport isn't pooled and this
  // is a shared Hostinger SMTP mailbox, so blasting hundreds of parallel
  // connections would trip rate limits and silently drop mail. Count only the
  // sends the transport accepted.
  const CHUNK = 8;
  let count = 0;
  for (let i = 0; i < recipients.length; i += CHUNK) {
    const batch = recipients.slice(i, i + CHUNK);
    const results = await Promise.allSettled(
      batch.map((r) => sendMail({ to: r.email, ...tpl })),
    );
    count += results.filter(
      (res) => res.status === "fulfilled" && res.value.ok,
    ).length;
  }

  return { ok: true, count };
}
