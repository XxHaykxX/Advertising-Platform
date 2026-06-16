"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Mail, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { makeUI, type Locale } from "@/lib/i18n";

const PHONE_DISPLAY = "+7 999 000-00-00";
const PHONE_HREF = "tel:+79990000000";
const EMAIL = "hello@adplacement.example";
const WHATSAPP = "https://wa.me/79990000000";
const TELEGRAM = "https://t.me/placeholder";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 1.8c2.17 0 4.2.85 5.74 2.38a8.06 8.06 0 0 1 2.38 5.73c0 4.48-3.65 8.12-8.12 8.12a8.1 8.1 0 0 1-4.13-1.13l-.3-.18-3.12.82.83-3.04-.19-.31a8.06 8.06 0 0 1-1.24-4.29c0-4.47 3.64-8.11 8.12-8.11Zm-4.5 4.33c-.21 0-.55.08-.84.4-.29.31-1.1 1.07-1.1 2.62 0 1.54 1.13 3.03 1.28 3.24.16.21 2.2 3.36 5.33 4.58 2.6 1.02 3.13.82 3.69.77.56-.05 1.82-.74 2.07-1.46.26-.72.26-1.34.18-1.46-.07-.13-.28-.21-.59-.36-.31-.16-1.82-.9-2.1-1-.28-.1-.49-.16-.69.16-.21.31-.79 1-.97 1.2-.18.21-.36.24-.66.08-.31-.16-1.29-.48-2.46-1.52-.91-.81-1.52-1.81-1.7-2.12-.18-.31-.02-.48.13-.63.14-.14.31-.36.46-.55.16-.18.21-.31.31-.52.1-.21.05-.39-.03-.55-.08-.16-.69-1.67-.95-2.29-.25-.6-.5-.52-.69-.53-.18-.01-.39-.01-.6-.01Z" />
    </svg>
  );
}
function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M21.94 4.7 18.9 19.05c-.23 1.01-.83 1.26-1.68.78l-4.64-3.42-2.24 2.16c-.25.25-.46.46-.94.46l.33-4.73L18.66 6.5c.37-.33-.08-.51-.58-.18L7.43 13.2l-4.57-1.43c-.99-.31-1.01-.99.21-1.47l17.87-6.89c.83-.31 1.55.18 1 1.29Z" />
    </svg>
  );
}

/* Distinct background: slowly drifting dot-grid + a single breathing glow. */
function DotGridBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <motion.div
        className="absolute -inset-[10%] opacity-[0.5]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1.4px)",
          backgroundSize: "30px 30px",
          maskImage:
            "radial-gradient(ellipse at 50% 40%, #000 30%, transparent 75%)",
        }}
        animate={{ x: [0, 30], y: [0, 30] }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute left-1/2 top-1/3 h-[60vh] w-[60vh] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]"
        animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.12, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

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

const inputCls =
  "w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-foreground placeholder:text-white/35 outline-none transition-colors focus:border-primary/50";

export function Contact({
  t,
  contacts,
  projectTitles = [],
  locale,
}: {
  t: Record<string, string>;
  contacts: {
    phone: string;
    email: string;
    whatsapp: string;
    telegram: string;
  };
  projectTitles?: string[];
  locale: Locale;
}) {
  const ui = makeUI(locale);
  const phoneDisplay = contacts.phone || PHONE_DISPLAY;
  const phoneHref = `tel:${(contacts.phone || PHONE_DISPLAY).replace(/\D/g, "")}`;
  const email = contacts.email || EMAIL;
  const whatsapp = contacts.whatsapp || WHATSAPP;
  const telegram = contacts.telegram || TELEGRAM;

  const [project, setProject] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [errors, setErrors] = useState<{ name?: boolean; phone?: boolean; consent?: boolean }>({});
  const [submitError, setSubmitError] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Autofill the project select when "Оставить заявку" is clicked on a card.
  useEffect(() => {
    const onPick = (e: Event) => {
      const title = (e as CustomEvent<string>).detail;
      if (title) setProject(title);
    };
    window.addEventListener("advplatform:select-project", onPick);
    return () => window.removeEventListener("advplatform:select-project", onPick);
  }, []);

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
          project,
          budget: fd.get("budget"),
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
    <section
      id="contact"
      className="relative isolate overflow-hidden bg-background py-24 md:py-32"
    >
      <DotGridBackdrop />

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left — info + contacts */}
          <div>
            <motion.span
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-white/70"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {t["contact.eyebrow"]}
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="mt-5 text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl"
            >
              {t["contact.heading"]}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-4 text-base text-white/65 sm:text-lg"
            >
              {t["contact.subtitle"]}
            </motion.p>

            <div className="mt-8 space-y-3">
              <a
                href={phoneHref}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-primary/40"
              >
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary">
                  <Phone className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-xs uppercase tracking-wide text-white/40">
                    {ui("form.phone")}
                  </span>
                  <span className="font-semibold text-foreground">{phoneDisplay}</span>
                </span>
              </a>
              <div className="grid grid-cols-2 gap-3">
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-white/80 transition-colors hover:border-primary/40 hover:text-white"
                >
                  <WhatsAppIcon className="h-5 w-5 text-emerald-400" />
                  <span className="font-medium">WhatsApp</span>
                </a>
                <a
                  href={telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-white/80 transition-colors hover:border-primary/40 hover:text-white"
                >
                  <TelegramIcon className="h-5 w-5 text-sky-400" />
                  <span className="font-medium">Telegram</span>
                </a>
              </div>
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-primary/40"
              >
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-white/10 text-white/80">
                  <Mail className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-xs uppercase tracking-wide text-white/40">
                    Email
                  </span>
                  <span className="font-semibold text-foreground">{email}</span>
                </span>
              </a>
            </div>
          </div>

          {/* Right — form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm md:p-8"
          >
            <AnimatePresence mode="wait">
              {status === "done" ? (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex min-h-[420px] flex-col items-center justify-center text-center"
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
                    {ui("form.successText")}
                  </p>
                  <button
                    onClick={() => {
                      setStatus("idle");
                      setConsent(false);
                      setProject("");
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
                  {/* honeypot — hidden from users, bots fill it */}
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    className="hidden"
                  />

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

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={ui("form.project")}>
                      <select
                        name="project"
                        value={project}
                        onChange={(e) => setProject(e.target.value)}
                        className={`${inputCls} appearance-none`}
                      >
                        <option value="">{ui("form.anyProject")}</option>
                        {projectTitles.map((title) => (
                          <option key={title} value={title} className="bg-[#141414]">
                            {title}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label={ui("form.budget")}>
                      <input name="budget" type="text" placeholder={ui("form.budgetPh")} className={inputCls} />
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
          </motion.div>
        </div>
      </div>
    </section>
  );
}
