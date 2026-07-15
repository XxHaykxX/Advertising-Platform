"use client";

import { useActionState } from "react";
import { CheckCircle, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitLead, type LeadState } from "@/lib/actions/leads";
import { DEFAULT_LOCALE, makeUI, type Locale } from "@/lib/i18n";
import type { ProjectListDTO } from "@/lib/types";

const initialState: LeadState = { ok: false };

const fieldClass =
  "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelClass = "mb-1.5 block text-sm font-semibold text-foreground";

export function ContactForm({
  projects,
  locale = DEFAULT_LOCALE,
}: {
  projects: ProjectListDTO[];
  locale?: Locale;
}) {
  const t = makeUI(locale);
  const [state, formAction, pending] = useActionState<LeadState, FormData>(
    submitLead,
    initialState,
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="mb-2 text-2xl font-bold text-foreground">{t("contactPage.formTitle")}</h2>
        <p className="text-muted-foreground">
          {t("contactPage.formSubtitle")}
        </p>
      </div>

      {state.ok ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-10 text-center card-lift">
          <CheckCircle className="h-12 w-12 text-success" />
          <p className="text-lg font-semibold text-foreground">
            {t("contactPage.thanks")}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("contactPage.thanksSubtitle")}
          </p>
        </div>
      ) : (
        <form action={formAction} className="space-y-5 rounded-2xl border border-border bg-card p-8 card-lift">
          <label className="block">
            <span className={labelClass}>{t("form.name")}</span>
            <input
              name="name"
              type="text"
              required
              autoComplete="name"
              defaultValue={state.values?.name}
              placeholder={t("form.namePlaceholder")}
              className={fieldClass}
            />
          </label>

          <label className="block">
            <span className={labelClass}>{t("form.email")}</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              defaultValue={state.values?.email}
              placeholder="you@example.com"
              className={fieldClass}
            />
          </label>

          <label className="block">
            <span className={labelClass}>{t("contactPage.projectOptional")}</span>
            <select
              name="projectTitle"
              className={fieldClass}
              defaultValue=""
            >
              <option value="">{t("contactPage.selectProject")}</option>
              {projects.map((project) => (
                <option key={project.id} value={project.title}>
                  {project.title}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={labelClass}>{t("form.message")}</span>
            <textarea
              name="message"
              rows={5}
              required
              defaultValue={state.values?.message}
              placeholder={t("contactPage.messagePlaceholder")}
              className={`${fieldClass} resize-none`}
            />
          </label>

          {state.error && (
            <p className="text-sm text-danger">{state.error}</p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={pending}
            className="w-full gap-2"
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("btn.sending")}
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {t("form.send")}
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            {t("contactPage.respondNote")}
          </p>
        </form>
      )}
    </div>
  );
}
