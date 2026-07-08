"use client";

import { cloneElement, isValidElement, useActionState, useEffect, useRef, useState, type ReactElement } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, Loader2, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitApplication, type ApplicationState } from "@/lib/actions/applications";

const initialState: ApplicationState = { ok: false };

const fieldClass =
  "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelClass = "mb-1.5 block text-sm font-semibold text-foreground";

interface ApplyDialogProps {
  projectId?: number;
  projectTitle?: string;
  /* An already-rendered trigger element (e.g. <Button>Request details</Button>).
     Passed as a plain element rather than a render-prop function so callers
     can stay Server Components — functions can't cross the RSC boundary. */
  trigger: ReactElement<{ onClick?: () => void }>;
}

/* Modal application form. Reuses the submitApplication server action; the
   underlying form/field set mirrors the legacy site's project apply form
   (name + phone required, consent required, honeypot). */
export function ApplyDialog({ projectId, projectTitle, trigger }: ApplyDialogProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  // Bumped on every open so ApplyDialogForm remounts with fresh useActionState,
  // instead of showing a stale success/error screen from a previous submission.
  const [sessionKey, setSessionKey] = useState(0);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  const openDialog = () => {
    setSessionKey((k) => k + 1);
    setOpen(true);
  };

  return (
    <>
      {isValidElement(trigger) ? cloneElement(trigger, { onClick: openDialog }) : trigger}

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open ? (
              <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div
                  className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                  onClick={() => setOpen(false)}
                  aria-hidden="true"
                />

                <motion.div
                  role="dialog"
                  aria-modal="true"
                  aria-label="Apply for placement"
                  className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl md:p-8"
                  initial={{ opacity: 0, scale: 0.95, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 12 }}
                  transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
                >
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close"
                    className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <ApplyDialogForm
                    key={sessionKey}
                    projectId={projectId}
                    projectTitle={projectTitle}
                    onClose={() => setOpen(false)}
                  />
                </motion.div>
              </motion.div>
            ) : null}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}

function ApplyDialogForm({
  projectId,
  projectTitle,
  onClose,
}: {
  projectId?: number;
  projectTitle?: string;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState<ApplicationState, FormData>(
    submitApplication,
    initialState,
  );
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => nameInputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence mode="wait">
      {state.ok ? (
        <motion.div
          key="done"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex min-h-[280px] flex-col items-center justify-center text-center"
        >
          <CheckCircle className="h-12 w-12 text-success" />
          <p className="mt-4 text-lg font-semibold text-foreground">
            Thanks — we&apos;ll get back to you within 24 hours.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 text-sm font-medium text-primary hover:underline"
          >
            Close
          </button>
        </motion.div>
      ) : (
        <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <h2 className="text-xl font-bold text-foreground">
            {projectTitle ? "Request Details" : "Express Interest"}
          </h2>
          {projectTitle && <p className="mt-1 text-sm text-muted-foreground">{projectTitle}</p>}

          <form action={formAction} className="mt-6 space-y-4">
            {/* honeypot */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="hidden"
            />
            {projectId !== undefined && <input type="hidden" name="projectId" value={projectId} />}
            {projectTitle && <input type="hidden" name="projectTitle" value={projectTitle} />}

            <label className="block">
              <span className={labelClass}>
                Name<span className="ml-0.5 text-primary">*</span>
              </span>
              <input
                ref={nameInputRef}
                name="name"
                type="text"
                autoComplete="name"
                defaultValue={state.values?.name}
                placeholder="Your name"
                className={fieldClass}
              />
            </label>

            <label className="block">
              <span className={labelClass}>
                Phone<span className="ml-0.5 text-primary">*</span>
              </span>
              <input
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                defaultValue={state.values?.phone}
                placeholder="+1 ___ ___-____"
                className={fieldClass}
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={labelClass}>Email</span>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  defaultValue={state.values?.email}
                  placeholder="you@company.com"
                  className={fieldClass}
                />
              </label>
              <label className="block">
                <span className={labelClass}>Company</span>
                <input
                  name="company"
                  type="text"
                  autoComplete="organization"
                  defaultValue={state.values?.company}
                  placeholder="Your company"
                  className={fieldClass}
                />
              </label>
            </div>

            <label className="block">
              <span className={labelClass}>Message</span>
              <textarea
                name="message"
                rows={3}
                defaultValue={state.values?.message}
                placeholder="Tell us about your brand and placement goals…"
                className={`${fieldClass} resize-none`}
              />
            </label>

            <label className="flex cursor-pointer items-start gap-3 text-sm text-muted-foreground">
              <input type="checkbox" name="consent" className="mt-0.5 h-4 w-4 shrink-0 accent-primary" />
              <span>
                I agree to be contacted regarding this inquiry and accept the{" "}
                <a href="/privacy" className="text-primary underline underline-offset-2">
                  Privacy Policy
                </a>
                .
              </span>
            </label>

            {state.error && <p className="text-sm text-danger">{state.error}</p>}

            <Button type="submit" variant="primary" size="lg" disabled={pending} className="w-full gap-2">
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit
                </>
              )}
            </Button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
