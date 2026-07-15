"use server";

// Server action backing the "Translate" button in project-form.tsx (#21).
// Kept out of actions.ts so the large create/update file stays untouched.
import { requireContentEditor } from "@/lib/auth/require";
import { translateFields, TranslateError, type TranslateErrorCode, type TranslateLang } from "@/lib/translate";

const LANGS: readonly TranslateLang[] = ["hy", "ru", "en"];

export type TranslateProjectState = {
  ok?: boolean;
  // Short i18n code (translate.<code> in src/lib/i18n.ts) — never the raw
  // provider error, so the form can show a friendly localized message (#30).
  errorCode?: TranslateErrorCode;
  values?: Partial<Record<TranslateLang, { title: string; synopsis: string }>>;
};

function isLang(v: string): v is TranslateLang {
  return (LANGS as readonly string[]).includes(v);
}

/** Translates a source title/synopsis into the other two site locales.
 *  Staff content-editor gate only (same as createProject/updateProject) — no
 *  DB writes here, the returned values are applied client-side and saved via
 *  the normal form submit. Never redirects; always returns a state object so
 *  the client can show a toast/error instead of crashing. */
export async function translateProjectAction(fd: FormData): Promise<TranslateProjectState> {
  await requireContentEditor();

  const sourceLangRaw = String(fd.get("sourceLang") || "");
  const title = String(fd.get("title") || "");
  const synopsis = String(fd.get("synopsis") || "");

  if (!isLang(sourceLangRaw)) {
    return { errorCode: "genericError" };
  }

  try {
    const result = await translateFields({
      sourceLang: sourceLangRaw,
      title,
      synopsis,
      targets: LANGS.filter((l) => l !== sourceLangRaw),
    });
    return { ok: true, values: result };
  } catch (e) {
    console.error("[translateProjectAction]", e);
    return { errorCode: e instanceof TranslateError ? e.code : "genericError" };
  }
}
