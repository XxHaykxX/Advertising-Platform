"use server";

// Server action backing the "Translate" button in ad-space-form.tsx — the
// ad-space twin of admin/(panel)/projects/translate-action.ts. An ad space is
// trilingual for the same reason a project is (a brand reads it in its own
// language), so it gets the same one-click hy→ru/en pass rather than leaving
// the owner to paste three versions by hand.
//
// A space has a title and a bullet-list description, not the project's
// title/synopsis/tagline triple, so `description` rides in translateFields'
// `synopsis` slot: it is the long free-text field, and the provider gets the
// joined bullets as one block, newlines intact.
//
// The creator twin in account/ad-spaces/translate-action.ts repeats this body
// rather than importing it: every export of a "use server" module is a public
// RPC endpoint, so a shared un-gated helper here would be callable by anyone.
import { requireContentEditor } from "@/lib/auth/require";
import { translateFields, TranslateError, type TranslateLang } from "@/lib/translate";
import type { TranslateAdSpaceState } from "./translate-shared";

const LANGS: readonly TranslateLang[] = ["hy", "ru", "en"];

function isLang(v: string): v is TranslateLang {
  return (LANGS as readonly string[]).includes(v);
}

export async function translateAdSpaceAction(fd: FormData): Promise<TranslateAdSpaceState> {
  await requireContentEditor();

  const sourceLangRaw = String(fd.get("sourceLang") || "");
  const title = String(fd.get("title") || "");
  const description = String(fd.get("description") || "");

  if (!isLang(sourceLangRaw)) return { errorCode: "genericError" };

  try {
    const result = await translateFields({
      sourceLang: sourceLangRaw,
      title,
      synopsis: description,
      targets: LANGS.filter((l) => l !== sourceLangRaw),
    });
    const values: TranslateAdSpaceState["values"] = {};
    for (const [lang, v] of Object.entries(result)) {
      values[lang as TranslateLang] = { title: v.title, description: v.synopsis };
    }
    return { ok: true, values };
  } catch (e) {
    console.error("[translateAdSpaceAction]", e);
    return { errorCode: e instanceof TranslateError ? e.code : "genericError" };
  }
}
