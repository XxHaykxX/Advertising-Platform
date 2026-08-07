"use client";

import { AlertTriangle } from "lucide-react";
import { flashField } from "@/lib/field-flash";

export type FormSection = {
  /** The `id` of the <section> to scroll to — e.g. "sec-about". */
  id: string;
  label: string;
  /** True when the section still holds something that blocks publication.
   *  Fed from the form's own live publish-gap set, so it updates as you type. */
  gap?: boolean;
};

/** Jump-to-section strip for the project form.
 *
 *  The form is ~11 000px tall and had exactly one way to navigate it: the
 *  completeness checklist in the sidebar, which only appears when editing a
 *  saved project and only links the items that are still empty. Filling in a
 *  section you already dealt with meant scrolling for it.
 *
 *  Rendered as a second row inside the form's existing sticky bar, so there is
 *  no second sticky element and no offset arithmetic between them. Scrolling
 *  and the ~2s highlight are the same flashField() the checklist uses. */
export function FormSectionNav({
  sections,
  label = "Form sections",
}: {
  sections: FormSection[];
  /** Localized by the caller for the creator's form; the admin panel is
   *  English-only and keeps the default. It is the only name a screen reader
   *  has for this strip. */
  label?: string;
}) {
  return (
    <nav
      aria-label={label}
      className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-0.5 sm:-mx-6 sm:px-6 md:-mx-10 md:px-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {sections.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => flashField(s.id, "start")}
          // min-h-11 on touch widths: at py-1 these were 26px tall, well under
          // the 44px a finger needs, and they sit shoulder to shoulder in a
          // scrolling strip where a miss lands on the neighbour. Desktop keeps
          // the compact chip — a cursor doesn't need the padding, and the bar
          // is already 95px of a phone screen.
          className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors sm:min-h-0 ${
            s.gap
              ? "border-amber-300 bg-amber-50/60 text-amber-700 hover:border-amber-400"
              : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
          }`}
        >
          {s.label}
          {s.gap && <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />}
        </button>
      ))}
    </nav>
  );
}
