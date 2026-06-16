"use client";

import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, ArrowRight, Clapperboard } from "lucide-react";
import { makeUI, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";

const inputCls =
  "w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-foreground placeholder:text-white/35 outline-none transition-colors focus:border-primary/50";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-white/80">
        {label}
        {required && <span className="ml-0.5 text-primary">*</span>}
      </span>
      {children}
    </label>
  );
}

/* Inline application form rendered directly on the project detail page. The
   project is fixed (no select), budget is omitted. Posts to /api/applications. */
export function ProjectApplyForm({
  projectTitle,
  locale = DEFAULT_LOCALE,
}: {
  projectTitle: string;
  locale?: Locale;
}) {
  const ui = makeUI(locale);
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [errors, setErrors] = useState<{ name?: boolean; phone?: boolean; consent?: boolean }>({});
  const [submitError, setSubmitError] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "").trim();
    const phone = String(fd.get("phone") || "").trim();
    const next = { name: !name, phone: !phone, consent: !consent };
    setErrors(next);
    setSubmitError(false);
    if (next.name || next.phone || next.consent) return;

    setStatus("sending");
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email: fd.get("email"),
          company: fd.get("company"),
          project: projectTitle,
          message: fd.get("message"),
          consent,
          website: fd.get("website"), // honeypot
        }),
      });
      if (!res.ok) throw new Error("request failed");
      setStatus("done");
    } catch {
      setStatus("idle");
      setSubmitError(true);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm md:p-8">
      <AnimatePresence mode="wait">
        {status === "done" ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex min-h-[360px] flex-col items-center justify-center text-center"
          >
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
              className="grid h-16 w-16 place-items-center rounded-full bg-primary/15 text-primary"
            >
              <CheckCircle2 className="h-9 w-9" />
            </motion.span>
            <h3 className="mt-5 text-2xl font-bold text-foreground">
              {ui("form.successTitle")}
            </h3>
            <p className="mt-3 max-w-sm text-sm text-white/65">
              {ui("form.successProject").replace("{p}", projectTitle)}
            </p>
            <button
              onClick={() => {
                setStatus("idle");
                setConsent(false);
                formRef.current?.reset();
              }}
              className="mt-6 text-sm font-medium text-primary hover:underline"
            >
              {ui("form.again")}
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            ref={formRef}
            onSubmit={handleSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
            noValidate
          >
            {/* honeypot */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="hidden"
            />

            {/* locked project */}
            <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3">
              <Clapperboard className="h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-primary/80">
                  {ui("form.project")}
                </p>
                <p className="truncate font-semibold text-foreground">
                  {projectTitle}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={ui("form.name")} required>
                <input
                  name="name"
                  type="text"
                  placeholder={ui("form.namePh")}
                  className={`${inputCls} ${errors.name ? "border-primary" : ""}`}
                  onChange={() => errors.name && setErrors((e) => ({ ...e, name: false }))}
                />
              </Field>
              <Field label={ui("form.phone")} required>
                <input
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  placeholder="+7 ___ ___-__-__"
                  className={`${inputCls} ${errors.phone ? "border-primary" : ""}`}
                  onChange={() => errors.phone && setErrors((e) => ({ ...e, phone: false }))}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={ui("form.email")}>
                <input name="email" type="email" placeholder="you@company.com" className={inputCls} />
              </Field>
              <Field label={ui("form.company")}>
                <input name="company" type="text" placeholder={ui("form.companyPh")} className={inputCls} />
              </Field>
            </div>

            <Field label={ui("form.message")}>
              <textarea
                name="message"
                rows={3}
                placeholder={ui("form.messagePh")}
                className={`${inputCls} resize-none`}
              />
            </Field>

            <label className="flex cursor-pointer items-start gap-3 text-sm text-white/65">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => {
                  setConsent(e.target.checked);
                  if (e.target.checked) setErrors((er) => ({ ...er, consent: false }));
                }}
                className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
              />
              <span className={errors.consent ? "text-primary" : ""}>
                {ui("form.consentPre")}{" "}
                <a href="/privacy" className="text-primary underline underline-offset-2">
                  {ui("form.consentLink")}
                </a>
              </span>
            </label>

            {submitError && (
              <p className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm text-primary">
                {ui("form.error")}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "sending"}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_8px_30px_-8px_rgba(229,9,20,0.7)] transition-all hover:scale-[1.01] hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {status === "sending" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {ui("form.sending")}
                </>
              ) : (
                <>
                  {ui("form.submit")}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
            <p className="text-center text-xs text-white/35">
              {ui("form.consentNote")}
            </p>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
