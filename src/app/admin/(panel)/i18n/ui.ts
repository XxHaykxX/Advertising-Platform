/* Shared look of the translation editor: the Tailwind class strings and the
   column layout used by both the editor shell (filters, table head) and the row
   components in rows.tsx. Plain constants — kept out of both files so neither
   has to import the other. */

import type { Locale } from "@/lib/i18n";

// Armenian first — it's the site's default locale and the one being written.
export const EDIT_LOCALES: { loc: Locale; label: string }[] = [
  { loc: "hy", label: "Армянский" },
  { loc: "ru", label: "Русский" },
  { loc: "en", label: "English" },
];

/** Genitive locale names for "Скопировать из …". */
export const LOCALE_SHORT: Record<Locale, string> = {
  hy: "армянского",
  ru: "русского",
  en: "английского",
};

/** Table columns: ключ | hy | ru | en | метка | ⋯ */
export const TABLE_COLS = 6;

export const fieldClass =
  "w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary/50";
export const chipClass =
  "cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors";
export const iconBtnClass =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-muted px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary";
export const squareBtnClass =
  "inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md border border-border bg-muted text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary";
export const thClass =
  "sticky top-0 z-10 border-b border-border bg-muted px-3 py-2 text-left text-xs font-semibold text-muted-foreground";
