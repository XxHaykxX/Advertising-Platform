import { AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GuideTier } from "@/lib/creator-guide";

/** Icon + word + colour for each requirement tier — colour is never the only
 *  signal (UI/UX Pro Max §1 color-not-only). The "publish" badge deliberately
 *  does NOT use text-warn as text colour: --warn (#f59e0b) on white is
 *  ~2.2:1, well under the 4.5:1 minimum. bg-warn/10 + text-amber-700 lands
 *  at ~4.6:1 instead. "required" (--danger, ~4.8:1) and "optional"
 *  (--muted-foreground, ~fine) pass as plain text colour already. */
const TIER_STYLE: Record<GuideTier, { Icon: typeof AlertTriangle; className: string }> = {
  required: { Icon: AlertTriangle, className: "border-danger/30 bg-danger/10 text-danger" },
  publish: { Icon: Info, className: "border-warn/30 bg-warn/10 text-amber-700" },
  optional: { Icon: CheckCircle2, className: "border-border bg-muted text-muted-foreground" },
};

/** Plain server-renderable component — no hooks, no client-only imports — so
 *  the server page can build it directly into the props it hands the client
 *  <DisclosureList>. Takes an already-resolved label string, not a key: the
 *  page resolves every t() call server-side (see creator-guide.ts's header
 *  comment on why). */
export function TierBadge({ tier, label }: { tier: GuideTier; label: string }) {
  const { Icon, className } = TIER_STYLE[tier];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {label}
    </span>
  );
}
