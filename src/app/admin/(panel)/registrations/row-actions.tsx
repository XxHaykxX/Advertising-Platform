"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import type { AccountStatus } from "@prisma/client";
import { approveMember, rejectMember, blockMember, unblockMember, setMemberSides } from "./actions";

const btnCls =
  "inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50";

const badgeCls =
  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed";
const badgeOn = "border-primary/40 bg-primary/10 text-primary hover:border-primary/60";
const badgeOff = "border-border bg-muted text-muted-foreground hover:border-primary/30";

/** Two clickable badges (2026-08-11, dual-side accounts) replacing the old
 *  single role cell — a member can sell, buy, or both, and this is where a
 *  super-admin flips either on/off. Turning the last active side off is a
 *  no-op: setMemberSides itself refuses it, but disabling the button here
 *  saves the round trip and says why nothing happened. */
export function SideBadges({
  userId,
  isCreator,
  isBrand,
  creatorLabel,
  brandLabel,
}: {
  userId: number;
  isCreator: boolean;
  isBrand: boolean;
  creatorLabel: string;
  brandLabel: string;
}) {
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        type="button"
        disabled={pending || (isCreator && !isBrand)}
        onClick={() => start(() => setMemberSides(userId, { isCreator: !isCreator, isBrand }))}
        className={`${badgeCls} ${isCreator ? badgeOn : badgeOff}`}
      >
        {creatorLabel}
      </button>
      <button
        type="button"
        disabled={pending || (isBrand && !isCreator)}
        onClick={() => start(() => setMemberSides(userId, { isCreator, isBrand: !isBrand }))}
        className={`${badgeCls} ${isBrand ? badgeOn : badgeOff}`}
      >
        {brandLabel}
      </button>
    </div>
  );
}

/** Status-dependent action buttons for a single registration row. Mirrors the
   applications/ pattern of transitioning via a bound Server Action, but as a
   client component (useTransition) rather than a plain <form> so several
   buttons can share one pending state and disable together. */
export function RowActions({
  userId,
  status,
  approveLabel,
  rejectLabel,
  blockLabel,
  unblockLabel,
}: {
  userId: number;
  status: AccountStatus;
  approveLabel: string;
  rejectLabel: string;
  blockLabel: string;
  unblockLabel: string;
}) {
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      {(status === "PENDING" || status === "REJECTED") && (
        <button
          type="button"
          disabled={pending}
          onClick={() => start(() => approveMember(userId))}
          className={btnCls}
        >
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {approveLabel}
        </button>
      )}
      {status === "PENDING" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => start(() => rejectMember(userId))}
          className={btnCls}
        >
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {rejectLabel}
        </button>
      )}
      {status === "APPROVED" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => start(() => blockMember(userId))}
          className={btnCls}
        >
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {blockLabel}
        </button>
      )}
      {status === "BLOCKED" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => start(() => unblockMember(userId))}
          className={btnCls}
        >
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {unblockLabel}
        </button>
      )}
    </div>
  );
}
