import { describe, it, expect } from "vitest";
import { dedupePeople } from "./actors";

const p = (name: string, role = "", kind = "ACTOR", photo: string | null = null) => ({
  name,
  role,
  kind,
  photo,
});

describe("dedupePeople", () => {
  it("returns [] for no rows", () => {
    expect(dedupePeople([])).toEqual([]);
  });

  it("dedupes by case-insensitive trimmed name, first occurrence wins", () => {
    const out = dedupePeople([
      p("Aram Asatryan", "Lead", "ACTOR", "/a.jpg"),
      p("  aram asatryan ", "Extra", "ACTOR", "/b.jpg"),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]).toEqual({ name: "Aram Asatryan", role: "Lead", kind: "ACTOR", photo: "/a.jpg" });
  });

  it("keeps distinct names", () => {
    const out = dedupePeople([p("A"), p("B"), p("C")]);
    expect(out.map((x) => x.name)).toEqual(["A", "B", "C"]);
  });

  it("drops blank / whitespace-only names", () => {
    const out = dedupePeople([p(""), p("   "), p("Real")]);
    expect(out).toEqual([{ name: "Real", role: "", kind: "ACTOR", photo: "" }]);
  });

  it("normalizes a null photo to empty string", () => {
    expect(dedupePeople([p("X", "R", "CREW", null)])[0].photo).toBe("");
  });

  it("caps the result at 500", () => {
    const rows = Array.from({ length: 750 }, (_, i) => p(`Person ${i}`));
    expect(dedupePeople(rows)).toHaveLength(500);
  });
});
