import { describe, expect, it } from "vitest";
import { adSpaceApprovedTemplate } from "@/lib/mail";

/* The one thing in the ad-space emails that can silently break: the link to
   the public card. `code` carries a leading "#", which is why the path must be
   built by adSpacePath and never by string concatenation — a raw "#AS-…" in an
   href turns everything after it into a fragment and the letter points at the
   channel page instead of the space. */

describe("adSpaceApprovedTemplate", () => {
  const space = { title: "Northern Avenue board", channel: "BILLBOARD", code: "#AS-2026-0417" };

  it("links to the space's public card, with the hash stripped from the segment", () => {
    const { html, text } = adSpaceApprovedTemplate(space, "https://igovazd.am");
    expect(html).toContain("https://igovazd.am/ads/billboard/AS-2026-0417");
    expect(text).toContain("https://igovazd.am/ads/billboard/AS-2026-0417");
    expect(html).not.toContain("/ads/billboard/#AS");
  });

  it("falls back to the homepage for a channel that isn't in the directory", () => {
    const { html } = adSpaceApprovedTemplate({ ...space, channel: "BILBOARD" }, "https://igovazd.am");
    expect(html).toContain('href="https://igovazd.am/"');
  });
});
