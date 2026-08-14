import { redirect } from "next/navigation";

/** The BRAND cabinet used to render its own project grid here (#23). It read
 *  the same getProjects() and drew the same ProjectCard as the public
 *  /catalog, but with a smaller filter set and no sort or view switch — a
 *  brand browsing from inside its account saw a weaker version of the page
 *  every guest gets. Kept as a redirect rather than deleted so old links,
 *  bookmarks and revalidatePath() targets keep resolving. /catalog itself
 *  merged into /ads on 2026-08-14. */
export default function BrandBrowsePage(): never {
  redirect("/ads");
}
