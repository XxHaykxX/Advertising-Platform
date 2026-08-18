import { Phone, PhoneCall } from "lucide-react";
import { requireInterestHandler } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/data/locale";
import { formatFullDate } from "@/lib/data/format";
import { intlLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { RowActions } from "./row-actions";

/* The homepage "order a call" lead (stage 4b) — same kind of unattended inbox
   the Offers section fixed for brand applications (audit 2.1): the request
   used to have nowhere to land until this page, so staff learned about one
   only if they thought to query the DB by hand. */

export default async function CallRequestsAdminPage() {
  await requireInterestHandler();
  // Admin panel is English-only (see admin-nav.tsx) — pin the date locale for
  // number/date formatting only, not for any copy on this page.
  const locale = await getLocale();

  const requests = await prisma.callRequest.findMany({
    // Unhandled (handledAt IS NULL) sort first in MySQL's ascending order,
    // newest-first within each of the two groups.
    orderBy: [{ handledAt: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-foreground">Call requests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Call-back leads submitted from the homepage form.
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-border bg-card py-16 text-center text-muted-foreground">
          <PhoneCall className="h-8 w-8 text-muted-foreground/50" />
          No call requests yet.
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {requests.map((request) => (
            <div key={request.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">{request.name}</p>
                  <a
                    href={`tel:${request.phone}`}
                    className="mt-1 flex items-center gap-1.5 text-sm text-foreground hover:text-primary"
                  >
                    <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    {request.phone}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  {/* Which language to call back in — the lead came from
                      whichever locale cookie was set at submit time. */}
                  <span className="rounded-full border border-border px-2.5 py-1 text-xs font-medium uppercase text-muted-foreground">
                    {request.locale}
                  </span>
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs font-medium",
                      request.handledAt
                        ? "border-success/30 bg-success/10 text-success"
                        : "border-warn/25 bg-warn/10 text-warn",
                    )}
                  >
                    {request.handledAt ? "Handled" : "New"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatFullDate(request.createdAt.toISOString(), intlLocale(locale))}
                  </span>
                </div>
              </div>

              {request.comment ? (
                <p className="mt-4 whitespace-pre-wrap text-sm text-foreground">{request.comment}</p>
              ) : null}

              {!request.handledAt ? (
                <div className="mt-4">
                  <RowActions id={request.id} />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
