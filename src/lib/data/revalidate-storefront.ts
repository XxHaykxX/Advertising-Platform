import "server-only";
import { revalidatePath } from "next/cache";

/** Every public surface that renders a project card or page (2026-08-05).
 *
 *  `updateTag("projects")` drops the cached DTOs, but the rendered routes hold
 *  their own cache entries — without this a saved edit stayed invisible on the
 *  catalog until the visitor forced a reload, which reads as "the save was
 *  rolled back" (owner report: changed a project's age rating, the storefront
 *  went on showing the old badge).
 *
 *  Deliberately NOT in projects/actions.ts: that module is `"use server"`, so
 *  every export there becomes a callable RPC endpoint and must be async. A
 *  plain shared helper belongs outside it — same reasoning as the 2026-07-30
 *  audit finding about exports from "use server" files. */
export function revalidateStorefront() {
  revalidatePath("/");
  revalidatePath("/catalog");
  revalidatePath("/account/brand");
  revalidatePath("/account/brand/browse");
  revalidatePath("/account/brand/favorites");
}
