import { describe, expect, it } from "vitest";
import { safeUploadPath } from "@/lib/uploads-path";

describe("safeUploadPath", () => {
  it("keeps a path inside the uploads root", () => {
    expect(safeUploadPath("/uploads/presentations/1-2.pdf")).toBe("/uploads/presentations/1-2.pdf");
    expect(safeUploadPath("  /uploads/presentations/1-2.pdf  ")).toBe(
      "/uploads/presentations/1-2.pdf",
    );
  });

  it("refuses anything that isn't one", () => {
    // The project page renders this as a link a brand clicks, so an off-site
    // URL or a traversal would be a download button pointing anywhere.
    expect(safeUploadPath("https://evil.example/x.pdf")).toBe("");
    expect(safeUploadPath("/uploads/../../etc/passwd")).toBe("");
    expect(safeUploadPath("/uploads\\windows\\x.pdf")).toBe("");
    expect(safeUploadPath("uploads/x.pdf")).toBe("");
  });

  it("passes an empty value through — that is how a file is detached", () => {
    expect(safeUploadPath("")).toBe("");
    expect(safeUploadPath("   ")).toBe("");
  });
});
