"use server";

// Server action backing the "Translate" button in portfolio-form.tsx (#41).
// Reuses the SAME translateFields() engine as the project form's translate
// action — that helper is shaped around a {title, synopsis} pair, so a
// portfolio case's `description` rides in the `synopsis` slot and is mapped
// back to `description` in the returned values. Kept out of actions.ts so the
// CRUD file stays untouched.
import { requireContentEditor } from "@/lib/auth/require";
import { translateFields, TranslateError, type TranslateErrorCode, type TranslateLang } from "@/lib/translate";

const LANGS: readonly TranslateLang[] = ["hy", "ru", "en"];

export type TranslatePortfolioState = {
  ok?: boolean;
  // Short i18n code (translate.<code> in src/lib/i18n.ts) — never the raw
  // provider error, so the form can show a friendly localized message (#30).
  errorCode?: TranslateErrorCode;
  values?: Partial<Record<TranslateLang, { title: string; description: string }>>;
};

function isLang(v: string): v is TranslateLang {
  return (LANGS as readonly string[]).includes(v);
}

/** Translates a source title/description into the other two site locales.
 *  Staff content-editor gate only (same as createPortfolio/updatePortfolio) —
 *  no DB writes here, the returned values are applied client-side and saved via
 *  the normal form submit. Never redirects; always returns a state object so
 *  the client can show a toast/error instead of crashing. */
export async function translatePortfolioAction(fd: FormData): Promise<TranslatePortfolioState> {
  await requireContentEditor();

  const sourceLangRaw = String(fd.get("sourceLang") || "");
  const title = String(fd.get("title") || "");
  const description = String(fd.get("description") || "");

  if (!isLang(sourceLangRaw)) {
    return { errorCode: "genericError" };
  }

  try {
    const result = await translateFields({
      sourceLang: sourceLangRaw,
      title,
      synopsis: description, // description rides in the synopsis slot
      targets: LANGS.filter((l) => l !== sourceLangRaw),
    });
    const values: TranslatePortfolioState["values"] = {};
    for (const [lang, v] of Object.entries(result)) {
      values[lang as TranslateLang] = { title: v.title, description: v.synopsis };
    }
    return { ok: true, values };
  } catch (e) {
    console.error("[translatePortfolioAction]", e);
    return { errorCode: e instanceof TranslateError ? e.code : "genericError" };
  }
}
