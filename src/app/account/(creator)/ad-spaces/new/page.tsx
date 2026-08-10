import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { requireMember } from "@/lib/auth/require";
import { canSell } from "@/lib/auth/capabilities";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";
import { getCityOptions } from "@/lib/data/cities";
import { AdSpaceForm } from "@/app/admin/(panel)/ad-spaces/ad-space-form";
import { adSpaceChannelOptions } from "@/app/admin/(panel)/ad-spaces/write";
import { createCreatorAdSpace } from "../actions";
import { translateCreatorAdSpaceAction } from "../translate-action";

/** "Подать рекламное место" — reuses the staff AdSpaceForm (mode="creator")
 *  rather than growing a second form, same reasoning as
 *  account/projects/new/page.tsx. */
export default async function NewAdSpacePage() {
  const user = await requireMember();
  if (!canSell(user)) redirect("/account");

  const locale = await getLocale();
  const t = makeUI(locale);
  const cityOptions = await getCityOptions();

  return (
    <>
      <Reveal>
        <Link
          href="/account/ad-spaces"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("account.form.backToCabinet")}
        </Link>
        <h1 className="mb-2 mt-4 text-3xl font-bold text-foreground md:text-4xl">{t("adSpace.submit")}</h1>
        <p className="mb-6 text-muted-foreground">{t("adSpace.submitSubtitle")}</p>
      </Reveal>

      <AdSpaceForm
        action={createCreatorAdSpace}
        translateAction={translateCreatorAdSpaceAction}
        channels={adSpaceChannelOptions(locale)}
        cityOptions={cityOptions}
        mode="creator"
        locale={locale}
        submitLabel={t("account.form.submit")}
        cancelHref="/account/ad-spaces"
      />
    </>
  );
}
