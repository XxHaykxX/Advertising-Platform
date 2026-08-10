import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { requireMember } from "@/lib/auth/require";
import { canSell } from "@/lib/auth/capabilities";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";
import { getCityOptions } from "@/lib/data/cities";
import { AdSpaceForm } from "@/app/admin/(panel)/ad-spaces/ad-space-form";
import {
  adSpaceChannelOptions,
  toAdSpaceFormInitial,
  toAdSpaceOfferRows,
} from "@/app/admin/(panel)/ad-spaces/write";
import { updateCreatorAdSpace } from "../../actions";
import { translateCreatorAdSpaceAction } from "../../translate-action";

/** A creator editing their OWN ad space. Twin of the staff edit page, scoped
 *  to the owner and wired to the creator action (which sends the save back
 *  into moderation). */
export default async function EditCreatorAdSpacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireMember();
  const locale = await getLocale();
  const t = makeUI(locale);

  const { id } = await params;
  const spaceId = Number(id);
  if (!Number.isInteger(spaceId)) notFound();

  const space = await prisma.adSpace.findUnique({
    where: { id: spaceId },
    include: { offers: { orderBy: { sortOrder: "asc" } } },
  });
  // 404 for "doesn't exist", "not a CREATOR" and "not yours" alike.
  if (!space) notFound();
  if (!canSell(user) || space.ownerId !== user.id) notFound();

  const backLink = (
    <Link
      href="/account/ad-spaces"
      className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      {t("account.form.backToCabinet")}
    </Link>
  );

  // A published space is read-only for its owner (the action refuses it too —
  // one rule, both places). Rendering the form disabled would still invite the
  // save that gets refused, so the page says who to ask instead.
  if (space.moderationStatus === "APPROVED") {
    return (
      <Reveal>
        {backLink}
        <h1 className="mb-2 mt-4 text-3xl font-bold text-foreground md:text-4xl">
          {space.titleHy || space.titleRu || space.titleEn || space.title}
        </h1>
        <p className="mt-4 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          {t("adSpace.approvedLocked")}
        </p>
      </Reveal>
    );
  }

  const cityOptions = await getCityOptions();

  return (
    <>
      <Reveal>
        {backLink}
        <h1 className="mb-6 mt-4 text-3xl font-bold text-foreground md:text-4xl">
          {space.titleHy || space.titleRu || space.titleEn || space.title}
        </h1>
      </Reveal>

      <AdSpaceForm
        action={updateCreatorAdSpace.bind(null, spaceId)}
        translateAction={translateCreatorAdSpaceAction}
        channels={adSpaceChannelOptions(locale)}
        cityOptions={cityOptions}
        initial={toAdSpaceFormInitial(space)}
        initialOffers={toAdSpaceOfferRows(space.offers)}
        mode="creator"
        locale={locale}
        submitLabel={t("account.form.submit")}
        cancelHref="/account/ad-spaces"
      />
    </>
  );
}
