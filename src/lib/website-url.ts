/** Turns whatever a brand typed into the website field into either the URL
 *  to store or a rejection — never the raw text verbatim (IA-35). The
 *  browser's own `type="url"` check lets `\\example.com` and
 *  `https:\\example.com` through unfixed — a URL parser treats a backslash
 *  as a slash for "special" schemes (http/https among them) once it's
 *  actually parsing the string, but `checkValidity()` doesn't rewrite what
 *  it validates, so the backslashes survive into the value the form submits.
 *  It also rejects a bare `example.com` outright, which is what most people
 *  type. So this redoes the check here, server-side, on the value that
 *  actually reaches the database — the browser check can be skipped
 *  entirely by posting directly.
 *
 *  Empty is valid: the field is optional. A bare domain or a backslash form
 *  is normalised by folding backslashes to slashes and retrying with
 *  `https://` in front when the result isn't an absolute URL on its own.
 *  Anything that parses to a scheme other than http/https — `javascript:`
 *  above all, since this value is later rendered as a link — is rejected
 *  rather than coerced: the scheme is the one thing the visitor spelled out
 *  on purpose, so silently swapping it for https would store a URL they
 *  never typed.
 *
 *  Plain sync module — deliberately NOT part of actions.ts. That file starts
 *  with "use server", where every export becomes a callable Server Function
 *  (a public RPC endpoint), and this is a pure parser, not an action meant to
 *  be published. Being ordinary and synchronous is the tell that it isn't
 *  one. */

export type WebsiteParseResult = { ok: true; value: string | null } | { ok: false };

export function parseWebsiteUrl(raw: string): WebsiteParseResult {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: true, value: null };

  const slashed = trimmed.replace(/\\/g, "/");

  try {
    const url = new URL(slashed);
    return url.protocol === "http:" || url.protocol === "https:" ? { ok: true, value: url.toString() } : { ok: false };
  } catch {
    // Not an absolute URL on its own — most likely a bare domain
    // (`example.com`), which `new URL` refuses without a scheme. Retried
    // below with https:// assumed, since that's what typing a bare domain
    // means.
  }

  try {
    const url = new URL(`https://${slashed}`);
    return { ok: true, value: url.toString() };
  } catch {
    return { ok: false };
  }
}
