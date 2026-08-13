"use client";

import { useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, LogOut } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { LogoutButton } from "@/components/logout-button";
import { Avatar, SideRow, type NavItem, type SiteHeaderUser } from "@/components/header";
import { enableBrandSide, enableCreatorSide, type EnableSideResult } from "@/app/account/actions";
import { useUI, type Locale } from "@/lib/i18n-client";
import { cn } from "@/lib/utils";

/** The mobile slide-down nav — split out of header.tsx and loaded via
 *  next/dynamic so framer-motion (~131 KB) only ships once someone actually
 *  opens it on a narrow viewport, instead of on every page load regardless of
 *  device (bundle audit 2026-07-31). Header keeps this unmounted until the
 *  menu is opened for the first time; AnimatePresence needs it mounted after
 *  that to run the collapse animation on subsequent closes. */
export function MobileNavPanel({
  open,
  nav,
  isMember,
  user,
  locale,
  loginHref,
  cabinetHref,
  logoutAction,
  signInLabel,
  cabinetLabel,
  logoutLabel,
  onNavigate,
}: {
  open: boolean;
  /** `children` (only ever set on the "Advertising" item, C2) render as a
   *  flat indented list right under the parent link — no accordion, no group
   *  headings, the parent link still goes to /ads. */
  nav: readonly NavItem[];
  isMember: boolean;
  user: SiteHeaderUser | null;
  locale: Locale;
  loginHref: string;
  /** Only read when `user` is set. */
  cabinetHref: string;
  /** Only read when `user` is set — same `() => Promise<{ redirect }>` shape
   *  LogoutButton itself expects (see logout-button.tsx), not a raw form
   *  action. */
  logoutAction: () => Promise<{ redirect: string }>;
  signInLabel: string;
  cabinetLabel: string;
  logoutLabel: string;
  /** Closes the menu — passed in rather than a raw setState so this stays a
   *  dumb prop-driven component. */
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const t = useUI(locale);
  const [pending, startTransition] = useTransition();
  // Same "mode lives in the URL" rule as UserMenu's desktop switcher.
  const brandActive = pathname?.startsWith("/account/brand") ?? false;

  function enableSide(action: () => Promise<EnableSideResult>) {
    startTransition(async () => {
      try {
        const res = await action();
        if (res.ok) window.location.assign(res.redirect);
      } catch {
        window.location.reload();
      }
    });
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden border-b border-border bg-background lg:hidden"
        >
          {/* Capped and scrollable on its own: the page behind is locked while
              the menu is open (header.tsx), so a list taller than the viewport
              — nine ad channels plus both account rows — has to scroll here or
              its last items are unreachable. data-lenis-prevent for the same
              reason the catalog's filter sheet needs it: on the marketing side
              Lenis owns the wheel. */}
          <Container
            data-lenis-prevent
            className="flex max-h-[calc(100dvh-4rem)] flex-col gap-1 overflow-y-auto py-4"
          >
            {!isMember &&
              nav.map((item) => (
                <div key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className="rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                  >
                    {item.label}
                  </Link>
                  {item.children && (
                    <div className="ml-3 flex flex-col gap-1 border-l border-border pl-3">
                      {item.children.flatMap((g) => g.channels).map((c) => (
                        <Link
                          key={c.code}
                          href={c.href}
                          onClick={onNavigate}
                          className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                        >
                          {c.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            {!isMember && (
              <div className="mt-2 flex items-center gap-2 border-t border-border pt-4">
                <div className="ml-auto flex items-center gap-2">
                  <LocaleSwitcher current={locale} />
                </div>
              </div>
            )}
            {user ? (
              <div className="flex flex-col gap-2 border-t border-border pt-4">
                {/* Side switcher (A5's gap on mobile) — same rows, same actions
                    as UserMenu's desktop panel; nothing renders for staff or a
                    member with neither flag set. */}
                {(user.isCreator || user.isBrand) && (
                  <div className="-mx-3 flex flex-col rounded-xl border border-border">
                    <SideRow
                      user={user}
                      onDark={false}
                      active={user.isCreator && !brandActive}
                      href={user.isCreator ? "/account" : null}
                      label={t("nav.sideCreator")}
                      subtitle={user.isCreator ? t("nav.sideCreatorSubtitle", { n: user.projectCount }) : null}
                      inviteLabel={t("nav.startSelling")}
                      onInvite={() => enableSide(enableCreatorSide)}
                      pending={pending}
                      onNavigate={onNavigate}
                    />
                    <SideRow
                      user={user}
                      onDark={false}
                      active={user.isBrand && brandActive}
                      href={user.isBrand ? "/account/brand" : null}
                      label={t("nav.sideBrand")}
                      subtitle={user.isBrand ? t("nav.sideBrandSubtitle", { n: user.interestCount }) : null}
                      inviteLabel={t("nav.startBuying")}
                      onInvite={() => enableSide(enableBrandSide)}
                      pending={pending}
                      onNavigate={onNavigate}
                    />
                  </div>
                )}
                <Link
                  href={cabinetHref}
                  onClick={onNavigate}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-primary/10"
                >
                  <Avatar user={user} onDark={false} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {user.name || user.email}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {cabinetLabel}
                    </span>
                  </span>
                </Link>
                <LogoutButton
                  action={logoutAction}
                  locale={locale}
                  className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "w-full gap-2")}
                >
                  <LogOut className="h-4 w-4" />
                  {logoutLabel}
                </LogoutButton>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <Button asChild variant="primary" size="sm" onClick={onNavigate}>
                  <Link href={loginHref} className="group gap-2">
                    <LogIn className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                    {signInLabel}
                  </Link>
                </Button>
              </div>
            )}
          </Container>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
