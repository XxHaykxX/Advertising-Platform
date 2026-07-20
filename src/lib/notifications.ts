import type { makeUI } from "@/lib/i18n";

/** In-app notification helpers (#25 / V9). Pure module — no server-only import,
 *  so both server (data layer) and client (list UI) can share the type set and
 *  the localized-render function. A Notification row stores only `type` + a
 *  small JSON `data` payload; the human-readable copy is rendered here in the
 *  viewer's current locale, never persisted translated. */

export type Translator = ReturnType<typeof makeUI>;

export const NOTIFICATION_TYPES = [
  "INTEREST", // a BRAND expressed interest in a project → creator owner + admins
  "PROJECT_SUBMITTED", // a CREATOR submitted a project for moderation → moderators
  "PROJECT_APPROVED", // moderator approved the project → creator owner
  "PROJECT_REJECTED", // moderator rejected the project → creator owner
  "INTEREST_APPROVED", // admin approved a brand's Interest (SENT → MUTUAL) → the brand
  "INTEREST_DECLINED", // admin declined a brand's Interest (SENT → DECLINED) → the brand
  "BROADCAST", // admin push broadcast — free-text title/message to filtered members
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/** Payload shape stored (as JSON) in Notification.data. All optional — a row
 *  only carries what its type needs. Names/titles are raw data (not translated);
 *  only the surrounding sentence is localized. */
export type NotificationData = {
  projectId?: number;
  projectTitle?: string;
  brandName?: string;
  creatorName?: string;
  // BROADCAST only — admin-authored free text, shown verbatim (not localized).
  title?: string;
  message?: string;
};

export function parseNotificationData(
  raw: string | null | undefined,
): NotificationData {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw);
    return v && typeof v === "object" ? (v as NotificationData) : {};
  } catch {
    return {};
  }
}

/** Render a notification's title + body in the viewer's locale. `t` is a
 *  makeUI(locale) translator; the body templates use {brand}/{project}/{creator}
 *  placeholders filled from `data` via makeUI's built-in interpolation. */
export function renderNotification(
  t: Translator,
  type: string,
  data: NotificationData,
): { title: string; body: string } {
  const vars = {
    brand: data.brandName ?? "",
    project: data.projectTitle ?? "",
    creator: data.creatorName ?? "",
  };
  switch (type) {
    case "INTEREST":
      return { title: t("notif.interest.title"), body: t("notif.interest.body", vars) };
    case "PROJECT_SUBMITTED":
      return { title: t("notif.submitted.title"), body: t("notif.submitted.body", vars) };
    case "PROJECT_APPROVED":
      return { title: t("notif.approved.title"), body: t("notif.approved.body", vars) };
    case "PROJECT_REJECTED":
      return { title: t("notif.rejected.title"), body: t("notif.rejected.body", vars) };
    case "INTEREST_APPROVED":
      return { title: t("notif.interestApproved.title"), body: t("notif.interestApproved.body", vars) };
    case "INTEREST_DECLINED":
      return { title: t("notif.interestDeclined.title"), body: t("notif.interestDeclined.body", vars) };
    case "BROADCAST":
      // Admin-authored free text — shown verbatim, falling back to a localized
      // generic title if the admin left the title blank.
      return { title: data.title || t("notif.broadcast.title"), body: data.message ?? "" };
    default:
      return { title: t("notif.generic.title"), body: "" };
  }
}
