"use server";

// Server action backing the "Translate" button in testimonial-form.tsx.
// Reuses the SAME translateFields() engine as the portfolio/project translate
// actions — that helper is shaped around a {title, synopsis} pair, so a
// testimonial's `quote` rides in the `synopsis` slot and is mapped back to
// `quote` in the returned values. `title` is sent empty on purpose: a
// testimonial has no title field, and translateFields only throws
// "emptyFields" when title AND synopsis AND tagline are all blank, so an
// empty title alongside a filled quote translates fine.
import { requireContentEditor } from "@/lib/auth/require";
import { translateFields, TranslateError, type TranslateErrorCode, type TranslateLang } from "@/lib/translate";

const LANGS: readonly TranslateLang[] = ["hy", "ru", "en"];

export type TranslateTestimonialState = {
  ok?: boolean;
  // Short i18n code (translate.<code> in src/lib/i18n.ts) — never the raw
  // provider error, so the form can show a friendly localized message.
  errorCode?: TranslateErrorCode;
  values?: Partial<Record<TranslateLang, { quote: string }>>;
};

function isLang(v: string): v is TranslateLang {
  return (LANGS as readonly string[]).includes(v);
}

/** Translates a source quote into the other two site locales. Staff
 *  content-editor gate only (same as createTestimonial/updateTestimonial) —
 *  no DB writes here, the returned values are applied client-side and saved
 *  via the normal form submit. Never redirects; always returns a state
 *  object so the client can show a toast/error instead of crashing. */
export async function translateTestimonialAction(fd: FormData): Promise<TranslateTestimonialState> {
  await requireContentEditor();

  const sourceLangRaw = String(fd.get("sourceLang") || "");
  const quote = String(fd.get("quote") || "");

  if (!isLang(sourceLangRaw)) {
    return { errorCode: "genericError" };
  }

  try {
    const result = await translateFields({
      sourceLang: sourceLangRaw,
      title: "",
      synopsis: quote, // quote rides in the synopsis slot
      targets: LANGS.filter((l) => l !== sourceLangRaw),
    });
    const values: TranslateTestimonialState["values"] = {};
    for (const [lang, v] of Object.entries(result)) {
      values[lang as TranslateLang] = { quote: v.synopsis };
    }
    return { ok: true, values };
  } catch (e) {
    console.error("[translateTestimonialAction]", e);
    return { errorCode: e instanceof TranslateError ? e.code : "genericError" };
  }
}
