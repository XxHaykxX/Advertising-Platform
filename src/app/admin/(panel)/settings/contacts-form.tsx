"use client";

import { useActionState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { saveContacts, type SaveState } from "./contact-actions";

const inputCls =
  "w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary/50";

const FIELDS: { key: string; label: string; placeholder: string }[] = [
  { key: "contact_phone", label: "Phone", placeholder: "+7 999 000-00-00" },
  { key: "contact_email", label: "Email", placeholder: "hello@..." },
  { key: "contact_whatsapp", label: "WhatsApp (URL)", placeholder: "https://wa.me/7999..." },
  { key: "contact_telegram", label: "Telegram (URL)", placeholder: "https://t.me/..." },
  { key: "social_instagram", label: "Instagram (URL)", placeholder: "https://instagram.com/..." },
  { key: "social_youtube", label: "YouTube (URL)", placeholder: "https://youtube.com/@..." },
];

export function ContactsForm({ values }: { values: Record<string, string> }) {
  const [state, formAction, pending] = useActionState<SaveState, FormData>(
    saveContacts,
    {},
  );

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <label key={f.key} className="block">
            <span className="mb-1.5 block text-sm font-medium text-white/80">{f.label}</span>
            <input name={f.key} defaultValue={values[f.key] ?? ""} placeholder={f.placeholder} className={inputCls} />
          </label>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-red-600 disabled:opacity-70">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Save contacts
        </button>
        {state.ok && (
          <span className="inline-flex items-center gap-1.5 text-sm text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            Saved
          </span>
        )}
      </div>
    </form>
  );
}
