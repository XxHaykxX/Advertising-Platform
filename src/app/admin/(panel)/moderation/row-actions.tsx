"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, Eye, Check, X } from "lucide-react";
import { approveAdSpace, approveProject, rejectAdSpace, rejectProject } from "./actions";
import { NoteDialog } from "@/components/note-dialog";

const baseCls =
  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";
// Approve carries the primary colour, Reject the danger red — the two answers
// shouldn't look alike when one of them is irreversible.
const approveCls = `${baseCls} bg-primary text-primary-foreground hover:opacity-90`;
const rejectCls = `${baseCls} bg-danger text-white hover:opacity-90`;
const viewCls = `${baseCls} border border-border bg-muted text-muted-foreground hover:border-primary/40 hover:text-primary`;

/** View/Approve/Reject buttons for a single moderation-queue row. Mirrors the
   registrations/row-actions.tsx pattern: a plain client component driving a
   bound Server Action via useTransition, no form/redirect involved. */
export function RowActions({ projectId }: { projectId: number }) {
  const [pending, start] = useTransition();
  // Approval can now be refused server-side when the project is missing
  // something required for publication (audit 2.8) — surface that instead of
  // letting the click look like it worked.
  const [error, setError] = useState("");
  const [rejecting, setRejecting] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {/* Read the submission before judging it — the same page a visitor
            would land on, opened in its own tab so the queue stays put. */}
        <Link href={`/reports/${projectId}`} target="_blank" rel="noopener noreferrer" className={viewCls}>
          <Eye className="h-3.5 w-3.5" />
          View
        </Link>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              setError("");
              const result = await approveProject(projectId);
              if ("error" in result) setError(result.error);
            })
          }
          className={approveCls}
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Approve
        </button>
        <button type="button" disabled={pending} onClick={() => setRejecting(true)} className={rejectCls}>
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
          Reject
        </button>
      </div>

      {/* The reason reaches the creator (email + cabinet + in-app
          notification), so it is asked for in a real dialog with room to
          write, not in the browser's grey prompt box. */}
      {rejecting ? (
        <NoteDialog
          accept={false}
          pending={pending}
          labels={{
            titleAccept: "",
            titleDecline: "Reject this project?",
            noteLabel: "Rejection reason",
            notePlaceholder: "The creator will see this and needs it to know what to fix",
            confirmAccept: "",
            confirmDecline: "Reject",
            cancel: "Cancel",
          }}
          onConfirm={(reason) => {
            start(async () => {
              setError("");
              await rejectProject(projectId, reason || undefined);
              setRejecting(false);
            });
          }}
          onClose={() => setRejecting(false)}
        />
      ) : null}
      {error ? (
        <p className="max-w-md rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-xs leading-relaxed text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** The same three buttons for an ad space (stage 3). Its own component rather
 *  than a `kind` prop on the one above: what a moderator opens to judge it is
 *  a different URL, and the two bound actions are different endpoints — a
 *  shared component would carry both and pick at runtime for no gain. */
export function AdSpaceRowActions({ adSpaceId, viewHref }: { adSpaceId: number; viewHref: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [rejecting, setRejecting] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Link href={viewHref} target="_blank" rel="noopener noreferrer" className={viewCls}>
          <Eye className="h-3.5 w-3.5" />
          View
        </Link>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              setError("");
              const result = await approveAdSpace(adSpaceId);
              if ("error" in result) setError(result.error);
            })
          }
          className={approveCls}
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Approve
        </button>
        <button type="button" disabled={pending} onClick={() => setRejecting(true)} className={rejectCls}>
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
          Reject
        </button>
      </div>

      {rejecting ? (
        <NoteDialog
          accept={false}
          pending={pending}
          labels={{
            titleAccept: "",
            titleDecline: "Reject this ad space?",
            noteLabel: "Rejection reason",
            notePlaceholder: "The owner will see this and needs it to know what to fix",
            confirmAccept: "",
            confirmDecline: "Reject",
            cancel: "Cancel",
          }}
          onConfirm={(reason) => {
            start(async () => {
              setError("");
              await rejectAdSpace(adSpaceId, reason || undefined);
              setRejecting(false);
            });
          }}
          onClose={() => setRejecting(false)}
        />
      ) : null}
      {error ? (
        <p className="max-w-md rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-xs leading-relaxed text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
