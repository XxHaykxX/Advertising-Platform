"use server";

// Member-gated twin of admin/(panel)/ad-spaces/translate-action.ts — same
// mapping, different trust zone, deliberately not shared: an export of a
// "use server" module IS a public RPC endpoint, so the two gates cannot sit
// behind one exported helper. Only the state type is imported (type-only,
// erased at compile time).
import { requireMember } from "@/lib/auth/require";
import { canSell } from "@/lib/auth/capabilities";
import { translateFields, TranslateError, type TranslateLang } from "@/lib/translate";
import type { TranslateAdSpaceState } from "@/app/admin/(panel)/ad-spaces/translate-shared";

const LANGS: readonly TranslateLang[] = ["hy", "ru", "en"];

function isLang(v: string): v is TranslateLang {
  return (LANGS as readonly string[]).includes(v);
}

export async function translateCreatorAdSpaceAction(fd: FormData): Promise<TranslateAdSpaceState> {
  const user = await requireMember();
  // Defense in depth: the cabinet hides ad spaces from BRAND accounts, but a
  // hand-made POST has to be refused, same as createCreatorAdSpace.
  if (!canSell(user)) return { errorCode: "genericError" };

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
    console.error("[translateCreatorAdSpaceAction]", e);
    return { errorCode: e instanceof TranslateError ? e.code : "genericError" };
  }
}
