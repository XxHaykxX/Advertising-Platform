import { describe, it } from "vitest";
import { AD_CHANNEL_ATTRS, attrLabelKey, attrValueLabelKey } from "./ad-channel-attrs";
import { makeUI } from "./i18n";

describe("qa key coverage", () => {
  it("reports missing", () => {
    const missing: string[] = [];
    for (const loc of ["ru", "en", "hy"] as const) {
      const t = makeUI(loc);
      for (const [ch, defs] of Object.entries(AD_CHANNEL_ATTRS)) {
        for (const def of defs) {
          const lk = attrLabelKey(def.key);
          if (t(lk) === lk) missing.push(`${loc} ${ch} ${lk}`);
          for (const v of def.values ?? []) {
            const vk = attrValueLabelKey(def.key, v);
            if (t(vk) === vk) missing.push(`${loc} ${ch} ${vk}`);
          }
        }
      }
      for (const k of ["adSpaceForm.section.attrs","projectForm.section.channelAttrs","projectForm.section.event","projectForm.section.placementAttrs","projectForm.eventCity","projectForm.eventDate","ui.addOption","ui.remove","projectForm.offer.crop.title","projectForm.offer.crop.zoom","projectForm.offer.crop.apply","projectForm.offer.crop.cancel","projectForm.offer.crop.hint"]) {
        if (t(k) === k) missing.push(`${loc} ${k}`);
      }
    }
    if (missing.length) throw new Error("MISSING: " + missing.join(" | "));
  });
});
