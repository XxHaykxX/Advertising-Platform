import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The iGovazd wordmark — the single source of truth for the brand logo across
 * the public site and the admin panel. The leading "i" is rendered in the
 * accent (primary) colour; the rest follows the surrounding text colour.
 *
 * - `href`: wrap in a link (omit for a plain, non-clickable mark).
 * - `onDark`: use the light-on-dark colour scheme (e.g. the transparent header
 *   floating over the hero).
 * - `suffix`: an optional muted tag after the wordmark (e.g. "Admin").
 */
export function Logo({
  href,
  onDark = false,
  suffix,
  className,
}: {
  href?: string;
  onDark?: boolean;
  suffix?: string;
  className?: string;
}) {
  const mark = (
    <span
      className={cn(
        "text-lg font-bold tracking-tight",
        onDark ? "text-white" : "text-foreground",
      )}
    >
      <span className="text-primary">i</span>Govazd
    </span>
  );

  const content = suffix ? (
    <span className="inline-flex items-baseline gap-1.5">
      {mark}
      <span className="text-sm font-medium text-muted-foreground">{suffix}</span>
    </span>
  ) : (
    mark
  );

  if (href) {
    return (
      <Link href={href} className={cn("inline-flex items-center", className)}>
        {content}
      </Link>
    );
  }
  return <span className={cn("inline-flex items-center", className)}>{content}</span>;
}
