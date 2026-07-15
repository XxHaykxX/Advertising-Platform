import type { Role } from "@prisma/client";

/* Staff permission helpers, shared between server code (route/action guards)
   and client components (e.g. admin-nav, to decide what to render). Pure
   functions — no DB/cookie access — so they carry no "server-only" tag.

   Role matrix:
     SUPERADMIN — everything.
     MODERATOR  — moderates submitted projects (approve/reject); no content
                  edits, no user/settings management.
     PUBLISHER  — creates/edits project content; does not moderate other
                  publishers' projects, no user/settings management. */

/** True when `role` may review projects awaiting moderation (approve/reject). */
export function canModerate(role: Role): boolean {
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
