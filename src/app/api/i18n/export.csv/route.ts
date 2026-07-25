/* Public CSV feed of the UI dictionary (src/lib/i18n.ts), for the content
   writer's Google Sheet: a service-only sheet tab pulls this live via
   =IMPORTDATA("https://igovazd.am/api/i18n/export.csv") so newly added keys
   show up without anyone re-running `npm run i18n:export` and re-uploading
   by hand. See docs/i18n-sheets.md.

   Byte-for-byte the same output as `npm run i18n:export` writes to
   i18n-export.csv (UTF-8 BOM, CRLF line endings, same header/column order) —
   both go through the shared helpers in src/lib/i18n-csv.ts.

   The route segment folder is literally named "export.csv" so the URL ends
   in .csv — Google's IMPORTDATA() is picky about that. No auth: the sheet
   fetches this anonymously, and the site is already noindex/robots-disallow
   (see src/proxy.ts — /api/* is excluded from the staff/member guards). */

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
