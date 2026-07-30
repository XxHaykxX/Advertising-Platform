// Single source of truth for feature toggles that hide a shipped page/section
// from the public site without deleting its code or data — flip the constant
// back to `true` and the feature is live again, no code hunt required.

// The public /portfolio (case studies) page is hidden while the owner keeps
// preparing cases; the admin Portfolio section stays reachable regardless
// (see src/app/admin/(panel)/portfolio/). Read by the page itself
// (src/app/portfolio/page.tsx), the header nav (src/components/header.tsx)
// and the footer link (src/components/footer.tsx).
export const PORTFOLIO_ENABLED = false;
