// Single source of truth for feature toggles that hide a shipped page/section
// from the public site without deleting its code or data — flip the constant
// back to `true` and the feature is live again, no code hunt required.

// The public /portfolio (case studies) page is hidden while the owner keeps
// preparing cases; the admin Portfolio section stays reachable regardless
// (see src/app/admin/(panel)/portfolio/). Read by the page itself
// (src/app/portfolio/page.tsx), the header nav (src/components/header.tsx)
// and the footer link (src/components/footer.tsx).
export const PORTFOLIO_ENABLED = false;

// The multichannel ads section (/ads + the nine per-channel pages, see
// src/lib/ad-channels.ts). Built in full and live by owner decision #5
// (docs/plan-multichannel-ads.md) — flip to false and the whole section
// disappears in one line: the routes 404, the header nav item and the footer
// link both drop out. Read by src/app/ads/page.tsx,
// src/app/ads/[channel]/page.tsx, src/components/header.tsx and
// src/components/footer.tsx — same three readers as PORTFOLIO_ENABLED.
export const ADS_ENABLED = true;
