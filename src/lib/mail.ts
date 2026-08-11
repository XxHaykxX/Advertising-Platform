import "server-only";
import nodemailer from "nodemailer";
import { findAdChannelByCode } from "@/lib/ad-channels";
import { adSpacePath } from "@/lib/ad-space-url";

/* Hostinger SMTP email notifications (#22). Reads SMTP_HOST / SMTP_PORT /
   SMTP_SECURE / SMTP_USER / SMTP_PASS / MAIL_FROM from the environment; when
   the host/user/pass are absent the transporter is never created and
   sendMail() becomes a no-op (warns, doesn't throw) — so local dev without
   prod SMTP creds keeps working. A failed send never bubbles up: email is a
   side-effect of moderation actions, not a condition for them succeeding. */

type MailPayload = { to: string; subject: string; html: string; text: string };

function smtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

let cachedTransporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!smtpConfigured()) return null;
  if (cachedTransporter) return cachedTransporter;
  cachedTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: process.env.SMTP_SECURE !== "false", // default true (port 465)
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return cachedTransporter;
}

export async function sendMail(payload: MailPayload): Promise<{ ok: boolean }> {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn(`[mail] SMTP not configured — skipping email to ${payload.to}: "${payload.subject}"`);
    return { ok: false };
  }
  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });
    return { ok: true };
  } catch (err) {
    console.error(`[mail] failed to send to ${payload.to}:`, err);
    return { ok: false };
  }
}

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://igovazd.am";
}

/** Best-effort admin recipient: env override, else the first SUPERADMIN in the
   DB, else the SMTP mailbox itself (noreply@…) as a last resort. Callers that
   already have a candidate address (e.g. an admin lookup) can pass it in via
   `fallback` to skip the extra query. */
export async function resolveAdminEmail(): Promise<string | null> {
  if (process.env.ADMIN_EMAIL) return process.env.ADMIN_EMAIL;
  try {
    const { prisma } = await import("@/lib/prisma");
    const admin = await prisma.user.findFirst({
      where: { role: "SUPERADMIN" },
      select: { email: true },
      orderBy: { id: "asc" },
    });
    if (admin?.email) return admin.email;
  } catch (err) {
    console.error("[mail] failed to resolve admin email:", err);
  }
  return process.env.SMTP_USER || null;
}

/* ── Templates ─────────────────────────────────────────────────────────
   Each returns {subject, html, text}. User.locale isn't stored, so every
   email is trilingual (hy / ru / en) in one body, in that order (site
   default is hy). Plain inline-styled HTML — no build step / no external
   email framework. */

const BRAND = "iGovazd";
const ACCENT = "#e50914"; // Netflix-red, matches the site palette

