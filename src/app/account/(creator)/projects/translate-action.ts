"use server";

// Server action backing the "Translate" button in project-form.tsx when it
// renders in mode="creator" (/account/projects/new) — twin of
// admin/(panel)/projects/translate-action.ts, member-gated instead of
// staff-gated. Same "different trust zone, deliberately not shared" reasoning
// as createCreatorProject in ./actions.ts; only the TranslateProjectState
// type is imported (type-only, erased at compile time) so this drops
// straight into ProjectForm's translateAction prop.
import { requireMember } from "@/lib/auth/require";
import { translateFields, TranslateError, type TranslateLang } from "@/lib/translate";
import type { TranslateProjectState } from "@/app/admin/(panel)/projects/translate-action";

const LANGS: readonly TranslateLang[] = ["hy", "ru", "en"];

function isLang(v: string): v is TranslateLang {
  return (LANGS as readonly string[]).includes(v);
}

/** Translates a source title/synopsis into the other two site locales.
 *  Member gate + CREATOR-role check (defense in depth — the button is hidden
 *  from BRAND accounts, which never reach this form). No DB writes here, same
 *  as the admin twin: the returned values are applied client-side and saved
 *  via the normal form submit. */
export async function translateCreatorProjectAction(fd: FormData): Promise<TranslateProjectState> {
  const user = await requireMember();
  if (user.role !== "CREATOR") {
    return { errorCode: "genericError" };
  }

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
    console.error("[translateCreatorProjectAction]", e);
    return { errorCode: e instanceof TranslateError ? e.code : "genericError" };
  }
}
