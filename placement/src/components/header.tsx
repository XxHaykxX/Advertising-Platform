"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "How It Works", href: "/#how-it-works" },
  { label: "FAQ", href: "/#faq" },
  { label: "About", href: "/#about" },
  { label: "Contact", href: "/#contact" },
] as const;

function Wordmark({ onDark }: { onDark: boolean }) {
  return (
    <Link
      href="/"
      className={cn(
        "flex items-center gap-1 text-lg font-bold tracking-tight",
        onDark ? "text-white" : "text-foreground"
      )}
    >
      <span className={onDark ? "text-indigo-300" : "text-primary"}>FP</span> Placement
    </Link>
  );
}

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  // Landing hero is a dark cinematic poster wall — while the transparent
  // header floats over it, switch text to a light-on-dark scheme.
  const onDark = pathname === "/" && !scrolled && !menuOpen;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-colors duration-300",
        scrolled ? "border-b border-border bg-background/80 backdrop-blur-md" : "border-b border-transparent bg-transparent"
      )}
    >
      <Container>
        <div className="flex h-16 items-center justify-between gap-4">
          <Wordmark onDark={onDark} />

          {/* Desktop nav */}
          <nav className="hidden items-center gap-8 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors",
                  onDark
                    ? "text-white/75 hover:text-white"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right cluster (desktop) */}
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/login"
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-semibold transition-colors",
                onDark ? "text-white hover:bg-white/10" : "text-foreground hover:bg-muted"
              )}
            >
              Sign In
            </Link>
            <Button asChild variant="primary" size="sm">
              <Link href="/catalog">Browse Projects</Link>
            </Button>
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className={cn(
              "grid h-10 w-10 place-items-center rounded-xl transition-colors md:hidden",
              onDark ? "text-white hover:bg-white/10" : "text-foreground hover:bg-muted"
            )}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </Container>

      {/* Mobile slide-down panel */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-b border-border bg-background md:hidden"
          >
            <Container className="flex flex-col gap-1 py-4">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-2 flex flex-col gap-2 border-t border-border pt-4">
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-center text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  Sign In
                </Link>
                <Button asChild variant="primary" size="sm" onClick={() => setMenuOpen(false)}>
                  <Link href="/catalog">Browse Projects</Link>
                </Button>
              </div>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