function layout(bodyHtml: string, ctaLabel: string, ctaHref: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#0b0b0b;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0b0b;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#161616;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px 8px;">
                <div style="font-size:22px;font-weight:800;letter-spacing:.02em;color:${ACCENT};">${BRAND}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 24px;color:#e5e5e5;font-size:15px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px;">
                <a href="${ctaHref}" style="display:inline-block;background:${ACCENT};color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:4px;">${ctaLabel}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px;border-top:1px solid #262626;color:#737373;font-size:12px;">
                ${BRAND} · igovazd.am
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

type ProjectMailInput = { id: number; title: string };

export function projectApprovedTemplate(project: ProjectMailInput, base: string = siteUrl()) {
  const url = `${base}/reports/${project.id}`;
  const subject = `«${project.title}» одобрен и опубликован / Հրապարակված է / Published`;
  const html = layout(
    `
    <p><strong>Ձեր հրապարակումը հաստատվել է</strong><br/>
    Ձեր «${project.title}» նախագիծը հաստատվել է մոդերացիայի կողմից և այժմ հասանելի է հանրային կատալոգում։</p>
    <p><strong>Ваша публикация одобрена</strong><br/>
    Проект «${project.title}» прошёл модерацию и теперь доступен в публичном каталоге.</p>
    <p><strong>Your submission has been approved</strong><br/>
    «${project.title}» has passed moderation and is now live in the public catalog.</p>
    `,
    "Դիտել / Смотреть / View",
    url,
  );
  const text = [
    `Ձեր «${project.title}» նախագիծը հաստատվել է և հասանելի է․ ${url}`,
    `Проект «${project.title}» одобрен и доступен: ${url}`,
    `«${project.title}» has been approved and is live: ${url}`,
  ].join("\n\n");
  return { subject, html, text };
}

/** `reason` is what the moderator typed in the rejection prompt. It used to be
   thrown away, leaving the creator with a template letter that never said what
   to fix (audit 1.4); when present it is quoted in every language block. */
export function projectRejectedTemplate(
  project: ProjectMailInput,
  base: string = siteUrl(),
  reason = "",
) {
  const url = `${base}/account`;
  const subject = `«${project.title}» — проект отклонён / Մերժված է / Rejected`;
  const reasonHtml = reason
    ? `<p style="margin:16px 0;padding:12px 16px;border-left:3px solid ${ACCENT};background:#1f1f1f;color:#e5e5e5;">
    <strong>Պատճառը / Причина / Reason</strong><br/>${escapeHtml(reason)}</p>`
    : "";
  const html = layout(
    `
    <p><strong>Ձեր նախագիծը մերժվել է</strong><br/>
    «${project.title}» նախագիծը այս պահին չի հրապարակվել։ Կապ հաստատեք մեզ հետ մանրամասների համար կամ խմբագրեք և կրկին ուղարկեք։</p>
    <p><strong>Проект отклонён</strong><br/>
    «${project.title}» пока не опубликован. Свяжитесь с нами за подробностями или отредактируйте и отправьте повторно.</p>
    <p><strong>Submission rejected</strong><br/>
    «${project.title}» wasn't published at this time. Reach out for details, or edit and resubmit.</p>
    ${reasonHtml}
    `,
    "Անձնական հաշիվ / Кабинет / Account",
    url,
  );
  const reasonText = reason ? `\nՊատճառը / Причина / Reason: ${reason}` : "";
  const text = [
    `«${project.title}» նախագիծը մերժվել է։ Կաբինետ․ ${url}${reasonText}`,
    `Проект «${project.title}» отклонён. Кабинет: ${url}${reasonText}`,
    `«${project.title}» was rejected. Account: ${url}${reasonText}`,
  ].join("\n\n");
  return { subject, html, text };
}

/** Minimal HTML escaping for free text a moderator typed — the templates are
   built by string concatenation, so an unescaped "<" would break the markup. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function newProjectForModerationTemplate(project: ProjectMailInput, base: string = siteUrl()) {
  const url = `${base}/admin/moderation`;
  const subject = `Նոր նախագիծ մոդերացիայի համար / Новый проект на модерацию: «${project.title}»`;
  const html = layout(
    `
    <p><strong>Նոր նախագիծ մոդերացիայի համար</strong><br/>
    «${project.title}» ուղարկվել է և սպասում է հաստատման։</p>
    <p><strong>Новый проект на модерацию</strong><br/>
    «${project.title}» отправлен создателем и ожидает проверки.</p>
    <p><strong>New project awaiting moderation</strong><br/>
    «${project.title}» has been submitted and is pending review.</p>
    `,
    "Բացել մոդերացիան / Открыть модерацию / Open moderation",
    url,
  );
  const text = [
    `«${project.title}» նոր նախագիծ է և սպասում է հաստատման․ ${url}`,
    `«${project.title}» — новый проект, ожидает модерации: ${url}`,
    `«${project.title}» is a new submission awaiting moderation: ${url}`,
  ].join("\n\n");
  return { subject, html, text };
}

/* ── High-level senders ────────────────────────────────────────────── */

export async function notifyProjectApproved(project: ProjectMailInput, ownerEmail: string) {
  const { subject, html, text } = projectApprovedTemplate(project);
  return sendMail({ to: ownerEmail, subject, html, text });
}

export async function notifyProjectRejected(
  project: ProjectMailInput,
  ownerEmail: string,
  reason = "",
) {
  const { subject, html, text } = projectRejectedTemplate(project, siteUrl(), reason);
  return sendMail({ to: ownerEmail, subject, html, text });
}

/** Called when a Creator submits a project into moderation (task #16, the
   /account cabinet flow) — notifies the admin. Exported here so that flow
   can just `import { notifyNewProjectForModeration } from "@/lib/mail"`. */
export async function notifyNewProjectForModeration(project: ProjectMailInput) {
  const adminEmail = await resolveAdminEmail();
  if (!adminEmail) {
    console.warn("[mail] no admin email available — skipping new-project-for-moderation notice");
    return { ok: false };
  }
  const { subject, html, text } = newProjectForModerationTemplate(project);
  return sendMail({ to: adminEmail, subject, html, text });
}

/* ── Ad spaces (stage 3 of docs/plan-multichannel-ads.md) ─────────────
   The same three moments as a project — submitted, approved, rejected —
   because a space runs through the same moderation queue. Separate copy only
   because the wording says "project" in all three languages above. */

type AdSpaceMailInput = { title: string; channel: string; code: string };

/** Absolute URL of a space's public card. The path comes from adSpacePath —
   the code carries a leading "#", which cannot go into a path segment as-is
   (see src/lib/ad-space-url.ts). A channel token that isn't in the directory
   falls back to the /ads overview rather than to a broken link. */
function adSpaceUrl(space: AdSpaceMailInput, base: string): string {
  const channel = findAdChannelByCode(space.channel);
  return channel ? `${base}${adSpacePath(channel.slug, space.code)}` : `${base}/ads`;
}

export function adSpaceApprovedTemplate(space: AdSpaceMailInput, base: string = siteUrl()) {
  const url = adSpaceUrl(space, base);
  const subject = `«${space.title}» одобрено и опубликовано / Հրապարակված է / Published`;
  const html = layout(
    `
    <p><strong>Ձեր գովազդային տարածքը հաստատվել է</strong><br/>
    «${space.title}» գովազդային տարածքը հաստատվել է մոդերացիայի կողմից և այժմ հասանելի է հանրային կատալոգում։</p>
    <p><strong>Ваше рекламное место одобрено</strong><br/>
    Рекламное место «${space.title}» прошло модерацию и теперь доступно в публичном каталоге.</p>
    <p><strong>Your ad space has been approved</strong><br/>
    «${space.title}» has passed moderation and is now live in the public catalog.</p>
    `,
    "Դիտել / Смотреть / View",
    url,
  );
  const text = [
    `«${space.title}» գովազդային տարածքը հաստատվել է և հասանելի է․ ${url}`,
    `Рекламное место «${space.title}» одобрено и доступно: ${url}`,
    `«${space.title}» has been approved and is live: ${url}`,
  ].join("\n\n");
  return { subject, html, text };
}

export function adSpaceRejectedTemplate(
  space: AdSpaceMailInput,
  base: string = siteUrl(),
  reason = "",
) {
  const url = `${base}/account/ad-spaces`;
  const subject = `«${space.title}» — рекламное место отклонено / Մերժված է / Rejected`;
  const reasonHtml = reason
    ? `<p style="margin:16px 0;padding:12px 16px;border-left:3px solid ${ACCENT};background:#1f1f1f;color:#e5e5e5;">
    <strong>Պատճառը / Причина / Reason</strong><br/>${escapeHtml(reason)}</p>`
    : "";
  const html = layout(
    `
    <p><strong>Ձեր գովազդային տարածքը մերժվել է</strong><br/>
    «${space.title}» տարածքը այս պահին չի հրապարակվել։ Խմբագրեք և կրկին ուղարկեք կամ կապ հաստատեք մեզ հետ։</p>
    <p><strong>Рекламное место отклонено</strong><br/>
    «${space.title}» пока не опубликовано. Отредактируйте и отправьте повторно или свяжитесь с нами.</p>
    <p><strong>Ad space rejected</strong><br/>
    «${space.title}» wasn't published at this time. Edit and resubmit, or reach out for details.</p>
    ${reasonHtml}
    `,
    "Իմ գովազդային տարածքները / Мои рекламные места / My ad spaces",
    url,
  );
  const reasonText = reason ? `\nՊատճառը / Причина / Reason: ${reason}` : "";
  const text = [
    `«${space.title}» գովազդային տարածքը մերժվել է։ Կաբինետ․ ${url}${reasonText}`,
    `Рекламное место «${space.title}» отклонено. Кабинет: ${url}${reasonText}`,
    `«${space.title}» was rejected. Account: ${url}${reasonText}`,
  ].join("\n\n");
  return { subject, html, text };
}

export function newAdSpaceForModerationTemplate(space: AdSpaceMailInput, base: string = siteUrl()) {
  const url = `${base}/admin/moderation`;
  const subject = `Նոր գովազդային տարածք մոդերացիայի համար / Новое рекламное место на модерацию: «${space.title}»`;
  const html = layout(
    `
    <p><strong>Նոր գովազդային տարածք մոդերացիայի համար</strong><br/>
    «${space.title}» ուղարկվել է և սպասում է հաստատման։</p>
    <p><strong>Новое рекламное место на модерацию</strong><br/>
    «${space.title}» отправлено владельцем и ожидает проверки.</p>
    <p><strong>New ad space awaiting moderation</strong><br/>
    «${space.title}» has been submitted and is pending review.</p>
    `,
    "Բացել մոդերացիան / Открыть модерацию / Open moderation",
    url,
  );
  const text = [
    `«${space.title}» նոր գովազդային տարածք է և սպասում է հաստատման․ ${url}`,
    `«${space.title}» — новое рекламное место, ожидает модерации: ${url}`,
    `«${space.title}» is a new ad space awaiting moderation: ${url}`,
  ].join("\n\n");
  return { subject, html, text };
}

export async function notifyAdSpaceApproved(space: AdSpaceMailInput, ownerEmail: string) {
  const { subject, html, text } = adSpaceApprovedTemplate(space);
  return sendMail({ to: ownerEmail, subject, html, text });
}

export async function notifyAdSpaceRejected(
  space: AdSpaceMailInput,
  ownerEmail: string,
  reason = "",
) {
  const { subject, html, text } = adSpaceRejectedTemplate(space, siteUrl(), reason);
  return sendMail({ to: ownerEmail, subject, html, text });
}

/** Called when an owner submits a space into moderation — notifies the admin,
   same recipient resolution as the project version. */
export async function notifyNewAdSpaceForModeration(space: AdSpaceMailInput) {
  const adminEmail = await resolveAdminEmail();
  if (!adminEmail) {
    console.warn("[mail] no admin email available — skipping new-ad-space-for-moderation notice");
    return { ok: false };
  }
  const { subject, html, text } = newAdSpaceForModerationTemplate(space);
  return sendMail({ to: adminEmail, subject, html, text });
}

/* ── Application (Interest) loop ──────────────────────────────────────
   Audit 2.2: an answer never reached the brand at all, because MUTUAL/DECLINED
   were unreachable. It does now.

   The other direction — telling the project's owner that a brand had applied —
   was removed on 2026-08-07: staff run the negotiation, so an email inviting
   the creator to open an inbox they no longer have would have been a dead end.
   Staff learn about a new application in-app and by push. */

type InterestMailInput = {
  projectId: number;
  projectTitle: string;
  brandName: string;
  tierName?: string;
  // The product placement applied for (2026-07-29), mutually exclusive with
  // tierName in practice — one picker over both lists.
  placementName?: string;
  message?: string;
  contact?: string;
  note?: string;
  productInfo?: string;
  /** Budget bracket + categories from the brand's profile, already formatted
   *  by the caller — the email is tri-lingual and has no locale of its own. */
  brandBudget?: string;
};

export function interestAnsweredTemplate(
  input: InterestMailInput & { accepted: boolean },
  base: string = siteUrl(),
) {
  const url = `${base}/account/brand/interests`;
  const subject = input.accepted
    ? `Հայտը հաստատվեց / Заявка принята: «${input.projectTitle}»`
    : `Հայտը մերժվեց / Заявка отклонена: «${input.projectTitle}»`;
  const noteHtml = input.note
    ? `<p style="margin:16px 0;padding:12px 16px;border-left:3px solid ${ACCENT};background:#1f1f1f;color:#e5e5e5;">${escapeHtml(input.note)}</p>`
    : "";
  const hy = input.accepted
    ? `«${input.projectTitle}» նախագծի համար ձեր հայտը հաստատվել է։ Կապ կհաստատեն ձեզ հետ։`
    : `«${input.projectTitle}» նախագծի համար ձեր հայտը մերժվել է։`;
  const ru = input.accepted
    ? `Ваша заявка на проект «${input.projectTitle}» принята. С вами свяжутся для деталей.`
    : `Ваша заявка на проект «${input.projectTitle}» отклонена.`;
  const en = input.accepted
    ? `Your application for «${input.projectTitle}» was accepted. You'll be contacted with the details.`
    : `Your application for «${input.projectTitle}» was declined.`;
  const html = layout(
    `<p>${hy}</p><p>${ru}</p><p>${en}</p>${noteHtml}`,
    "Իմ հայտերը / Мои заявки / My applications",
    url,
  );
  const text = [hy, ru, en, input.note ?? "", url].filter(Boolean).join("\n\n");
  return { subject, html, text };
}

/** Stage S1 of docs/plan-interests-staff-only.md. A new application produced
 *  an inbox row and a web push, and nothing else — so a lead that arrived while
 *  nobody had the tab open waited on someone happening to look. Staff run the
 *  negotiation, which makes a missed lead nobody's lead.
 *
 *  Deliberately no brand contacts in the body: the e-mail says a lead exists
 *  and links to the panel, where who-they-are is already shown. */
export function newInterestForStaffTemplate(
  input: Pick<InterestMailInput, "projectTitle" | "brandName" | "tierName" | "placementName">,
  base: string = siteUrl(),
) {
  const url = `${base}/admin/interests`;
  const offer = input.tierName || input.placementName || "";
  const offerLine = offer ? ` — ${escapeHtml(offer)}` : "";
  const subject = `Նոր հայտ / Новая заявка: «${input.projectTitle}» — ${input.brandName}`;
  const html = layout(
    `
    <p><strong>Նոր հայտ բրենդից</strong><br/>
    ${escapeHtml(input.brandName)} → «${escapeHtml(input.projectTitle)}»${offerLine}</p>
    <p><strong>Новая заявка от бренда</strong><br/>
    ${escapeHtml(input.brandName)} → «${escapeHtml(input.projectTitle)}»${offerLine}</p>
    <p><strong>New application from a brand</strong><br/>
    ${escapeHtml(input.brandName)} → «${escapeHtml(input.projectTitle)}»${offerLine}</p>
    `,
    "Բացել հայտերը / Открыть заявки / Open applications",
    url,
  );
  const text = [
    `Նոր հայտ․ ${input.brandName} → «${input.projectTitle}»${offer ? ` — ${offer}` : ""}. ${url}`,
    `Новая заявка: ${input.brandName} → «${input.projectTitle}»${offer ? ` — ${offer}` : ""}. ${url}`,
    `New application: ${input.brandName} → «${input.projectTitle}»${offer ? ` — ${offer}` : ""}. ${url}`,
  ].join("\n\n");
  return { subject, html, text };
}

/** Same recipient resolution and same best-effort contract as the moderation
 *  notices above — a dead SMTP hop must not fail the brand's submit. */
export async function notifyNewInterestToStaff(
  input: Pick<InterestMailInput, "projectTitle" | "brandName" | "tierName" | "placementName">,
) {
  const adminEmail = await resolveAdminEmail();
  if (!adminEmail) {
    console.warn("[mail] no admin email available — skipping new-application notice");
    return { ok: false };
  }
  const { subject, html, text } = newInterestForStaffTemplate(input);
  return sendMail({ to: adminEmail, subject, html, text });
}

/** Sent to the brand once the creator accepted or declined. */
export async function notifyInterestAnswered(
  input: InterestMailInput & { accepted: boolean },
  brandEmail: string,
) {
  const { subject, html, text } = interestAnsweredTemplate(input);
  return sendMail({ to: brandEmail, subject, html, text });
}

export function passwordResetTemplate(resetUrl: string) {
  const subject = "Գաղտնաբառի վերականգնում / Сброс пароля / Password reset";
  const html = layout(
    `
    <p><strong>Գաղտնաբառի վերականգնում</strong><br/>
    Հետևեք հղմանը՝ նոր գաղտնաբառ սահմանելու համար։ Հղումն ուժի մեջ է 1 ժամ։ Եթե դուք չեք հայցել այս գործողությունը, անտեսեք այս նամակը։</p>
    <p><strong>Сброс пароля</strong><br/>
    Перейдите по ссылке, чтобы задать новый пароль. Ссылка действует 1 час. Если вы не запрашивали сброс — просто проигнорируйте это письмо.</p>
    <p><strong>Password reset</strong><br/>
    Follow the link to set a new password. The link is valid for 1 hour. If you didn't request this, just ignore this email.</p>
    `,
    "Սահմանել գաղտնաբառ / Сбросить пароль / Reset password",
    resetUrl,
  );
  const text = [
    `Գաղտնաբառի վերականգնման հղում (ուժի մեջ 1 ժամ)․ ${resetUrl}`,
    `Ссылка для сброса пароля (действует 1 час): ${resetUrl}`,
    `Password reset link (valid 1 hour): ${resetUrl}`,
  ].join("\n\n");
  return { subject, html, text };
}

/** Sends the reset link built by the caller (src/app/forgot/actions.ts). A
   failed send never throws — same best-effort contract as the rest of this
   file — so a flaky SMTP hop can't turn into a broken "email sent" screen. */
export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  try {
    const { subject, html, text } = passwordResetTemplate(resetUrl);
    await sendMail({ to: email, subject, html, text });
  } catch (err) {
    console.error("[mail] failed to send password reset email:", err);
  }
}

