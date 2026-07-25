"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTranslator } from "@/lib/auth/require";
import { UI } from "@/lib/i18n";
import {
  isChanged,
  validateBatch,
  validateEntry,
  type ValidationIssue,
  type Values,
} from "@/lib/i18n-validate";
import { DictionaryDriftError, rewriteDictionarySource } from "@/lib/i18n-rewrite";
import { commitRepoFile, readRepoFile } from "@/lib/github/contents";
import { asMark, type Mark } from "./mark";

/* Actions behind /admin/i18n — the in-admin UI-dictionary editor.

   A translator's edits live in the `UiDraft` table (autosaved per row); the
   committed src/lib/i18n.ts stays the source of truth until she clicks
   publish, which rewrites that file through the GitHub Contents API and lets
   Hostinger's git auto-deploy rebuild the site. Every action re-gates
   requireTranslator() — the pages hide themselves from other roles, but the
   actions are their own entry point. */

/** Path of the dictionary inside the repo — both read and written by publish. */
const DICT_PATH = "src/lib/i18n.ts";

/** Keys listed in full in the commit body before it collapses to a count. */
const COMMIT_KEY_LIST_MAX = 20;

/** Rows written per DB transaction by saveDraftsBulk (CSV import). */
const BULK_CHUNK = 100;

export type SaveDraftInput = {
  key: string;
  hy: string;
  ru: string;
  en: string;
  mark: Mark;
  note: string;
};

/** `issues` is advisory — the draft is stored either way, so a half-finished
 *  row can be left for later; only publishing is blocked by them. */
export type SaveDraftResult = { ok: true; issues: ValidationIssue[] } | { error: string };

/** `skipped` = keys the code no longer has; they are reported, never written. */
export type SaveDraftsBulkResult =
  | { ok: true; saved: number; skipped: string[]; issues: ValidationIssue[] }
  | { error: string };

export type PublishResult =
  | { ok: true; commitUrl: string; commitSha: string; keyCount: number }
  | { error: string; issues?: ValidationIssue[] };

/** Russian message of a thrown Error (the GitHub client already speaks it). */
function errorMessage(e: unknown, fallback: string): string {
  return e instanceof Error && e.message ? e.message : fallback;
}

/**
 * Upsert one dictionary row's working copy. Called on every (debounced)
 * keystroke from the editor, so it stays cheap and never throws for bad
 * content: validation issues come back as data for the row to render.
 */
export async function saveDraft(input: SaveDraftInput): Promise<SaveDraftResult> {
  const user = await requireTranslator();

  const key = String(input.key);
  const reference = UI[key];
  // The key set of the dictionary belongs to the code, not to the translator.
  if (!reference) return { error: "Неизвестный ключ — его нет в словаре кода" };

  const values: Values = { hy: input.hy, ru: input.ru, en: input.en };
  const mark = asMark(input.mark);
  const note = input.note.trim();
  const issues = validateEntry(key, values, reference);

  // Nothing left to remember (values back to the committed ones, no note, no
  // mark) → drop the row instead of storing an empty draft.
  if (!isChanged(values, reference) && note === "" && mark === "NONE") {
    await prisma.uiDraft.deleteMany({ where: { key } });
    return { ok: true, issues };
  }

  // Keep `publishedAt` when only the mark/note moved: those don't change what
  // was committed, so the row is still "published, awaiting the rebuild". Any
  // text edit clears it — the commit no longer matches.
  const existing = await prisma.uiDraft.findUnique({ where: { key } });
  const textUntouched =
    existing !== null &&
    existing.hy === values.hy &&
    existing.ru === values.ru &&
    existing.en === values.en;

  await prisma.uiDraft.upsert({
    where: { key },
    create: { key, ...values, mark, note: note || null, updatedById: user.id },
    update: {
      ...values,
      mark,
      note: note || null,
      updatedById: user.id,
      ...(textUntouched ? {} : { publishedAt: null }),
    },
  });

  return { ok: true, issues };
}

/**
 * Save many rows in one round-trip — the CSV import applies up to 855 keys, and
 * one request per key would be both slow and a burst of DB connections.
 *
 * Same per-row rules as saveDraft (unknown key skipped, empty draft dropped,
 * `publishedAt` cleared when the text moved), just batched: reads the affected
 * rows once, then writes them in transactions of BULK_CHUNK.
 */
export async function saveDraftsBulk(inputs: SaveDraftInput[]): Promise<SaveDraftsBulkResult> {
  const user = await requireTranslator();
  if (inputs.length === 0) return { ok: true, saved: 0, skipped: [], issues: [] };

  const skipped: string[] = [];
  const issues: ValidationIssue[] = [];
  const prepared: { key: string; values: Values; mark: Mark; note: string }[] = [];

  for (const input of inputs) {
    const key = String(input.key);
    const reference = UI[key];
    if (!reference) {
      skipped.push(key);
      continue;
    }
    const values: Values = { hy: input.hy, ru: input.ru, en: input.en };
    issues.push(...validateEntry(key, values, reference));
    prepared.push({ key, values, mark: asMark(input.mark), note: input.note.trim() });
  }
  if (prepared.length === 0) return { ok: true, saved: 0, skipped, issues };

  const existing = new Map(
    (
      await prisma.uiDraft.findMany({
        where: { key: { in: prepared.map((p) => p.key) } },
        select: { key: true, hy: true, ru: true, en: true },
      })
    ).map((d) => [d.key, d]),
  );

  const drop: string[] = [];
  const writes: ReturnType<typeof prisma.uiDraft.upsert>[] = [];
  for (const p of prepared) {
    const reference = UI[p.key];
    if (!isChanged(p.values, reference) && p.note === "" && p.mark === "NONE") {
      drop.push(p.key);
      continue;
    }
    const prev = existing.get(p.key);
    const textUntouched =
      prev !== undefined &&
      prev.hy === p.values.hy &&
      prev.ru === p.values.ru &&
      prev.en === p.values.en;
    writes.push(
      prisma.uiDraft.upsert({
        where: { key: p.key },
        create: { key: p.key, ...p.values, mark: p.mark, note: p.note || null, updatedById: user.id },
        update: {
          ...p.values,
          mark: p.mark,
          note: p.note || null,
          updatedById: user.id,
          ...(textUntouched ? {} : { publishedAt: null }),
        },
      }),
    );
  }

  try {
    if (drop.length > 0) await prisma.uiDraft.deleteMany({ where: { key: { in: drop } } });
    for (let i = 0; i < writes.length; i += BULK_CHUNK) {
      await prisma.$transaction(writes.slice(i, i + BULK_CHUNK));
    }
  } catch (e) {
    return { error: errorMessage(e, "Не удалось сохранить часть строк — попробуйте ещё раз") };
  }

  return { ok: true, saved: prepared.length, skipped, issues };
}

