import { describe, it, expect } from "vitest";
import { GET } from "./route";
import { UI } from "@/lib/i18n";
import { CSV_HEADER, contextLabel, csvLine } from "@/lib/i18n-csv";

describe("GET /api/i18n/export.csv", () => {
  it("returns 200 with a UTF-8 BOM + the export header as the first line", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/csv; charset=utf-8");

    // Check the raw bytes — Response#text() decodes via "UTF-8 decode",
    // which strips a leading BOM per spec, so it can't see it either.
    const bytes = new Uint8Array(await res.clone().arrayBuffer());
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);

    const body = await res.text();
    const firstLine = body.split("\r\n")[0];
    expect(firstLine).toBe(csvLine([...CSV_HEADER]));
  });

  it("has one data row per UI dictionary key, matching npm run i18n:export's format", async () => {
    const res = await GET();
    const body = await res.text();

    // text() already strips the BOM (see the previous test) — split on CRLF
    // and drop the header row plus the trailing blank line left by the
    // final "\r\n".
    const rows = body.split("\r\n");
    expect(rows[rows.length - 1]).toBe("");
    const dataRows = rows.slice(1, -1);

    expect(dataRows.length).toBe(Object.keys(UI).length);

    const navCatalog = dataRows.find((r) => r.startsWith("nav.catalog,"));
    expect(navCatalog).toBe(
      csvLine([
        "nav.catalog",
        contextLabel("nav.catalog"),
        UI["nav.catalog"].hy,
        UI["nav.catalog"].ru,
        UI["nav.catalog"].en,
      ]),
    );
  });
});
