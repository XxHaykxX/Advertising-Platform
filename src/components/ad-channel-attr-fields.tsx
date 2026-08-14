"use client";

import { MultiSelect } from "@/components/ui/multi-select";
import { attrsFor, attrLabelKey, attrValueLabelKey, isOpenList } from "@/lib/ad-channel-attrs";

type Translate = (key: string) => string;

/** Renders the right control for every attribute AD_CHANNEL_ATTRS lists for
 *  `channelCode` — a select, a multiselect, a number box or a checkbox, same
 *  four AdAttrType cases normalizeAttrs() gates on the way back in. Shared by
 *  the ad-space form (one channel at a time — the seven AD_SPACE channels)
 *  and the project form (PLACEMENT and EVENTS at once, since a project isn't
 *  pinned to a single channel the way an AdSpace row is), so a tenth channel
 *  or a reworded attribute is a change to ad-channel-attrs.ts alone, not to
 *  two forms (2026-08-14, stage 3). Renders nothing when there's nothing to
 *  show (an unpicked channel, or one not yet in the directory).
 *
 *  `value`/`onChange` carry the raw, not-yet-normalized record — same
 *  "redisplay what the editor typed" contract as the rest of these forms;
 *  normalizeAttrs runs once, at the write boundary. Callers own the label/
 *  input classes so this matches whichever form it's dropped into instead of
 *  bringing its own (divergent) styling. */
export function AttrFields({
  channelCode,
  excludeKeys,
  value,
  onChange,
  t,
  inputCls,
  labelCls,
}: {
  channelCode: string | readonly string[];
  /** Keys to leave out even though the channel(s) carry them — the project
   *  form's eventCategory has its own dedicated field (a first-class
   *  Project column, not part of `attrs`), so it's excluded here rather than
   *  rendered a second time as a generic attribute. */
  excludeKeys?: readonly string[];
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  t: Translate;
  inputCls: string;
  labelCls: string;
}) {
  const codes = Array.isArray(channelCode) ? channelCode : [channelCode as string];
  const seen = new Set<string>();
  const defs = codes
    .flatMap((c) => attrsFor(c))
    .filter((def) => {
      if (excludeKeys?.includes(def.key) || seen.has(def.key)) return false;
      seen.add(def.key);
      return true;
    });
  if (defs.length === 0) return null;

  const set = (key: string, v: unknown) => onChange({ ...value, [key]: v });

  return (
    <>
      {defs.map((def) => {
        const label = t(attrLabelKey(def.key));
        const current = value[def.key];

        if (def.type === "boolean") {
          return (
            <label key={def.key} className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={current === true}
                onChange={(e) => set(def.key, e.target.checked)}
                className="h-4 w-4"
              />
              {label}
            </label>
          );
        }

        if (def.type === "number") {
          return (
            <div key={def.key}>
              <span className={labelCls}>{label}</span>
              <input
                type="number"
                min={0}
                value={typeof current === "number" ? current : ""}
                onChange={(e) => set(def.key, e.target.value === "" ? undefined : Number(e.target.value))}
                className={inputCls}
              />
            </div>
          );
        }

        if (def.type === "multiselect") {
          const selected = Array.isArray(current) ? current.map(String) : [];
          return (
            <div key={def.key}>
              <span className={labelCls}>{label}</span>
              <MultiSelect
                options={
                  isOpenList(def)
                    ? selected
                    : (def.values ?? []).map((v) => ({ value: v, label: t(attrValueLabelKey(def.key, v)) }))
                }
                value={selected}
                onChange={(v) => set(def.key, v)}
                allowCustom={isOpenList(def)}
                addLabel={t("ui.addOption")}
                removeLabel={t("ui.remove")}
              />
            </div>
          );
        }

        // "select" — an open list (values: [], e.g. district/route) gets a
        // plain text box instead: the closed set doesn't exist, the owner
        // types whatever this one's district/route actually is.
        if (isOpenList(def)) {
          return (
            <div key={def.key}>
              <span className={labelCls}>{label}</span>
              <input
                value={typeof current === "string" ? current : ""}
                onChange={(e) => set(def.key, e.target.value)}
                className={inputCls}
              />
            </div>
          );
        }

        return (
          <div key={def.key}>
            <span className={labelCls}>{label}</span>
            <select
              value={typeof current === "string" ? current : ""}
              onChange={(e) => set(def.key, e.target.value)}
              className={inputCls}
            >
              <option value="">—</option>
              {(def.values ?? []).map((v) => (
                <option key={v} value={v}>
                  {t(attrValueLabelKey(def.key, v))}
                </option>
              ))}
            </select>
          </div>
        );
      })}
    </>
  );
}
