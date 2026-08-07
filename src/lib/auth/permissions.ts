import type { Role } from "@prisma/client";

/* Staff permission helpers, shared between server code (route/action guards)
   and client components (e.g. admin-nav, to decide what to render). Pure
   functions — no DB/cookie access — so they carry no "server-only" tag.

   Role matrix:
     SUPERADMIN — everything.
     MODERATOR  — moderates submitted projects (approve/reject); no content
                  edits, no user/settings management.
     PUBLISHER  — creates/edits project content; does not moderate other
                  publishers' projects, no user/settings management.
     TRANSLATOR — edits the UI dictionary in /admin/i18n and nothing else
                  (the content writer's login). */

/** True when `role` may review projects awaiting moderation (approve/reject). */
export function canModerate(role: Role): boolean {
  return role === "SUPERADMIN" || role === "MODERATOR";
}

/** True when `role` may read and answer brands' applications (/admin/interests).
 *  Same pair as canModerate, and deliberately its own function: these are two
 *  different jobs that happen to be staffed by the same two roles, and the
 *  owner may split them later.
 *
 *  Not canEditContent: a Publisher edits listings but does not close deals,
 *  and until 2026-08-07 this section was gated on content editing while the
 *  answer action required SUPERADMIN or MODERATOR — an intersection of exactly
 *  one role, with the Moderator getting a 404 on the very page their
 *  new-application notification linked to. */
export function canHandleInterests(role: Role): boolean {
  return role === "SUPERADMIN" || role === "MODERATOR";
}

/** True when `role` may create/edit project content. */
export function canEditContent(role: Role): boolean {
  return role === "SUPERADMIN" || role === "PUBLISHER";
}

/** True when `role` may manage staff/member users and platform settings. */
export function canManageUsers(role: Role): boolean {
  return role === "SUPERADMIN";
}

/** True when `role` may edit the UI dictionary (/admin/i18n). */
export function canEditTranslations(role: Role): boolean {
  return role === "SUPERADMIN" || role === "TRANSLATOR";
}

/** True when the only admin section `role` can reach is the translation
 *  editor — used to send that user straight there instead of the dashboard. */
export function isTranslatorOnly(role: Role): boolean {
  return role === "TRANSLATOR";
}

/** True for anyone on the staff side, whatever their section. Members
 *  (BRAND/CREATOR) are not staff. Used where the question is simply "does
 *  this account belong to the platform's own team" — e.g. previewing a
 *  project that hasn't been approved yet: a translator needs to read the
 *  copy in place just as much as a moderator needs to judge it. */
export function isStaff(role: Role): boolean {
  return role === "SUPERADMIN" || role === "PUBLISHER" || role === "MODERATOR" || role === "TRANSLATOR";
}
