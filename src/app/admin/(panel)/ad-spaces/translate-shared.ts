/* The shape the Translate button hands back to the form. Its own module
   because both translate actions are "use server" files, which may only export
   async functions — a type exported from there would be fine at compile time
   and a build error the moment anything imported it as a value. */

import type { TranslateErrorCode, TranslateLang } from "@/lib/translate";

export type TranslateAdSpaceState = {
  ok?: boolean;
  /** Short i18n code (translate.<code>), never the raw provider message. */
  errorCode?: TranslateErrorCode;
  values?: Partial<Record<TranslateLang, { title: string; description: string }>>;
};
