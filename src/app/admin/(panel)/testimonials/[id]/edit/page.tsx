import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/auth/require";
import { buildEntityHistoryGroups, getEntityHistory } from "@/app/admin/(panel)/history/lib";
import { EntityEditTabs } from "@/app/admin/(panel)/history/entity-edit-tabs";
import { EntityHistoryPanel } from "@/app/admin/(panel)/history/entity-history-panel";
import { updateTestimonial } from "../../actions";
import { TestimonialForm, type TestimonialFormInitial } from "../../testimonial-form";

export default async function EditTestimonialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSuperadmin();

  const { id } = await params;
  const tid = Number(id);
  if (!Number.isInteger(tid)) notFound();

  const t = await prisma.testimonial.findUnique({ where: { id: tid } });
  if (!t) notFound();

  const initial: TestimonialFormInitial = {
    video: t.video ?? "",
    image: t.image ?? "",
    avatar: t.avatar ?? "",
    authorName: t.authorName,
    authorRole: t.authorRole ?? "",
    company: t.company ?? "",
    quoteHy: t.quoteHy ?? "",
    quoteRu: t.quoteRu ?? "",
    quoteEn: t.quoteEn ?? "",
  };

  const action = updateTestimonial.bind(null, tid);

  // "History" tab — this page is already SUPERADMIN-only, so the restore
  // buttons are always shown here. Same wiring as portfolio/[id]/edit.
  const historyGroups = buildEntityHistoryGroups(await getEntityHistory("Testimonial", tid));

  return (
    <div>
      <Link
        href="/admin/testimonials"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to testimonials
      </Link>
      <h1 className="mb-6 mt-4 text-2xl font-bold text-foreground">Edit: {t.authorName}</h1>

      <EntityEditTabs
        history={<EntityHistoryPanel entity="Testimonial" entityId={tid} groups={historyGroups} canRestore />}
      >
        <TestimonialForm action={action} initial={initial} submitLabel="Save" />
      </EntityEditTabs>
    </div>
  );
}
