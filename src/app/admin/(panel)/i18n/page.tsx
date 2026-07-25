import { TriangleAlert } from "lucide-react";
import { requireTranslator } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { UI } from "@/lib/i18n";
import { contextLabel } from "@/lib/i18n-csv";
import { isChanged, type Values } from "@/lib/i18n-validate";
import { githubConfigured, githubRepoSlug } from "@/lib/github/contents";
import { TranslationsEditor, type LastPublish, type TranslationRow } from "./translations-editor";

/** Admin "Переводы интерфейса" — the in-admin replacement for the Google-Sheet
 *  round-trip: a translator edits the 855-key UI dictionary here (autosaved as
 *  UiDraft rows) and publishes it as one commit to src/lib/i18n.ts, which
 *  triggers the Hostinger rebuild. */
export default async function I18nPage() {
  await requireTranslator();

  const drafts = await pruneSettledDrafts();
  const draftByKey = new Map(drafts.map((d) => [d.key, d]));

  const rows: TranslationRow[] = Object.keys(UI).map((key) => {
    const code = UI[key];
    const d = draftByKey.get(key);
    const draft: Values | null = d ? { hy: d.hy, ru: d.ru, en: d.en } : null;
    return {
      key,
      context: contextLabel(key),
      code,
      draft,
      mark: d?.mark ?? "NONE",
      note: d?.note ?? "",
      publishedAt: d?.publishedAt?.toISOString() ?? null,
      dirty: draft !== null && isChanged(draft, code),
    };
  });

  const last = await prisma.i18nPublish.findFirst({
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });
  const lastPublish: LastPublish | null = last
    ? {
        at: last.createdAt.toISOString(),
        by: last.user?.name || "—",
        keyCount: last.keyCount,
        commitUrl: last.commitUrl,
      }
    : null;

  const configured = githubConfigured();

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground md:text-3xl">Переводы интерфейса</h1>
      <p className="mt-2 max-w-3xl text-muted-foreground">
        {rows.length} ключей интерфейса на трёх языках. Правки сохраняются автоматически, но на
        сайт попадают только после кнопки «Сохранить и опубликовать» — она пересобирает сайт,
        это занимает около 5 минут.
      </p>

      {!configured && (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-warn/40 bg-warn/10 px-4 py-3 text-sm text-warn">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Публикация недоступна: не задан <code className="font-mono">GITHUB_SYNC_TOKEN</code>.
            Правки сохраняются как черновики и никуда не потеряются — опубликовать их можно будет
            сразу после настройки токена.
          </span>
        </p>
      )}

      <TranslationsEditor
        rows={rows}
        configured={configured}
        repo={githubRepoSlug()}
        lastPublish={lastPublish}
      />
    </div>
  );
}

/**
 * Delete the working copies the deployed dictionary has caught up with, then
 * return the ones worth showing.
 *
 * A published draft keeps differing from `UI` until the Hostinger build lands
 * (that's the "опубликовано, ждёт сборки" state). Once the values match, the
 * row is dropped — unless it carries a colour mark or a note: that's the
 * translator's own review state (it replaced the row colouring she did in the
 * Sheet) and it has to survive publishing. Such a row does get its
 * `publishedAt` cleared, so the editor stops claiming it waits for a build.
 *
 * Both writes are fenced with `updatedAt <= readAt`: this runs while the page
 * renders, so a second tab (or a prefetch) can prune concurrently and an
 * autosave can land between the read and the write. The fence makes those
 * writes skip any row that was touched in the meantime — a fresh draft can
 * never be deleted on the strength of the values we read a moment ago.
 */
async function pruneSettledDrafts() {
  const readAt = new Date();
  const drafts = await prisma.uiDraft.findMany({ orderBy: { key: "asc" } });

  const drop: string[] = []; // nothing left to remember
  const landed: string[] = []; // marked/annotated, but the build caught up
  for (const d of drafts) {
    const code = UI[d.key];
    if (!code) {
      drop.push(d.key); // orphan: the key no longer exists in the code
      continue;
    }
    if (isChanged({ hy: d.hy, ru: d.ru, en: d.en }, code)) continue;
    if (d.mark === "NONE" && !d.note) drop.push(d.key);
    else if (d.publishedAt !== null) landed.push(d.key);
  }

  if (drop.length > 0) {
    await prisma.uiDraft.deleteMany({
      where: { key: { in: drop }, updatedAt: { lte: readAt } },
    });
  }
  if (landed.length > 0) {
    await prisma.uiDraft.updateMany({
      where: { key: { in: landed }, updatedAt: { lte: readAt } },
      data: { publishedAt: null },
    });
  }
  if (drop.length === 0 && landed.length === 0) return drafts;

  return drafts
    .filter((d) => !drop.includes(d.key))
    .map((d) => (landed.includes(d.key) ? { ...d, publishedAt: null } : d));
}
