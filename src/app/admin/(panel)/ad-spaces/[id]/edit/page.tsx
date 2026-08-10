import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireContentEditor } from "@/lib/auth/require";
import { updateAdSpace } from "../../actions";
import { AdSpaceForm } from "../../ad-space-form";
import { adSpaceChannelOptions, toAdSpaceFormInitial, toAdSpaceOfferRows } from "../../write";

export default async function EditAdSpacePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireContentEditor();

  const { id } = await params;
  const spaceId = Number(id);
  if (!Number.isInteger(spaceId)) notFound();

  const space = await prisma.adSpace.findUnique({
    where: { id: spaceId },
    include: { offers: { orderBy: { sortOrder: "asc" } } },
  });
  if (!space) notFound();
  // Same scoping as the action behind this form — a Publisher only reaches
  // their own rows, and "not yours" must not be distinguishable from "gone".
  if (user.role !== "SUPERADMIN" && space.ownerId !== user.id) notFound();

  return (
    <div>
      <Link
        href="/admin/ad-spaces"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to ad spaces
      </Link>
      <h1 className="mb-6 mt-4 text-2xl font-bold text-foreground">
        Edit: {space.titleEn || space.titleRu || space.titleHy || space.title}
      </h1>
      <AdSpaceForm
        action={updateAdSpace.bind(null, spaceId)}
        channels={adSpaceChannelOptions("en")}
        initial={toAdSpaceFormInitial(space)}
        initialOffers={toAdSpaceOfferRows(space.offers)}
        mode="staff"
        submitLabel="Save"
        cancelHref="/admin/ad-spaces"
      />
    </div>
  );
}
