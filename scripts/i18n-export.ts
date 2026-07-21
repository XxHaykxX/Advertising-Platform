/* Export the UI dictionary (src/lib/i18n.ts) to i18n-export.csv for the
   content writer's Google Sheet.

   Usage: npm run i18n:export
   Output: ./i18n-export.csv (gitignored) — import it into the sheet via
   File → Import → Upload → "Replace current sheet".

   Column order puts hy first (default site locale = the writer's main
   surface), then ru/en. */

import { writeFileSync } from "node:fs";
import { UI } from "../src/lib/i18n";
import { CSV_HEADER, contextLabel, csvLine } from "./i18n-lib";

const lines: string[] = [csvLine([...CSV_HEADER])];
for (const [key, dict] of Object.entries(UI)) {
  lines.push(csvLine([key, contextLabel(key), dict.hy, dict.ru, dict.en]));
}

// UTF-8 BOM so Google Sheets / Excel detect the encoding correctly.
writeFileSync("i18n-export.csv", "﻿" + lines.join("\r\n") + "\r\n", "utf8");
console.log(`i18n-export.csv written: ${Object.keys(UI).length} keys × 3 languages`);
