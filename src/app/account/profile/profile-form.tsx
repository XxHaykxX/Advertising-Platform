"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MediaField } from "@/components/media-field";
import { makeUI, type Locale } from "@/lib/i18n";
import { updateCreatorProfile, type CreatorProfileFormState } from "../actions";

const initialState: CreatorProfileFormState = {};

const fieldClass =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary/50";
const labelClass = "mb-1.5 block text-sm font-semibold text-foreground";
const cardClass = "rounded-2xl border border-border bg-card p-6";

/** CREATOR "My Profile" form — display name + avatar. Avatar goes through the
 *  member-scoped MediaField (uploads land in /uploads/members/<id>/avatars and
 *  the picker only shows the creator's own files). Email is read-only. */
export function ProfileForm({
  name,
  email,
  avatar,
  locale,
}: {
  name: string;
  email: string;
  avatar: string;
  locale: Locale;
}) {
  const t = makeUI(locale);
  const [state, formAction, pending] = useActionState<CreatorProfileFormState, FormData>(
    updateCreatorProfile,
    initialState,
  );

  return (
    <div className="mt-8 flex flex-col gap-6">
      {/* Account — email is read-only, outside the editable form */}
      <div className={cardClass}>
        <h2 className="text-lg font-semibold text-foreground">{t("account.brand.accountSection")}</h2>
        <label className="mt-4 block">
          <span className={labelClass}>{t("form.email")}</span>
          <input type="email" value={email} readOnly disabled className={`${fieldClass} opacity-60`} />
          <span className="mt-1.5 block text-xs text-muted-foreground">{t("account.brand.emailReadonlyNote")}</span>
        </label>
      </div>

      <form action={formAction} className="flex flex-col gap-6">
        <div className={cardClass}>
          <h2 className="text-lg font-semibold text-foreground">{t("account.profile")}</h2>

          <label className="mt-4 block max-w-md">
            <span className={labelClass}>{t("form.name")}</span>
            <input
              name="name"
              type="text"
              defaultValue={name}
              placeholder={t("form.name")}
              className={fieldClass}
            />
          </label>

          <div className="mt-4">
            <span className={labelClass}>{t("account.profile.avatar")}</span>
            <p className="mb-2 text-xs text-muted-foreground">{t("account.profile.avatarHint")}</p>
            <MediaField name="avatar" initial={avatar} uploadDir="avatars" scope="member" label={t("btn.browse")} />
          </div>
        </div>

        {state.error && (
          <p className="rounded-xl border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm text-primary">
            {state.error}
          </p>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" variant="primary" size="lg" disabled={pending} className="gap-2">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("account.brand.saveChanges")}
          </Button>
          {state.ok && !pending ? (
            <span className="text-sm font-medium text-success">{t("account.brand.saved")}</span>
          ) : null}
        </div>
      </form>
    </div>
  );
}
