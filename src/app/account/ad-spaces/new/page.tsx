import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { requireMember } from "@/lib/auth/require";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";
import { AdSpaceForm } from "@/app/admin/(panel)/ad-spaces/ad-space-form";
import { adSpaceChannelOptions } from "@/app/admin/(panel)/ad-spaces/write";
import { createCreatorAdSpace } from "../actions";

/** "Подать рекламное место" — reuses the staff AdSpaceForm (mode="creator")
 *  rather than growing a second form, same reasoning as
 *  account/projects/new/page.tsx. */
export default async function NewAdSpacePage() {
  const user = await requireMember();
  if (user.role !== "CREATOR") redirect("/account");

  const locale = await getLocale();
  const t = makeUI(locale);

  return (
    <>
      <Reveal>
        <Link
          href="/account/ad-spaces"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("account.form.cancel")}
        </Link>
        <h1 className="mb-2 mt-4 text-3xl font-bold text-foreground md:text-4xl">{t("adSpace.submit")}</h1>
        <p className="mb-6 text-muted-foreground">{t("adSpace.submitSubtitle")}</p>
      </Reveal>

      <AdSpaceForm
        action={createCreatorAdSpace}
        channels={adSpaceChannelOptions(locale)}
        mode="creator"
        locale={locale}
        submitLabel={t("account.form.submit")}
        cancelHref="/account/ad-spaces"
      />
    </>
  );
}
