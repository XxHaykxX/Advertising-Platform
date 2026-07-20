"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Film, MapPin, Search, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GenreBadge } from "@/components/ui/badge";
import { FavoriteHeart } from "@/components/favorite-heart";
import { splitCountries } from "@/lib/data/format";
import { DEFAULT_LOCALE, localizeValue, makeUI, type Locale } from "@/lib/i18n";
import type { ProjectListDTO } from "@/lib/types";

function BrowseCard({
  project,
  favorited,
  locale,
  onRequestLabel,
  favoriteAddAria,
  favoriteRemoveAria,
}: {
  project: ProjectListDTO;
  favorited: boolean;
  locale: Locale;
  onRequestLabel: string;
  favoriteAddAria: string;
  favoriteRemoveAria: string;
}) {
  const countries = splitCountries(project.countries);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card card-lift">
      <div className="relative aspect-[16/10] shrink-0">
        {project.poster ? (
          <Image
            src={project.poster}
            alt={project.title}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <Film className="h-10 w-10 text-primary/40" />
          </div>
        )}
        <div className="absolute left-3 top-3">
          <GenreBadge>{localizeValue(locale, "genre", project.genre)}</GenreBadge>
        </div>
        <FavoriteHeart
          projectId={project.id}
          initialFavorite={favorited}
          canFavorite
          signedIn
          addAria={favoriteAddAria}
          removeAria={favoriteRemoveAria}
        />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-semibold text-foreground">{project.title}</h3>
        <code className="text-xs text-muted-foreground">{project.code}</code>

        <div className="mt-3 flex flex-col gap-1.5 text-xs text-muted-foreground">
          <span>{project.format}</span>
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>{countries.slice(0, 3).join(", ")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 shrink-0" />
            <span>
              {[localizeValue(locale, "gender", project.audienceGender), project.audienceAge]
                .filter(Boolean)
                .join(", ")}
            </span>
          </div>
        </div>

        {project.budgetDisplay ? (
          <p className="mt-3 text-sm font-semibold text-foreground">{project.budgetDisplay}</p>
        ) : null}

        <div className="mt-auto pt-5">
          <Button asChild variant="ghost" size="sm" className="w-full">
            <Link href={`/reports/${project.id}`}>{onRequestLabel}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function BrowseView({
  projects,
  favorites,
  locale = DEFAULT_LOCALE,
  title,
}: {
  projects: ProjectListDTO[];
  /** projectIds the brand has favorited (heart's initial filled state). */
  favorites: Set<number>;
  locale?: Locale;
  title: string;
}) {
  const t = makeUI(locale);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return projects;
    return projects.filter((p) =>
      `${p.title} ${p.genre} ${p.countries} ${p.synopsis}`.toLowerCase().includes(term),
    );
  }, [projects, search]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground md:text-3xl">{title}</h1>

      <div className="relative mt-6 max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("catalog.searchPlaceholder")}
          className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground outline-none focus:border-primary"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border p-16 text-center">
          <Sparkles className="h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground">{t("catalog.noResults")}</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((project) => (
            <BrowseCard
              key={project.id}
              project={project}
              favorited={favorites.has(project.id)}
              locale={locale}
              onRequestLabel={t("btn.viewReport")}
              favoriteAddAria={t("favorite.addAria")}
              favoriteRemoveAria={t("favorite.removeAria")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
