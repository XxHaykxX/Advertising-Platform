import { describe, expect, it } from "vitest";
import { newInterestForStaffTemplate } from "@/lib/mail";

/* The staff notice for a new application (stage S1 of
   docs/plan-interests-staff-only.md). Two things in it can break quietly: the
   letter must point at the staff inbox rather than the creator's removed one,
   and the brand's own name goes into a string-concatenated HTML body — a name
   with a "<" in it would otherwise walk straight into the markup. */

describe("newInterestForStaffTemplate", () => {
  const input = { projectTitle: "Վալդակար", brandName: "Acme", tierName: "Генеральный спонсор" };

  it("points at the staff inbox, never at the creator's old one", () => {
    const { html, text } = newInterestForStaffTemplate(input, "https://igovazd.am");
    expect(html).toContain('href="https://igovazd.am/admin/interests"');
    expect(text).toContain("https://igovazd.am/admin/interests");
    expect(html).not.toContain("/account/interests");
  });

  it("names the offer, and falls back to the placement when there is no package", () => {
    expect(newInterestForStaffTemplate(input, "https://igovazd.am").html).toContain("Генеральный спонсор");
    const placement = newInterestForStaffTemplate(
      { projectTitle: "Վալդակար", brandName: "Acme", placementName: "Hero's car" },
      "https://igovazd.am",
    );
    // The apostrophe stays literal — escapeHtml covers & < > ", and these
    // values only ever land in a text node, never inside an attribute.
    expect(placement.html).toContain("Hero's car");
  });

  it("survives an application with no offer named at all", () => {
    const { subject, html } = newInterestForStaffTemplate(
      { projectTitle: "Վալդակար", brandName: "Acme" },
      "https://igovazd.am",
    );
    expect(subject).toContain("Acme");
    expect(html).not.toContain("undefined");
    expect(html).not.toContain(" — <");
  });

  it("escapes a brand name that would otherwise break the markup", () => {
    const { html } = newInterestForStaffTemplate(
      { projectTitle: "Վալդակար", brandName: '<script>alert(1)</script>' },
      "https://igovazd.am",
    );
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
