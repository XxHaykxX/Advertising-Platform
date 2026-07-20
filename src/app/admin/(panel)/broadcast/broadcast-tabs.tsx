"use client";

import { useActionState, useState } from "react";
import { Bell, Loader2, Mail } from "lucide-react";
import {
  sendPushBroadcast,
  sendEmailBroadcast,
  type BroadcastAudience,
  type BroadcastState,
} from "./actions";

const initialState: BroadcastState = {};

const fieldClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary/50";
const labelClass = "mb-1.5 block text-sm font-medium text-foreground";

const AUDIENCES: { value: BroadcastAudience; label: string }[] = [
  { value: "all", label: "Все участники" },
  { value: "brands", label: "Только бренды" },
  { value: "creators", label: "Только создатели" },
];

/** Admin broadcast composer — two tabs (in-app Push / Email) over a shared
 *  audience selector. Recipient counts come from the server at page load. */
export function BroadcastTabs({
  counts,
}: {
  counts: Record<BroadcastAudience, number>;
}) {
  const [tab, setTab] = useState<"push" | "email">("push");
  const [audience, setAudience] = useState<BroadcastAudience>("all");

  const [pushState, pushAction, pushPending] = useActionState<BroadcastState, FormData>(
    sendPushBroadcast,
    initialState,
  );
  const [emailState, emailAction, emailPending] = useActionState<BroadcastState, FormData>(
    sendEmailBroadcast,
    initialState,
  );

  const recipientCount = counts[audience];

  return (
    <div className="mt-8 max-w-2xl">
      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-border bg-card p-1">
        <button
          type="button"
          onClick={() => setTab("push")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
            tab === "push" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Bell className="h-4 w-4" />
          Push-уведомление
        </button>
        <button
          type="button"
          onClick={() => setTab("email")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
            tab === "email" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Mail className="h-4 w-4" />
          Email-рассылка
        </button>
      </div>

      {/* Shared audience selector */}
      <div className="mt-6 rounded-xl border border-border bg-card p-6">
        <label className="block">
          <span className={labelClass}>Кому отправить</span>
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value as BroadcastAudience)}
            className={fieldClass}
          >
            {AUDIENCES.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label} ({counts[a.value]})
              </option>
            ))}
          </select>
        </label>
        <p className="mt-2 text-xs text-muted-foreground">
          Получателей по этому фильтру: <span className="font-semibold text-foreground">{recipientCount}</span>
        </p>

        {/* Push tab */}
        {tab === "push" ? (
          <form action={pushAction} className="mt-5 flex flex-col gap-4">
            <input type="hidden" name="audience" value={audience} />
            <label className="block">
              <span className={labelClass}>Заголовок (необязательно)</span>
              <input name="title" type="text" placeholder="Объявление" className={fieldClass} />
            </label>
            <label className="block">
              <span className={labelClass}>Текст сообщения</span>
              <textarea name="message" rows={5} className={fieldClass} required />
            </label>
            <label className="block">
              <span className={labelClass}>Ссылка (необязательно)</span>
              <input name="link" type="text" placeholder="/catalog" className={fieldClass} />
            </label>

            {pushState.error && (
              <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                {pushState.error}
              </p>
            )}
            {pushState.ok && !pushPending && (
              <p className="rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">
                Отправлено получателям: {pushState.count}
              </p>
            )}

            <button
              type="submit"
              disabled={pushPending || recipientCount === 0}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pushPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Отправить push
            </button>
          </form>
        ) : (
          /* Email tab */
          <form action={emailAction} className="mt-5 flex flex-col gap-4">
            <input type="hidden" name="audience" value={audience} />
            <label className="block">
              <span className={labelClass}>Тема письма</span>
              <input name="subject" type="text" className={fieldClass} required />
            </label>
            <label className="block">
              <span className={labelClass}>Текст сообщения</span>
              <textarea name="message" rows={7} className={fieldClass} required />
            </label>

            {emailState.error && (
              <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                {emailState.error}
              </p>
            )}
            {emailState.ok && !emailPending && (
              <p className="rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">
                Отправлено писем: {emailState.count}
              </p>
            )}

            <button
              type="submit"
              disabled={emailPending || recipientCount === 0}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {emailPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Отправить email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
