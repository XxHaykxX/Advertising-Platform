/* Public CSV feed of the UI dictionary (src/lib/i18n.ts). The editing cycle
   now runs entirely through /admin/i18n (role TRANSLATOR) — this route is
   just a backup/overview snapshot, no longer wired into the edit flow. See
   docs/i18n-editor.md.

   Byte-for-byte the same output as `npm run i18n:export` writes to
   i18n-export.csv (UTF-8 BOM, CRLF line endings, same header/column order) —
   both go through the shared helpers in src/lib/i18n-csv.ts.

   The route segment folder is literally named "export.csv" so the URL ends
   in .csv, kept for anyone still linking to it directly. No auth: fetched
   anonymously, and the site is already noindex/robots-disallow (see
   src/proxy.ts — /api/* is excluded from the staff/member guards). */

import { UI } from "@/lib/i18n";
import { CSV_HEADER, contextLabel, csvLine } from "@/lib/i18n-csv";

// The dictionary is a static import baked into the build — the CSV can't go
// stale between deploys, so generate it once at build time.
export const dynamic = "force-static";

export async function GET() {
  const lines: string[] = [csvLine([...CSV_HEADER])];
  for (const [key, dict] of Object.entries(UI)) {
    lines.push(csvLine([key, contextLabel(key), dict.hy, dict.ru, dict.en]));
  }
  const body = "﻿" + lines.join("\r\n") + "\r\n";

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
