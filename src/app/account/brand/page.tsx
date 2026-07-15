import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Film, FolderSearch, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GenreBadge } from "@/components/ui/badge";
import { requireMember } from "@/lib/auth/require";
import { getLocale } from "@/lib/data/locale";
import { getBrandProfile } from "@/lib/data/brand-profile";
import { getBrandInterests } from "@/lib/data/brand-interests";
import { getRecommendedProjects, getRecentProjects, type DashboardProjectDTO } from "@/lib/data/brand-dashboard";
import { formatFullDate } from "@/lib/data/format";
import { intlLocale, localizeValue, makeUI, type Locale } from "@/lib/i18n";

function MiniProjectRow({ project, genreLabel }: { project: DashboardProjectDTO; genreLabel: string }) {
  return (
    <Link
      href={`/reports/${project.id}`}
      className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted"
    >
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
        {project.poster ? (
          <Image src={project.poster} alt={project.title} fill className="object-cover" sizes="48px" />
        ) : (
          <div className="grid h-full w-full place-items-center">
            <Film className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{project.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {project.code} · {genreLabel}
        </p>
      </div>
    </Link>
  );
}

function RecentCard({ project, locale }: { project: DashboardProjectDTO; locale: Locale }) {
  return (
    <Link
      href={`/reports/${project.id}`}
      className="overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/40"
    >
      <div className="aspect-[16/10] w-full bg-muted">
        {project.poster ? (
          <Image
            src={project.poster}
            alt=""
            width={320}
            height={200}
            className="h-full w-full object-cover"
          />
        ) : null}
      </div>
      <div className="p-4">
        <code className="text-xs font-semibold text-foreground">{project.code}</code>
        <p className="mt-1 text-sm text-muted-foreground">{localizeValue(locale, "genre", project.genre)}</p>
        {project.releaseLabel ? <p className="text-xs text-muted-foreground">{project.releaseLabel}</p> : null}
      </div>
    </Link>
  );
}

/** BRAND cabinet dashboard (#23) — welcome header, Active Interests,
 *  Recommended for You (weak genre-string match — see brand-dashboard.ts),
 *  and Recently Added. */
export default async function BrandDashboardPage() {
  const user = await requireMember();
  if (user.role !== "BRAND") redirect("/account");

  const locale = await getLocale();
  const t = makeUI(locale);

  const profile = await getBrandProfile(user.id);
  const [interests, recommended, recent] = await Promise.all([
    getBrandInterests(user.id, locale),
    getRecommendedProjects(locale, profile?.brandCategories ?? []),
    getRecentProjects(locale),
  ]);

  const displayName = profile?.company || user.name;
  const today = formatFullDate(new Date().toISOString(), intlLocale(locale));

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground md:text-3xl">
        {t("account.brand.welcomeBack", { name: displayName })}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">{today}</p>

      {/* Active Interests */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-foreground">{t("account.brand.activeInterests")}</h2>
        <div className="mt-3 rounded-2xl border border-border bg-card p-6">
          {interests.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-muted text-muted-foreground">
                <FolderSearch className="h-6 w-6" />
              </div>
              <p className="text-base font-semibold text-foreground">{t("account.brand.noInterestsTitle")}</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                {t("account.brand.noInterestsDashboardBody")}
              </p>
              <Button asChild variant="primary" size="md" className="mt-1">
                <Link href="/account/brand/browse">{t("nav.browseProjects")}</Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {interests.slice(0, 3).map((interest) => (
                <MiniProjectRow
                  key={interest.id}
                  project={{
                    id: interest.project.id,
                    code: interest.project.code,
                    title: interest.project.title,
                    genre: interest.project.genre,
                    poster: interest.project.poster,
                    releaseLabel: interest.project.releaseLabel,
                  }}
                  genreLabel={localizeValue(locale, "genre", interest.project.genre)}
                />
              ))}
              {interests.length > 3 ? (
                <Link
                  href="/account/brand/interests"
                  className="mt-2 self-start text-sm font-semibold text-primary hover:underline"
                >
                  {t("btn.viewAll")}
                </Link>
              ) : null}
            </div>
          )}
        </div>
      </section>

      {/* Recommended for You */}
      <section className="mt-8">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">{t("account.brand.recommended")}</h2>
        </div>
        <div className="mt-3 rounded-2xl border border-border bg-card p-6">
          {profile && profile.brandCategories.length > 0 ? (
            <p className="mb-3 text-xs text-muted-foreground">
              {t("account.brand.recommendedBasedOn", {
                categories: profile.brandCategories
                  .map((c) => localizeValue(locale, "category", c))
                  .join(", "),
              })}
            </p>
          ) : null}
          {recommended.length === 0 ? (
            <div className="flex flex-col items-start gap-2 py-2">
              <p className="text-sm text-muted-foreground">{t("account.brand.recommendedEmpty")}</p>
              <Link href="/account/brand/profile" className="text-sm font-semibold text-primary hover:underline">
                {t("account.brand.navProfile")}
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {recommended.map((project) => (
                <MiniProjectRow
                  key={project.id}
                  project={project}
                  genreLabel={localizeValue(locale, "genre", project.genre)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Recently Added */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{t("account.brand.recentlyAdded")}</h2>
          <Link href="/account/brand/browse" className="text-sm font-semibold text-primary hover:underline">
            {t("btn.viewAll")}
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{t("catalog.noResults")}</p>
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recent.map((project) => (
              <RecentCard key={project.id} project={project} locale={locale} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
