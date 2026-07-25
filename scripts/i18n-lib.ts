/* Shared helpers for the Google-Sheets i18n round-trip
   (scripts/i18n-export.ts + scripts/i18n-import.ts).

   The actual (node:fs-free) implementations live in src/lib/i18n-csv.ts so
   they can also be imported by the public route handler
   (src/app/api/i18n/export.csv/route.ts). Re-exported here unchanged so
   existing imports in this directory don't need to move. */

export {
  CSV_HEADER,
  contextLabel,
  csvField,
  csvLine,
  parseCsv,
  CYRILLIC,
  placeholders,
} from "../src/lib/i18n-csv";
