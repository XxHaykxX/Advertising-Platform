"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, KeyRound, Ban, RotateCcw, CheckCircle2, Trash2 } from "lucide-react";
import type { FormState, ResetState, RoleState, DeleteState } from "./actions";
import { setUserActive, resetUserPassword, setUserRole, deleteUserAccount } from "./actions";
import { PasswordInput } from "@/components/ui/password-input";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { STAFF_ROLES, STAFF_ROLE_LABEL, roleChangeMessage, type StaffRole } from "@/lib/auth/staff-roles";
import { deleteAccountMessage } from "@/lib/auth/delete-account";

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition-colors focus:border-primary";
const labelCls = "mb-1.5 block text-sm font-medium text-foreground";

export function UserForm({
  action,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});
  // New password is never echoed through server state (security), so it's
  // kept controlled client-side instead — that also makes it immune to
  // React 19's automatic reset of the form after a failed submit.
  const [password, setPassword] = useState("");

  // Full page load rather than a server-side redirect() — the action
  // revalidates /admin/users across a layout boundary, and the 303 + RSC
  // payload that redirect() answers the POST with fails on prod, surfacing as
  // a generic error even though the account was created. See the redirect
  // contract in ../partners/actions.ts.
  // Drives the disabled/spinner state below. Separate from `state.ok` so that
  // coming BACK to this page can clear it: bfcache restores the component with
  // `state.ok` still true and no state change to re-run the effect, which left
  // the button disabled and spinning forever until a manual reload.
  const [leaving, setLeaving] = useState(false);

  // Stays an effect: it navigates, and a navigation must not be fired from
  // render.
  useEffect(() => {
    if (state.ok && state.redirect) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLeaving(true);
      window.location.assign(state.redirect);
    }
  }, [state]);

  useEffect(() => {
    function onPageShow(e: PageTransitionEvent) {
      if (e.persisted) setLeaving(false);
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  return (
    <form action={formAction} className="max-w-xl space-y-6">
      <section className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <label className="block">
          <span className={labelCls}>Role *</span>
          <select name="role" defaultValue="SUPERADMIN" className={inputCls}>
            <option value="SUPERADMIN">Super-admin</option>
            <option value="MODERATOR">Moderator</option>
            <option value="TRANSLATOR">Translator (переводы)</option>
          </select>
        </label>
        <label className="block">
          <span className={labelCls}>Email *</span>
          <input
            name="email"
            type="email"
            autoComplete="off"
            required
            // Echoed back from state.values so it survives React 19's
            // automatic reset of this uncontrolled input after a failed
            // submit (e.g. duplicate email).
            defaultValue={state.values?.email ?? ""}
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className={labelCls}>Name *</span>
          <input
            name="name"
            placeholder="Full name or company"
            required
            defaultValue={state.values?.name ?? ""}
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className={labelCls}>Password *</span>
          <PasswordInput
            name="password"
            autoComplete="new-password"
            placeholder="at least 8 characters"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputCls}
          />
          <span className="mt-1.5 block text-xs text-muted-foreground">
            Shown only once — hand it off to the user yourself.
          </span>
        </label>
      </section>

      {state.error && (
        <p className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          // Stays disabled after a successful create too: the navigation above
          // is a full page load, so the button would otherwise be live again
          // for a beat and a second click would fail on the duplicate email.
          disabled={pending || leaving}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[--primary-hover] disabled:opacity-70"
        >
          {(pending || leaving) && <Loader2 className="h-4 w-4 animate-spin" />}
          Create member
        </button>
        <Link href="/admin/users" className="text-sm text-muted-foreground hover:text-foreground">
          Cancel
        </Link>
      </div>
    </form>
  );
}

function ResetPasswordForm({ id, onDone }: { id: number; onDone: () => void }) {
  const action = resetUserPassword.bind(null, id);
  const [state, formAction, pending] = useActionState<ResetState, FormData>(action, {});
  // Controlled (not echoed via server state — passwords never round-trip
  // through action state) so it survives React 19's automatic reset after a
  // failed submit.
  const [password, setPassword] = useState("");

  // The field is now controlled, so it no longer auto-clears on success the
  // way an uncontrolled input did — replicate that here explicitly. During
  // render, keyed on the action result object, so it clears in the same commit
  // that reports the success.
  const [seenState, setSeenState] = useState(state);
  if (seenState !== state) {
    setSeenState(state);
    if (state.ok) setPassword("");
  }

  return (
    <form action={formAction} className="mt-2 flex flex-wrap items-center gap-2">
      <PasswordInput
        name="password"
        placeholder="New password (min. 8 chars)"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={`${inputCls} max-w-[220px] py-1.5`}
      />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-[--primary-hover] disabled:opacity-70"
      >
        {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Set password
      </button>
      <button
        type="button"
        onClick={onDone}
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        Cancel
      </button>
      {state.error && <span className="text-xs text-danger">{state.error}</span>}
      {state.ok && (
        <span className="inline-flex items-center gap-1 text-xs text-success">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Password updated.
        </span>
      )}
    </form>
  );
}

/** Role select for a staff row, in the Role column of the Users table. Every
   change goes through a confirm dialog (never the native confirm()) that
   spells out what the person will gain or lose — see roleChangeMessage.
   Disabled for the signed-in super-admin's own row: changing your own role
   away from Super-admin would lock you out of this very page mid-request,
   so that has to be done by another super-admin instead (setUserRole also
   refuses it server-side — this is just the UI half). */
export function RoleControl({
  id,
  name,
  role,
  isSelf,
}: {
  id: number;
  name: string;
  role: StaffRole;
  isSelf: boolean;
}) {
  const [pending, start] = useTransition();
  const [nextRole, setNextRole] = useState<StaffRole | null>(null);
  const [error, setError] = useState<string | null>(null);

  function confirm() {
    if (!nextRole) return;
    const role = nextRole;
    start(async () => {
      const res: RoleState = await setUserRole(id, role);
      setError(res.error ?? null);
      setNextRole(null);
    });
  }

  return (
    <div>
      <select
        value={role}
        disabled={isSelf || pending}
        title={isSelf ? "You can't change your own role — ask another super-admin" : undefined}
        onChange={(e) => setNextRole(e.target.value as StaffRole)}
        className="rounded-lg border border-border bg-background px-2 py-1 text-xs font-medium text-foreground outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
      >
        {STAFF_ROLES.map((r) => (
          <option key={r} value={r}>
            {STAFF_ROLE_LABEL[r]}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      <ConfirmDialog
        open={nextRole != null}
        title="Change role?"
        message={nextRole ? roleChangeMessage(name, nextRole) : undefined}
        confirmLabel="Change role"
        danger={false}
        pending={pending}
        onConfirm={confirm}
        onCancel={() => setNextRole(null)}
      />
    </div>
  );
}

/** Delete button for a single account row — staff or member, so it's used
   both from RowActions below and directly from the Members tab in page.tsx.
   Trash2 + a ConfirmDialog naming what disappears (see deleteAccountMessage),
   never the native confirm(). Disabled up front for the cases the caller
   already has the data for — your own row, and an account that still owns
   projects and/or ad spaces — with a tooltip explaining why; the
   last-super-admin guard can't be predicted per-row like that, so it only
   surfaces as a returned error after confirming (same split as RoleControl's
   last_superadmin handling).
   projectCount/adSpaceCount have to mirror exactly what deleteAccount()
   itself gates on — #60: this was projectCount-only, so a row with ad spaces
   but no projects rendered an enabled button that then crashed on a raw FK
   error at confirm time instead of being disabled up front like a row with
   projects always was. */
export function DeleteAccountButton({
  id,
  name,
  isBrand = false,
  isSelf,
  projectCount,
  adSpaceCount = 0,
}: {
  id: number;
  name: string;
  /** Whether this account can buy (Interest/Favorite rows exist) — the
   *  member's isBrand flag, not the legacy role column (QA-5). Staff rows
   *  never have it, hence the default. */
  isBrand?: boolean;
  isSelf: boolean;
  projectCount: number;
  /** Staff rows never own ad spaces, hence the default. */
  adSpaceCount?: number;
}) {
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabled = isSelf || projectCount > 0 || adSpaceCount > 0;
  const owns: string[] = [];
  if (projectCount > 0) owns.push(`${projectCount} project${projectCount === 1 ? "" : "s"}`);
  if (adSpaceCount > 0) owns.push(`${adSpaceCount} ad space${adSpaceCount === 1 ? "" : "s"}`);
  const title = isSelf
    ? "You can't delete your own account"
    : owns.length > 0
      ? `Can't delete — owns ${owns.join(" and ")}. Reassign or remove them first.`
      : undefined;

  function confirm() {
    start(async () => {
      const res: DeleteState = await deleteUserAccount(id);
      setError(res.error ?? null);
      setOpen(false);
    });
  }

  return (
    <div className="inline-block">
      <button
        type="button"
        disabled={disabled || pending}
        title={title}
        onClick={() => setOpen(true)}
        className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-danger/10 hover:text-danger disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Delete account"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      </button>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      <ConfirmDialog
        open={open}
        title="Delete account?"
        message={deleteAccountMessage(name, isBrand)}
        confirmLabel="Delete"
        pending={pending}
        onConfirm={confirm}
        onCancel={() => setOpen(false)}
      />
    </div>
  );
}

/** Inline row actions (toggle active / reset password / delete) for the
   staff table. Kept inside this file rather than a dedicated component to
   stay within the four files owned by this feature. */
export function RowActions({
  id,
  name,
  isActive,
  isSelf,
  projectCount,
  adSpaceCount = 0,
}: {
  id: number;
  name: string;
  isActive: boolean;
  isSelf: boolean;
  projectCount: number;
  adSpaceCount?: number;
}) {
  const [pending, start] = useTransition();
  const [resetting, setResetting] = useState(false);

  return (
    <div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={pending || (isSelf && isActive)}
          title={isSelf && isActive ? "You can't deactivate your own account" : undefined}
          onClick={() => start(() => setUserActive(id, !isActive))}
          className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={isActive ? "Deactivate" : "Reactivate"}
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isActive ? (
            <Ban className="h-4 w-4" />
          ) : (
            <RotateCcw className="h-4 w-4" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setResetting((v) => !v)}
          className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Reset password"
        >
          <KeyRound className="h-4 w-4" />
        </button>
        <DeleteAccountButton
          id={id}
          name={name}
          isSelf={isSelf}
          projectCount={projectCount}
          adSpaceCount={adSpaceCount}
        />
      </div>
      {resetting && <ResetPasswordForm id={id} onDone={() => setResetting(false)} />}
    </div>
  );
}
