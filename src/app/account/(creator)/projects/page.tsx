import { redirect } from "next/navigation";

/** "Мои проекты" lives on the cabinet home now (/account, 2026-08-07): the
 *  dashboard that used to sit there held three cards repeating the sidebar, so
 *  the list and the home page were merged into one screen.
 *
 *  Kept as a redirect rather than deleted — the path is in creators' bookmarks
 *  and in older emails. */
export default function MyProjectsRedirect() {
  redirect("/account");
}
