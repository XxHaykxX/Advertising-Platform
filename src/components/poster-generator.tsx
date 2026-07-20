"use client";

// Shared "Generate poster" panel (#26) — used by both the admin project-form
// (staff, English-only chrome) and the creator's account/projects submission
// form (member, locale-aware chrome). Each caller supplies its own bound
// server action (generatePosterAction / generateCreatorPosterAction) and a
// translator (`t`), so this component stays agnostic of which side it's on.
//
// Open state can be UNCONTROLLED (own trigger button, default — creator form)
// or CONTROLLED via `open`/`onOpenChange` with `hideTrigger` (admin form),
// where the caller renders a compact trigger next to "Upload poster" and this
// component renders only the panel — placed on its own full-width row so the
// panel spans the whole form instead of being cramped in a half column.
import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Loader2, Sparkles, Upload, X } from "lucide-react";

export type PosterGenerateInput = {
  prompt: string;
  posterText?: string;
  withLogo?: boolean;
  sourceImageBase64?: string;
  sourceMimeType?: string;
};
export type PosterGenerateResult = { ok?: boolean; path?: string; error?: string };

const fieldCls =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary/50";

export function PosterGenerator({
  action,
  getDefaultPrompt,
  hasOwnerAvatar,
  onUse,
  t,
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
}: {
  action: (input: PosterGenerateInput) => Promise<PosterGenerateResult>;
  /** Computed lazily on first open, so it reflects whatever the user has
   *  already typed into title/genre/synopsis at that moment (rather than a
   *  value frozen at parent mount time). */
  getDefaultPrompt: () => string;
  hasOwnerAvatar: boolean;
  onUse: (path: string) => void;
  t: (key: string) => string;
  /** Controlled open state (admin form lifts it so the panel can render
   *  full-width below the grid). Omit for the self-contained creator form. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Hide the built-in trigger button — the caller renders its own (compact,
   *  next to "Upload poster"). Only makes sense together with `open`. */
  hideTrigger?: boolean;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  function setOpen(next: boolean) {
    onOpenChange?.(next);
    if (!isControlled) setInternalOpen(next);
  }

  const [initialized, setInitialized] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [posterText, setPosterText] = useState("");
  const [withLogo, setWithLogo] = useState(false);
  const [source, setSource] = useState<{ base64: string; mimeType: string; name: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [resultPath, setResultPath] = useState<string | null>(null);
  const reducedMotion = useReducedMotion();

  // Seed the prompt the first time the panel opens (works for both the
  // built-in trigger and a controlled parent trigger).
  useEffect(() => {
    if (open && !initialized) {
      setPrompt(getDefaultPrompt());
      setInitialized(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function onPickSource(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const base64 = result.split(",")[1] || "";
      if (base64) setSource({ base64, mimeType: file.type || "image/jpeg", name: file.name });
    };
    reader.readAsDataURL(file);
  }

  function runGenerate() {
    setError(null);
    startTransition(async () => {
      const res = await action({
        prompt,
        posterText: posterText.trim() || undefined,
        withLogo: withLogo && hasOwnerAvatar,
        sourceImageBase64: source?.base64,
        sourceMimeType: source?.mimeType,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.path) setResultPath(res.path);
    });
  }

  return (
    <>
      {!hideTrigger && !open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:border-primary/40"
        >
          <Sparkles className="h-4 w-4" />
          {t("btn.generatePoster")}
        </button>
      )}

      {open && (
        <div className="space-y-3 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              {t("btn.generatePoster")}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground"
              aria-label={t("ui.close")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs text-muted-foreground">{t("poster.promptLabel")}</span>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) e.preventDefault();
              }}
              rows={3}
              className={`${fieldCls} resize-none`}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-muted-foreground">{t("poster.customText")}</span>
            <input
              value={posterText}
              onChange={(e) => setPosterText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.preventDefault();
              }}
              placeholder={t("poster.customTextPlaceholder")}
              className={fieldCls}
            />
          </label>

          <label
            className="inline-flex items-center gap-2 text-sm text-foreground"
            title={hasOwnerAvatar ? undefined : t("poster.noAvatarHint")}
          >
            <input
              type="checkbox"
              checked={withLogo}
              disabled={!hasOwnerAvatar}
              onChange={(e) => setWithLogo(e.target.checked)}
              className="h-4 w-4 accent-primary disabled:opacity-50"
            />
            <span className={!hasOwnerAvatar ? "text-muted-foreground" : undefined}>{t("poster.withLogo")}</span>
          </label>

          <div className="flex items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:border-primary/40">
              <Upload className="h-3.5 w-3.5" />
              {t("poster.fromImage")}
              <input type="file" accept="image/*" onChange={onPickSource} className="hidden" />
            </label>
            {source && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                {source.name}
                <button type="button" onClick={() => setSource(null)} aria-label={t("ui.remove")}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>

          {(pending || resultPath) && (
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border border-border bg-muted">
              {resultPath && !pending && (
                <Image src={resultPath} alt="" fill className="object-cover" sizes="400px" unoptimized />
              )}
              {pending && (
                <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                  {reducedMotion ? null : (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/30 to-transparent"
                      animate={{ x: ["-120%", "120%"] }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2 text-xs font-medium text-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("poster.generating")}
                  </span>
                </div>
              )}
            </div>
          )}

          {error && <p className="text-xs text-primary">{error}</p>}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={runGenerate}
              disabled={pending || !prompt.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-60"
            >
              {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {resultPath ? t("poster.regenerate") : t("btn.generatePoster")}
            </button>
            {resultPath && !pending && (
              <button
                type="button"
                onClick={() => {
                  onUse(resultPath);
                  setOpen(false);
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-primary/40 px-4 py-2 text-xs font-semibold text-primary hover:border-primary"
              >
                {t("poster.useThis")}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