/** Drop a row's working copy entirely — the editor's "back to the code" button. */
export async function discardDraft(key: string): Promise<{ ok: true }> {
  await requireTranslator();
  await prisma.uiDraft.deleteMany({ where: { key: String(key) } });
  return { ok: true };
}

/** Commit subject + body: the keys carried, capped so a 400-key publish
 *  doesn't produce a wall of text in git log. */
function commitMessage(keys: string[]): string {
  const shown = keys.slice(0, COMMIT_KEY_LIST_MAX);
  const rest = keys.length - shown.length;
  const list = shown.map((k) => `- ${k}`);
  if (rest > 0) list.push(`…и ещё ${rest}`);
  return [
    `chore(i18n): update ${keys.length} keys from the admin editor`,
    "",
    ...list,
    "",
    "Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>",
  ].join("\n");
}

/**
 * Write every changed draft into src/lib/i18n.ts on GitHub as one commit.
 *
 * `UI` here is the dictionary of *this* deploy, which is exactly what
 * rewriteDictionarySource needs as `current` — if the remote file has drifted
 * from it (another deploy mid-flight, a hand edit), the rewrite can't locate
 * an entry and throws rather than corrupting the file.
 */
export async function publishTranslations(): Promise<PublishResult> {
  const user = await requireTranslator();

  const drafts = await prisma.uiDraft.findMany({ orderBy: { key: "asc" } });
  const updates = new Map<string, Values>();
  for (const d of drafts) {
    const reference = UI[d.key];
    // Orphan row (key gone from the code) — nothing to write for it.
    if (!reference) continue;
    const values: Values = { hy: d.hy, ru: d.ru, en: d.en };
    if (isChanged(values, reference)) updates.set(d.key, values);
  }
  if (updates.size === 0) return { error: "Нет изменений для публикации" };

  const issues = validateBatch(updates, UI);
  if (issues.length > 0) {
    return { error: "Публикация отменена: исправьте ошибки в переводах", issues };
  }

  let file: { content: string; sha: string };
  try {
    file = await readRepoFile(DICT_PATH);
  } catch (e) {
    return { error: errorMessage(e, "Не удалось прочитать словарь на GitHub") };
  }

  let rewritten: ReturnType<typeof rewriteDictionarySource>;
  try {
    rewritten = rewriteDictionarySource(file.content, updates, UI);
  } catch (e) {
    // DictionaryDriftError (and any other rewrite failure) means the remote
    // file no longer matches the dictionary this build was compiled with —
    // writing anyway would corrupt it or revert someone else's publish.
    if (e instanceof DictionaryDriftError) console.error("i18n publish drift", e.key, e.message);
    return {
      error:
        "Файл словаря на GitHub изменился (возможно, идёт другой деплой) — обновите страницу",
    };
  }
  if (rewritten.changed.length === 0) {
    return { error: "На GitHub уже актуальные значения" };
  }

  let commit: { commitSha: string; commitUrl: string };
  try {
    commit = await commitRepoFile({
      path: DICT_PATH,
      content: rewritten.source,
      sha: file.sha,
      message: commitMessage(rewritten.changed),
    });
  } catch (e) {
    return { error: errorMessage(e, "Не удалось записать словарь на GitHub") };
  }

  // Stamp the published rows: they still differ from the *running* build for
  // the few minutes Hostinger needs, and the editor shows that as
  // "опубликовано, ждёт сборки" instead of an unsaved edit.
  //
  // The commit is already in git at this point, so a failure here is only a
  // bookkeeping loss: reporting it as an error would send the translator into a
  // second click and an empty commit ("На GitHub уже актуальные значения").
  const publishedAt = new Date();
  try {
    await prisma.$transaction([
      prisma.i18nPublish.create({
        data: {
          userId: user.id,
          keyCount: rewritten.changed.length,
          commitSha: commit.commitSha,
          commitUrl: commit.commitUrl,
        },
      }),
      prisma.uiDraft.updateMany({
        where: { key: { in: rewritten.changed } },
        data: { publishedAt },
      }),
    ]);
  } catch (e) {
    console.error("i18n publish committed but the journal write failed", commit.commitSha, e);
  }

  revalidatePath("/admin/i18n");
  return {
    ok: true,
    commitUrl: commit.commitUrl,
    commitSha: commit.commitSha,
    keyCount: rewritten.changed.length,
  };
}
