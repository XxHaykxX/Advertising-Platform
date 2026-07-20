"use client";

import { Plus, Trash2 } from "lucide-react";
import { ImageUploader } from "./image-uploader";
import type { MediaPickerScope } from "@/components/media-picker";
import type { PersonSuggestion } from "@/lib/data/actors";
import type { makeUI } from "@/lib/i18n";

// Controlled cast/crew section (#20²). Rewritten from a standalone <form> +
// saveActors action into a presentational section whose rows are owned by the
// parent ProjectForm — so cast/crew now save together with the main project in
// a single submit (no more two-step create→edit, no nested <form>). The parent
// mirrors `value` into a hidden `actorsRows` input; createProject/updateProject
// persist it transactionally.
export type ActorRow = { name: string; role: string; kind: string; photo: string };

export const EMPTY_ACTOR: ActorRow = { name: "", role: "", kind: "CAST", photo: "" };

const inputCls =
  "w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary";
const miniLabelCls = "mb-1 block text-xs text-muted-foreground";

export function ActorsSection({
  value,
  onChange,
  knownPeople = [],
  t,
  scope = "staff",
}: {
  value: ActorRow[];
  onChange: (rows: ActorRow[]) => void;
  scope?: MediaPickerScope;
  /** People previously entered on any project (#11) — backs a <datalist>
   *  autocomplete on the Name field. Picking (or exactly retyping) a known
   *  name autofills role/kind/photo for that row; the fields stay editable
   *  afterwards. */
  knownPeople?: PersonSuggestion[];
  /** ProjectForm's own locale-aware translator (#15) — "en" in admin mode,
   *  the creator's locale in mode="creator". Passed down rather than called
   *  fresh here so both sections always agree with the parent form. */
  t: ReturnType<typeof makeUI>;
}) {
  function update(i: number, patch: Partial<ActorRow>) {
    onChange(value.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  // Name changed → if it's an exact (case-insensitive) match for a known
  // person, autofill their last-known role/kind/photo alongside it. A
  // not-yet-known name (still being typed, or genuinely new) just updates
  // the name as normal.
  function updateName(i: number, name: string) {
    const match = knownPeople.find((p) => p.name.toLowerCase() === name.trim().toLowerCase());
    if (match) {
      update(i, { name, role: match.role, kind: match.kind, photo: match.photo });
    } else {
      update(i, { name });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {value.length} {t(value.length === 1 ? "projectForm.cast.member" : "projectForm.cast.members")}
        </p>
        <button
          type="button"
          onClick={() => onChange([...value, { ...EMPTY_ACTOR }])}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:border-primary/40"
        >
          <Plus className="h-3.5 w-3.5" /> {t("projectForm.cast.addMember")}
        </button>
      </div>

      {value.length === 0 && <p className="text-sm text-muted-foreground">{t("projectForm.cast.empty")}</p>}

      {/* Shared across every row — same option set, so one <datalist> does. */}
      {knownPeople.length > 0 && (
        <datalist id="known-people-list">
          {knownPeople.map((p) => (
            <option key={p.name} value={p.name}>
              {p.role}
            </option>
          ))}
        </datalist>
      )}

      {value.map((r, i) => (
        <div key={i} className="space-y-3 rounded-xl border border-border bg-section p-4">
          <div className="flex items-start gap-3">
            <div className="grid flex-1 gap-3 sm:grid-cols-3">
              <label className="block">
                <span className={miniLabelCls}>{t("projectForm.cast.name")}</span>
                <input
                  value={r.name}
                  onChange={(e) => updateName(i, e.target.value)}
                  list={knownPeople.length > 0 ? "known-people-list" : undefined}
                  placeholder={t("projectForm.cast.namePlaceholder")}
                  className={inputCls}
                />
              </label>
              <label className="block">
                <span className={miniLabelCls}>{t("projectForm.cast.role")}</span>
                <input value={r.role} onChange={(e) => update(i, { role: e.target.value })} className={inputCls} />
              </label>
              <label className="block">
                <span className={miniLabelCls}>{t("projectForm.cast.kind")}</span>
                <select value={r.kind} onChange={(e) => update(i, { kind: e.target.value })} className={inputCls}>
                  <option value="CAST">{t("projectForm.cast.kindCast")}</option>
                  <option value="CREW">{t("projectForm.cast.kindCrew")}</option>
                </select>
              </label>
            </div>
            <button
              type="button"
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-primary"
              aria-label={t("projectForm.remove")}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div>
            <span className={miniLabelCls}>{t("projectForm.cast.photo")}</span>
            {/* ImageUploader seeds its preview from `initial` only at mount
                (it's otherwise uncontrolled) — key it on the current photo so
                an autofill from a known person (which sets r.photo without
                the user touching this uploader) remounts it with the new
                preview instead of silently going stale. */}
            <ImageUploader
              key={r.photo}
              dir="actors"
              scope={scope}
              browseLabel={t("btn.browse")}
              initial={r.photo}
              label={r.photo ? t("projectForm.cast.replacePhoto") : t("projectForm.cast.uploadPhoto")}
              removeLabel={t("ui.remove")}
              onChange={(paths) => update(i, { photo: paths[0] ?? "" })}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
