"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/ui/multi-select";
import { PosterGenerator } from "@/components/poster-generator";
import { GENRES } from "@/lib/genres";
import { createCreatorProject, type CreatorProjectFormState } from "../actions";
import { generateCreatorPosterAction } from "../poster-action";
import { makeUI, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const initialState: CreatorProjectFormState = {};

const fieldClass =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary/50";

export function ProjectSubmitForm({ locale, hasAvatar = false }: { locale: Locale; hasAvatar?: boolean }) {
  const t = makeUI(locale);
  const [state, formAction, pending] = useActionState<CreatorProjectFormState, FormData>(
    createCreatorProject,
    initialState,
  );
  const [genres, setGenres] = useState<string[]>(() => state.values?.genres ?? []);
  const [kind, setKind] = useState<"FILM" | "SERIAL">(() => state.values?.kind ?? "FILM");

  // ── Generate poster (#26) — same uncontrolled-ref pattern as the admin
  // project-form: title/synopsis stay plain uncontrolled inputs, so the
  // panel reads their live .value at open time instead of a value frozen at
  // mount, and writes its result straight into the poster input's .value.
  const titleRef = useRef<HTMLInputElement>(null);
  const synopsisRef = useRef<HTMLTextAreaElement>(null);
  const posterRef = useRef<HTMLInputElement>(null);
  function getDefaultPromptForPoster(): string {
    const title = titleRef.current?.value || state.values?.title || "";
    const synopsis = synopsisRef.current?.value || state.values?.synopsis || "";
    return [title, genres.join(", "), synopsis].filter(Boolean).join(". ");
  }

  // Same {ok,redirect} + client-navigation pattern as register-form.tsx /
  // admin project-form.tsx: this action revalidates the "My projects" list
  // server-side, so a full navigation (not a redirect() inside the action)
  // is what safely picks up the fresh data.
  useEffect(() => {
    if (state.ok && state.redirect) {
      window.location.assign(state.redirect);
    }
  }, [state]);

  if (state.ok) {
    return (
      <div className="mt-8 flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/5 p-6 text-center text-sm font-medium text-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t("account.form.submitted")}
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-foreground">
          {t("account.form.title")}
        </span>
        <input
          ref={titleRef}
          name="title"
          type="text"
          required
          defaultValue={state.values?.title}
          placeholder={t("account.form.titlePlaceholder")}
          className={fieldClass}
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-foreground">
          {t("account.form.synopsis")}
        </span>
        <textarea
          ref={synopsisRef}
          name="synopsis"
          required
          rows={5}
          defaultValue={state.values?.synopsis}
          placeholder={t("account.form.synopsisPlaceholder")}
          className={cn(fieldClass, "resize-y")}
        />
      </label>

      <div>
        <span className="mb-1.5 block text-sm font-semibold text-foreground">
          {t("account.form.genres")}
        </span>
        <MultiSelect
          options={GENRES}
          value={genres}
          onChange={setGenres}
          name="genres"
          placeholder={t("account.form.genresPlaceholder")}
        />
      </div>

      <div>
        <span className="mb-1.5 block text-sm font-semibold text-foreground">
          {t("account.form.kind")}
        </span>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setKind("FILM")}
            className={cn(
              "rounded-xl border p-3 text-left text-sm font-semibold transition-colors",
              kind === "FILM"
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-background text-foreground hover:border-primary/40"
            )}
          >
            {t("account.form.kindFilm")}
          </button>
          <button
            type="button"
            onClick={() => setKind("SERIAL")}
            className={cn(
              "rounded-xl border p-3 text-left text-sm font-semibold transition-colors",
              kind === "SERIAL"
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-background text-foreground hover:border-primary/40"
            )}
          >
            {t("account.form.kindSerial")}
          </button>
        </div>
        <input type="hidden" name="kind" value={kind} />
      </div>

      {kind === "SERIAL" && (
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-foreground">
              {t("account.form.episodes")}
            </span>
            <input
              name="episodes"
              type="number"
              min={0}
              defaultValue={state.values?.episodes ?? undefined}
              placeholder={t("account.form.episodesPlaceholder")}
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-foreground">
              {t("account.form.episodeMinutes")}
            </span>
            <input
              name="episodeMinutes"
              type="number"
              min={0}
              defaultValue={state.values?.episodeMinutes ?? undefined}
              placeholder={t("account.form.episodeMinutesPlaceholder")}
              className={fieldClass}
            />
          </label>
        </div>
      )}

      <div>
        <span className="mb-1.5 block text-sm font-semibold text-foreground">
          {t("account.form.poster")}
        </span>
        <input
          ref={posterRef}
          name="poster"
          type="text"
          defaultValue={state.values?.poster}
          placeholder={t("account.form.posterPlaceholder")}
          className={fieldClass}
        />
        <div className="mt-3">
          <PosterGenerator
            action={generateCreatorPosterAction}
            getDefaultPrompt={getDefaultPromptForPoster}
            hasOwnerAvatar={hasAvatar}
            onUse={(path) => {
              if (posterRef.current) posterRef.current.value = path;
            }}
            t={t}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-foreground">
            {t("account.form.format")}
          </span>
          <input
            name="format"
            type="text"
            defaultValue={state.values?.format}
            placeholder={t("account.form.formatPlaceholder")}
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-foreground">
            {t("account.form.studio")}
          </span>
          <input
            name="studio"
            type="text"
            defaultValue={state.values?.studio}
            placeholder={t("account.form.studioPlaceholder")}
            className={fieldClass}
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-foreground">
          {t("account.form.countries")}
        </span>
        <input
          name="countries"
          type="text"
          defaultValue={state.values?.countries}
          placeholder={t("account.form.countriesPlaceholder")}
          className={fieldClass}
        />
      </label>

      {state.error && (
        <p className="rounded-xl border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm text-primary">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" size="lg" disabled={pending} className="gap-2">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {t("account.form.submit")}
        </Button>
        <Button asChild variant="secondary" size="lg">
          <Link href="/account/projects">{t("account.form.cancel")}</Link>
        </Button>
      </div>
    </form>
  );
}
