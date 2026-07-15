// Server-only. Auto-translates a project's title/synopsis across the site's
// three locales (hy/ru/en) via the Google Generative Language API (Gemini).
// Called from the admin project form's "Translate" button — see
// src/app/admin/(panel)/projects/translate-action.ts. Never crashes the
// caller: every failure surfaces as a TranslateError carrying a short i18n
// code (see TranslateErrorCode) so the form can show a friendly localized
// message instead of the raw provider JSON/HTTP body. The full detail is
// always console.error'd here for debugging — it never reaches the client.
//
// Model note (2026-07-15): the GOOGLE_AI_API_KEY in .env is valid (confirmed
// via a live ListModels + GenerateContent call), but this key's Google AI
// Studio project has retired the plain "gemini-2.5-flash" alias — calling it
// returns HTTP 404 "no longer available to new users". "gemini-flash-latest"
// and "gemini-3.1-flash-lite" both returned 200 for the same key. The default
// model name below still follows the spec (gemini-2.5-flash); set
// GOOGLE_AI_MODEL=gemini-flash-latest in .env to make the feature work today
// without touching this file.
import "server-only";

export type TranslateLang = "hy" | "ru" | "en";

/** Short codes the client maps to a localized `translate.<code>` i18n string
 *  (src/lib/i18n.ts) — never surface provider error text directly. */
export type TranslateErrorCode =
  | "emptyFields"
  | "notConfigured"
  | "busy"
  | "rateLimited"
  | "timeout"
  | "network"
  | "genericError";

export class TranslateError extends Error {
  code: TranslateErrorCode;
  constructor(code: TranslateErrorCode, message: string) {
    super(message);
    this.name = "TranslateError";
    this.code = code;
  }
}

const LANG_NAMES: Record<TranslateLang, string> = {
  hy: "Armenian",
  ru: "Russian",
  en: "English",
};

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const TIMEOUT_MS = 15_000;

function apiKey(): string {
  const key = process.env.GOOGLE_AI_API_KEY;
  if (!key) {
    console.error("[translate] GOOGLE_AI_API_KEY is not set.");
    throw new TranslateError("notConfigured", "Translation is not configured.");
  }
  return key;
}

function modelName(): string {
  return process.env.GOOGLE_AI_MODEL || "gemini-2.5-flash";
}

/** Strips a ```json ... ``` (or bare ```) fence the model sometimes wraps its
 *  answer in, then parses it into { title, synopsis }. Throws a readable
 *  Error if the result still isn't the expected shape. */
function parseTranslationJson(raw: string): { title: string; synopsis: string } {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const text = (fenced ? fenced[1] : raw).trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    console.error("[translate] response was not valid JSON:", text.slice(0, 500));
    throw new TranslateError("genericError", "Translation response was not valid JSON.");
  }
  const obj = parsed as Record<string, unknown>;
  if (typeof obj?.title !== "string" || typeof obj?.synopsis !== "string") {
    console.error("[translate] response missing title/synopsis:", text.slice(0, 500));
    throw new TranslateError("genericError", "Translation response is missing title/synopsis.");
  }
  return { title: obj.title, synopsis: obj.synopsis };
}

/** One generateContent call: translates a single title+synopsis pair from
 *  sourceLang to targetLang. */
async function translateOne(
  sourceLang: TranslateLang,
  targetLang: TranslateLang,
  title: string,
  synopsis: string,
): Promise<{ title: string; synopsis: string }> {
  const url = `${API_BASE}/${modelName()}:generateContent?key=${apiKey()}`;
  const prompt =
    `Translate the following film title and synopsis from ${LANG_NAMES[sourceLang]} to ${LANG_NAMES[targetLang]}. ` +
    `Return strictly a JSON object shaped {"title": "...", "synopsis": "..."} with no extra commentary or markdown. ` +
    `Preserve proper nouns (names, studios, brands) as-is.\n\n` +
    `Title: ${title}\nSynopsis: ${synopsis}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    });
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new TranslateError("timeout", `Translation to ${LANG_NAMES[targetLang]} timed out.`);
    }
    console.error(`[translate] network error (${targetLang}):`, e);
    throw new TranslateError("network", `Translation to ${LANG_NAMES[targetLang]} failed: network error.`);
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    // Log the full provider response for debugging — never forward it to the client.
    console.error(`[translate] HTTP ${res.status} (${targetLang}):`, body.slice(0, 1000));
    const overloaded = res.status === 503 || /UNAVAILABLE|high demand/i.test(body);
    const code: TranslateErrorCode = overloaded ? "busy" : res.status === 429 ? "rateLimited" : "genericError";
    throw new TranslateError(code, `Translation to ${LANG_NAMES[targetLang]} failed (HTTP ${res.status}).`);
  }

  const json = await res.json().catch(() => null);
  const text: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    console.error(`[translate] no content in response (${targetLang}):`, json);
    throw new TranslateError("genericError", `Translation to ${LANG_NAMES[targetLang]} returned no content.`);
  }

  return parseTranslationJson(text);
}

/** Translates title+synopsis from sourceLang into every language in
 *  `targets` (typically the other two site locales), in parallel. A single
 *  target failing doesn't drop the others — its slot is simply omitted from
 *  the result; only when *every* target fails does this throw (with the
 *  first error), so the caller always gets either partial results or a
 *  single readable Error, never a crash. */
export async function translateFields(args: {
  sourceLang: TranslateLang;
  title: string;
  synopsis: string;
  targets: TranslateLang[];
}): Promise<Record<string, { title: string; synopsis: string }>> {
  const { sourceLang, title, synopsis, targets } = args;
  if (!title.trim() && !synopsis.trim()) {
    throw new TranslateError("emptyFields", "Nothing to translate — fill in a title or synopsis first.");
  }

  const wanted = targets.filter((t) => t !== sourceLang);
  const settled = await Promise.allSettled(
    wanted.map(async (t) => [t, await translateOne(sourceLang, t, title, synopsis)] as const),
  );

  const out: Record<string, { title: string; synopsis: string }> = {};
  const errors: TranslateError[] = [];
  for (const r of settled) {
    if (r.status === "fulfilled") {
      const [lang, value] = r.value;
      out[lang] = value;
    } else {
      const reason = r.reason;
      errors.push(
        reason instanceof TranslateError
          ? reason
          : new TranslateError("genericError", reason instanceof Error ? reason.message : String(reason)),
      );
    }
  }
  if (errors.length && Object.keys(out).length === 0) {
    console.error("[translate] all targets failed:", errors.map((e) => e.message));
    throw errors[0];
  }
  return out;
}
