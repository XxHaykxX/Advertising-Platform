"use client";

import { useTransition, type ButtonHTMLAttributes } from "react";

/** Client-side logout trigger. Replaces `<form action={logout}>` — the
 *  server action just clears the cookie and reports where to go; navigation
 *  happens here with a fresh full request so it survives Hostinger/Passenger
 *  (see account/actions.ts and admin/actions.ts for why). */
export function LogoutButton({
  action,
  onClick,
  ...props
}: {
  action: () => Promise<{ redirect: string }>;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "action">) {
  const [pending, startTransition] = useTransition();

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    onClick?.(e);
    startTransition(async () => {
      try {
        const res = await action();
        window.location.assign(res.redirect);
      } catch {
        // Action rejected (network / 500). The cookie may or may not have
        // cleared server-side; reload so the app re-evaluates auth state
        // instead of leaving the button stuck disabled with no feedback.
        window.location.reload();
      }
    });
  }

  return <button type="button" onClick={handleClick} disabled={pending} {...props} />;
}
