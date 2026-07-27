/* Fill the missing per-locale spellings of cast/crew names (2026-07-27).
 *
 * Person owns nameHy/nameRu/nameEn; the migration that added those columns
 * could only guess two of them (Armenian script → nameHy, Latin → nameEn) and
 * deliberately left nameRu empty rather than invent a Cyrillic form — so on
 * prod the Russian site still falls back to the English spelling for everyone.
 * This is the batch version of the directory's per-row "fill" button.
 *
 * Only EMPTY columns are written. A spelling somebody typed by hand always
 * wins over the model's — same rule as spellPersonName in the admin action.
 *
 * Actor rows carry a snapshot of these names (that is what the report page
 * renders), so every touched Person's actors are re-synced here too. The
 * public pages are behind unstable_cache with a 300s window, so the change
 * shows up within five minutes; nothing here can bust a remote cache.
 *
 * The transliteration prompt is a copy of transliterateName's in
 * src/lib/translate.ts — that module is "server-only" and cannot be imported
 * into a plain node script. Keep the two in sync if the prompt changes.
 *
 * Usage:
 *   DATABASE_URL=… GOOGLE_AI_API_KEY=… npx tsx scripts/fill-person-names.ts [--apply]
 *
 * Without --apply it is a dry run: it prints what it would write and touches
 * nothing. Point DATABASE_URL at prod only when you mean it.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const TIMEOUT_MS = 18_000;

type Spellings = { hy: string; ru: string; en: string };

/** Same fallback chain the app uses to pick a display name (pickPersonName). */
const ARMENIAN = /[԰-֏]/;
const CYRILLIC = /[Ѐ-ӿ]/;

function sourceLangOf(name: string): "hy" | "ru" | "en" {
  if (ARMENIAN.test(name)) return "hy";
  if (CYRILLIC.test(name)) return "ru";
  return "en";
}

function models(): string[] {
  const configured = process.env.GOOGLE_AI_MODEL?.trim();
  // Same sweep as translate.ts: the configured model first, then the ones this
  // key is known to answer on, so one retired alias doesn't stop the batch.
  return [configured, "gemini-flash-latest", "gemini-2.5-flash"].filter(
    (m): m is string => !!m,
  );
}

async function transliterateOnce(name: string, lang: string, model: string): Promise<Spellings> {
  const key = process.env.GOOGLE_AI_API_KEY;
  if (!key) throw new Error("GOOGLE_AI_API_KEY is not set");
  const langName = lang === "hy" ? "Armenian" : lang === "ru" ? "Russian" : "English";
  const prompt =
    `Transliterate the personal name below (it is written in ${langName}) into all three scripts: ` +
    `Armenian, Russian (Cyrillic) and English (Latin). This is a person, so do NOT translate the meaning — ` +
    `write the same name the way it is conventionally spelled in each language in Armenia. ` +
    `Use the standard Armenian surname endings (-յան / -ян / -yan). Keep the given-name + surname order. ` +
    `Return strictly a JSON object shaped {"hy": "...", "ru": "...", "en": "..."} with no commentary or markdown.\n\n` +
    `Name: ${name}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}/${model}:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const text: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("no content");
    const obj = JSON.parse(text.replace(/```(?:json)?|```/g, "").trim());
    const pick = (k: string) => (typeof obj?.[k] === "string" ? obj[k].trim() : "");
    return { hy: pick("hy"), ru: pick("ru"), en: pick("en") };
  } finally {
    clearTimeout(timer);
  }
}

async function transliterate(name: string, lang: string): Promise<Spellings> {
  let last: unknown;
  for (const model of models()) {
    try {
      return await transliterateOnce(name, lang, model);
    } catch (e) {
      last = e;
    }
  }
  throw last;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const people = await prisma.person.findMany({
    select: { id: true, name: true, nameHy: true, nameRu: true, nameEn: true },
    orderBy: { id: "asc" },
  });

  const todo = people.filter((p) => !p.nameHy.trim() || !p.nameRu.trim() || !p.nameEn.trim());
  console.log(`${people.length} people, ${todo.length} with a missing spelling${apply ? "" : " (dry run)"}`);

  let written = 0;
  let actorsSynced = 0;
  for (const p of todo) {
    // Ask in the script the name is actually written in — a Cyrillic name fed
    // to the model as "Armenian" comes back mangled.
    const base = (p.nameHy || p.nameEn || p.nameRu || p.name).trim();
    if (!base) continue;

    let out: Spellings;
    try {
      out = await transliterate(base, sourceLangOf(base));
    } catch (e) {
      console.error(`  #${p.id} ${base}: FAILED — ${e instanceof Error ? e.message : e}`);
      continue;
    }

    // Never overwrite a spelling a human typed.
    const patch: Record<string, string> = {};
    if (!p.nameHy.trim() && out.hy) patch.nameHy = out.hy;
    if (!p.nameRu.trim() && out.ru) patch.nameRu = out.ru;
    if (!p.nameEn.trim() && out.en) patch.nameEn = out.en;
    if (!Object.keys(patch).length) continue;

    console.log(`  #${p.id} ${base} → ${JSON.stringify(patch)}`);
    if (!apply) continue;

    const updated = await prisma.person.update({ where: { id: p.id }, data: patch });
    written++;
    // Actor rows snapshot the directory (see syncActorNames in the admin
    // action) — without this the report pages keep the old spelling forever.
    const { count } = await prisma.actor.updateMany({
      where: { personId: p.id },
      data: {
        name: updated.name,
        nameHy: updated.nameHy,
        nameRu: updated.nameRu,
        nameEn: updated.nameEn,
      },
    });
    actorsSynced += count;
  }

  console.log(
    apply
      ? `done — ${written} people updated, ${actorsSynced} actor rows re-synced`
      : "dry run finished — rerun with --apply to write",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
