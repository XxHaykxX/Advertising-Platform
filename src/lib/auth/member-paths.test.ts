import { describe, it, expect } from "vitest";
import { AD_CHANNELS } from "@/lib/ad-channels";
import { isMemberReachablePath } from "./member-paths";

/* The confinement in proxy.ts sends a signed-in member back to their cabinet
   from anywhere this says no to. Adding a public page and forgetting its
   prefix here is the project's most-repeated bug (it took out /reports for
   members in July and /for-creators on 2026-08-04): the page ships, the link
   is in the footer, and the one reader it was written for is the one reader
   who cannot open it. /ads is footer-linked and aimed at brands, so it is
   pinned here rather than only in the allow-list array. */
describe("member confinement — the /ads section stays reachable", () => {
  it("lets a member open the overview and every channel page", () => {
    const paths = ["/ads", ...AD_CHANNELS.map((c) => `/ads/${c.slug}`)];
    const blocked = paths.filter((p) => !isMemberReachablePath(p));
    expect(blocked, `участника выкинет в кабинет с:\n${blocked.join("\n")}`).toEqual([]);
  });

  it("still keeps the guest-only landing page out", () => {
    expect(isMemberReachablePath("/")).toBe(false);
    // Prefix matching must not leak to a sibling route that merely starts the
    // same way ("/adsomething" is not under "/ads").
    expect(isMemberReachablePath("/adspaces")).toBe(false);
  });
});