type ContactMessageInput = { name: string; email: string; message?: string; projectTitle?: string };

/** The public /contact form (#37) notifies the admin by email instead of
   writing to the (now removed) Applications inbox — CTA replies straight to
   the sender's address since there's no admin page to open. */
export function contactMessageTemplate(input: ContactMessageInput) {
  const subject = `Նոր հաղորդագրություն կայքից / Новое сообщение с сайта — ${input.name}`;
  const projectLine = input.projectTitle
    ? `<br/>${input.projectTitle}`
    : "";
  const html = layout(
    `
    <p><strong>Նոր հաղորդագրություն կոնտակտային ձևից</strong><br/>
    ${input.name} · ${input.email}${projectLine}${input.message ? `<br/>${input.message}` : ""}</p>
    <p><strong>Новое сообщение с контактной формы</strong><br/>
    ${input.name} · ${input.email}${projectLine}${input.message ? `<br/>${input.message}` : ""}</p>
    <p><strong>New contact form message</strong><br/>
    ${input.name} · ${input.email}${projectLine}${input.message ? `<br/>${input.message}` : ""}</p>
    `,
    "Պատասխանել / Ответить / Reply",
    `mailto:${input.email}`,
  );
  const text = [
    `${input.name} <${input.email}>${input.projectTitle ? ` — ${input.projectTitle}` : ""}${input.message ? `\n${input.message}` : ""}`,
  ].join("\n\n");
  return { subject, html, text };
}

export async function notifyContactMessage(input: ContactMessageInput) {
  const adminEmail = await resolveAdminEmail();
  if (!adminEmail) {
    console.warn("[mail] no admin email available — skipping contact message notice");
    return { ok: false };
  }
  const { subject, html, text } = contactMessageTemplate(input);
  return sendMail({ to: adminEmail, subject, html, text });
}
