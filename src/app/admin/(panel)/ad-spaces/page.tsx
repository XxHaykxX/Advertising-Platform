import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireContentEditor } from "@/lib/auth/require";
import { makeUI } from "@/lib/i18n";
import type { ModerationStatus } from "@prisma/client";
import { RowActions } from "./row-actions";

/* Ad-space inventory — the /admin/projects of everything that is NOT sold
   through a film (stage 3 of docs/plan-multichannel-ads.md).

   Unlike the projects list this shows every status, including what members
   have submitted: a space is a handful of columns, so there is no reason to
   hide the pending ones behind the moderation queue the way a project's tall
   row made necessary. The queue still owns the approve/reject decision. */

const STATUS_PILL: Record<ModerationStatus, string> = {
  DRAFT: "border-border bg-muted text-muted-foreground",
  PENDING: "border-warn/25 bg-warn/10 text-warn",
  APPROVED: "border-success/30 bg-success/10 text-success",
  REJECTED: "border-danger/30 bg-danger/10 text-danger",
};

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
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Photo</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Channel</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Offers</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {spaces.map((s) => {
                // English first, then the other spellings — the legacy `title`
                // is only rebuilt on save, so relying on it would hide a rename
                // made in one language (the 2026-07-30 lesson).
                const title = s.titleEn || s.titleRu || s.titleHy || s.title;
                return (
                  <tr key={s.id} className="border-b border-border align-middle last:border-b-0 hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <div className="h-10 w-16 overflow-hidden rounded bg-muted">
                        {s.image && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={s.image} alt="" className="h-full w-full object-cover" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/ad-spaces/${s.id}/edit`}
                        className="font-medium text-foreground hover:text-primary"
                      >
                        {title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{t(`adChannel.${s.channel}`)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {[s.city, s.address].filter(Boolean).join(", ")}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{s._count.offers}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.owner.company || s.owner.name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_PILL[s.moderationStatus]}`}
                      >
                        {s.moderationStatus}
                      </span>
                      {!s.isActive && (
                        <span className="ml-2 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                          Hidden
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <RowActions id={s.id} title={title} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
