import { AdTypes } from "@/components/ad-types";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";

/* Where a signed-in brand starts looking for inventory.
 *
 * This page rendered its own project grid once (#23) — the same getProjects()
 * and the same ProjectCard as the public catalogue, but with fewer filters and
 * no sort, so a brand browsing from inside its account got a weaker page than
 * any guest. It became a redirect to /ads, and then /ads itself was removed
 * (2026-08-18) in favour of the four type cards on the homepage.
 *
 * Which leaves this page with a job again: a member is redirected off "/" to
 * their cabinet, so the homepage anchor those cards live at is the one place a
 * buyer can't reach. Same <AdTypes/> the homepage renders, inside the cabinet
 * layout — one component, so the two can't drift.
 */
export default async function BrandBrowsePage() {
  const locale = await getLocale();
  const t = makeUI(locale);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("adTypes.title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("adTypes.subtitle")}</p>
      </div>
      {/* The heading above already says it — no second one inside. Section's
          own vertical padding would double the cabinet page's, hence py-0. */}
      <AdTypes locale={locale} showTitle={false} className="py-0 md:py-0 max-sm:py-0" />
    </div>
  );
}
