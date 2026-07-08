"use client";

import { useActionState } from "react";
import { CheckCircle, Loader2, Send } from "lucide-react";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { submitLead, type LeadState } from "@/lib/actions/leads";

const initialState: LeadState = { ok: false };

const fieldClass =
  "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelClass = "mb-1.5 block text-sm font-semibold text-foreground";

export default function Contact() {
  const [state, formAction, pending] = useActionState<LeadState, FormData>(
    submitLead,
    initialState,
  );

  return (
    <Section id="contact">
      <Container>
        <div className="mx-auto max-w-xl">
          <Reveal>
            <div className="mb-10 text-center">
              <h2 className="text-4xl font-bold md:text-5xl">Get in Touch</h2>
              <p className="mt-3 text-muted-foreground">
                Have a project or a brand in mind? Send us a message and we&apos;ll follow up shortly.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            {state.ok ? (
              <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-10 text-center card-lift">
                <CheckCircle className="h-12 w-12 text-success" />
                <p className="text-lg font-semibold text-foreground">
                  Thanks — we&apos;ll get back to you shortly.
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
                  <span className={labelClass}>Message</span>
                  <textarea
                    name="message"
                    rows={5}
                    defaultValue={state.values?.message}
                    placeholder="Tell us about your project or brand…"
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
              </form>
            )}
          </Reveal>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Or email us directly:{" "}
            <a href="mailto:hello@fpplacement.com" className="text-primary hover:underline">
              hello@fpplacement.com
            </a>
          </p>
        </div>
      </Container>
    </Section>
  );
}
