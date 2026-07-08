"use client";

import { useActionState } from "react";
import { CheckCircle, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitLead, type LeadState } from "@/lib/actions/leads";
import type { ProjectListDTO } from "@/lib/types";

const initialState: LeadState = { ok: false };

const fieldClass =
  "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelClass = "mb-1.5 block text-sm font-semibold text-foreground";

export function ContactForm({ projects }: { projects: ProjectListDTO[] }) {
  const [state, formAction, pending] = useActionState<LeadState, FormData>(
    submitLead,
    initialState,
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="mb-2 text-2xl font-bold text-foreground">Send us a Message</h2>
        <p className="text-muted-foreground">
          Tell us about your brand and placement goals. We'll review and get back to you shortly.
        </p>
      </div>

      {state.ok ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-10 text-center card-lift">
          <CheckCircle className="h-12 w-12 text-success" />
          <p className="text-lg font-semibold text-foreground">
            Thanks — we'll get back to you shortly.
          </p>
          <p className="text-sm text-muted-foreground">
            Check your email for confirmation.
          </p>
        </div>
      ) : (
        <form action={formAction} className="space-y-5 rounded-2xl border border-border bg-card p-8 card-lift">
          <label className="block">
            <span className={labelClass}>Name</span>
            <input
              name="name"
              type="text"
              autoComplete="name"
              defaultValue={state.values?.name}
              placeholder="Your name"
              className={fieldClass}
            />
          </label>

          <label className="block">
            <span className={labelClass}>Email</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              defaultValue={state.values?.email}
              placeholder="you@example.com"
              className={fieldClass}
            />
          </label>

          <label className="block">
            <span className={labelClass}>Project (Optional)</span>
            <select
              name="projectTitle"
              className={fieldClass}
              defaultValue=""
            >
              <option value="">Select a project...</option>
              {projects.map((project) => (
                <option key={project.id} value={project.title}>
                  {project.title}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={labelClass}>Message</span>
            <textarea
              name="message"
              rows={5}
              defaultValue={state.values?.message}
              placeholder="Tell us about your brand, goals, and any specific projects or placements you're interested in…"
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
                Sending…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Message
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            We'll review your message and respond to your email within 24 hours.
          </p>
        </form>
      )}
    </div>
  );
}
