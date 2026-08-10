import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireContentEditor } from "@/lib/auth/require";
import { makeUI } from "@/lib/i18n";
import { ReorderableAdSpacesTable, type AdSpaceRow } from "./reorder-list";

/* Ad-space inventory — the /admin/projects of everything that is NOT sold
   through a film (stage 3 of docs/plan-multichannel-ads.md).

   Unlike the projects list this shows every status, including what members
   have submitted: a space is a handful of columns, so there is no reason to
   hide the pending ones behind the moderation queue the way a project's tall
   row made necessary. The queue still owns the approve/reject decision.

   The order spaces appear in is set by dragging the rows (reorder-list.tsx),
   the same way Portfolio and Partners work — there is no "sort order" field. */

export default async function AdSpacesAdminPage() {
  // Content-editor gate, same as /admin/projects: a MODERATOR judges spaces in
  // the queue, it does not author them.
  const user = await requireContentEditor();
  const isSuperadmin = user.role === "SUPERADMIN";
  // The admin panel is English-only; the channel names live in the dictionary.
  const t = makeUI("en");

  const spaces = await prisma.adSpace.findMany({
    where: isSuperadmin ? {} : { ownerId: user.id },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    include: {
      owner: { select: { name: true, company: true } },
      _count: { select: { offers: true } },
    },
  });

  const rows: AdSpaceRow[] = spaces.map((s) => ({
    id: s.id,
    image: s.image,
    // English first, then the other spellings — the legacy `title` is only
    // rebuilt on save, so relying on it would hide a rename made in one
    // language (the 2026-07-30 lesson).
    title: s.titleEn || s.titleRu || s.titleHy || s.title,
    channelLabel: t(`adChannel.${s.channel}`),
    location: [s.city, s.address].filter(Boolean).join(", "),
    offerCount: s._count.offers,
    owner: s.owner.company || s.owner.name,
    status: s.moderationStatus,
    isActive: s.isActive,
  }));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ad spaces</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {spaces.length} {spaces.length === 1 ? "space" : "spaces"} — billboards, lifts, transit,
            radio, TV, video and banner inventory
          </p>
        </div>
        <Link
          href="/admin/ad-spaces/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          New ad space
        </Link>
      </div>

      {spaces.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card py-16 text-center text-muted-foreground">
          No ad spaces yet — add the first one.
        </div>
      ) : (
        <ReorderableAdSpacesTable rows={rows} canReorder={isSuperadmin} />
      )}
    </div>
  );
}
