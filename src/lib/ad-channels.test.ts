import { describe, it, expect } from "vitest";
import {
  AD_CHANNELS,
  AD_CHANNEL_GROUPS,
  AD_GROUP_SLUGS,
  adGroupChannelCodes,
  findAdChannel,
  findAdGroup,
} from "@/lib/ad-channels";

/* /ads/<slug> serves two levels from one flat namespace: a group (/ads/outdoor)
   and a channel (/ads/billboard). The page resolves a channel first, so a group
   slug that collided with a channel slug would silently shadow that channel's
   inventory page — no error, no 404, just the wrong list. These pin the shape
   the routing relies on. */

describe("ad channel directory", () => {
  it("keeps group slugs and channel slugs disjoint", () => {
    const channelSlugs = new Set(AD_CHANNELS.map((c) => c.slug));
    const collisions = Object.values(AD_GROUP_SLUGS).filter((s) => channelSlugs.has(s));
    expect(collisions).toEqual([]);
  });

  it("gives every group at least one channel", () => {
    const empty = AD_CHANNEL_GROUPS.filter((g) => adGroupChannelCodes(g).length === 0);
    expect(empty).toEqual([]);
  });

  it("puts every channel in a group that exists", () => {
    const orphans = AD_CHANNELS.filter((c) => !AD_CHANNEL_GROUPS.includes(c.group));
    expect(orphans).toEqual([]);
  });

  it("resolves a slug to a group or a channel, never both", () => {
    expect(findAdGroup("outdoor")).toBe("OUTDOOR");
    expect(findAdChannel("outdoor")).toBeUndefined();
    expect(findAdChannel("billboard")?.code).toBe("BILLBOARD");
    expect(findAdGroup("billboard")).toBeUndefined();
  });
});
