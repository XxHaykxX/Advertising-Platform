"use client";

import { useCallback, useState } from "react";
import { Download, FileUp, Loader2, X } from "lucide-react";
import { buildCsv, diffLabel, planImport } from "./csv-io";
import type { ImportChange, ImportPlan, TransferRow } from "./csv-io";

/* "Выгрузил → поправил в Excel → загрузил": the file half of the editor.
   Downloads what the filters currently show, and never applies an upload
   blind — the preview dialog spells out what would change first. All the
   matching logic is the pure code in csv-io.ts. */

/** Keys listed one by one in the preview before it collapses to a count. */
const PREVIEW_LIMIT = 20;

type Progress = { done: number; total: number };
type Outcome = { saved: number; failed: number };

const btnClass =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary";

function today(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function CsvTransfer({
  count,
  getVisibleRows,
  getAllRows,
  onApply,
}: {
  /** How many rows the filters currently show (goes into the button label). */
  count: number;
  getVisibleRows: () => TransferRow[];
  getAllRows: () => Map<string, TransferRow>;
  onApply: (
    changes: ImportChange[],
    onProgress: (done: number, total: number) => void,
  ) => Promise<Outcome>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [plan, setPlan] = useState<{ fileName: string; plan: ImportPlan } | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const onDownload = useCallback(() => {
    const text = buildCsv(getVisibleRows());
    const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `i18n-${today()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [getVisibleRows]);

  const onFile = useCallback(
    async (file: File | null | undefined) => {
      setError(null);
      setOutcome(null);
      setProgress(null);
      if (!file) return;
      const text = await file.text();
      const res = planImport(text, getAllRows());
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setPlan({ fileName: file.name, plan: res.plan });
    },
    [getAllRows],
  );

  const onConfirm = useCallback(async () => {
    if (!plan) return;
    setProgress({ done: 0, total: plan.plan.changes.length });
    const res = await onApply(plan.plan.changes, (done, total) => setProgress({ done, total }));
    setProgress(null);
    setOutcome(res);
  }, [plan, onApply]);

  const close = useCallback(() => {
    setPlan(null);
    setProgress(null);
    setOutcome(null);
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={onDownload} className={btnClass}>
        <Download className="h-3.5 w-3.5" />
        Скачать CSV ({count})
      </button>

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void onFile(e.dataTransfer.files?.[0]);
        }}
        className={`${btnClass} border-dashed ${dragging ? "border-primary/60 text-primary" : ""}`}
      >
        <FileUp className="h-3.5 w-3.5" />
        Загрузить CSV
        <input
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            void onFile(e.target.files?.[0]);
            // Same file twice in a row must fire onChange again.
            e.target.value = "";
          }}
        />
      </label>

      <span className="text-xs text-muted-foreground">
        Скачивается то, что показывают фильтры. Файл можно править в Excel и загрузить обратно —
        сверху будет показано, что изменится.
      </span>

      {error && <span className="text-xs text-danger">{error}</span>}

      {plan && (
        <PreviewDialog
          fileName={plan.fileName}
          plan={plan.plan}
          progress={progress}
          outcome={outcome}
          onConfirm={onConfirm}
          onClose={close}
        />
      )}
    </div>
  );
}

function PreviewDialog({
  fileName,
  plan,
  progress,
  outcome,
  onConfirm,
  onClose,
}: {
  fileName: string;
  plan: ImportPlan;
  progress: Progress | null;
  outcome: Outcome | null;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const { changes, unknownKeys, unchanged, counts } = plan;
  const shown = changes.slice(0, PREVIEW_LIMIT);
  const busy = progress !== null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        data-lenis-prevent
        className="max-h-[80vh] w-full max-w-2xl overflow-auto rounded-2xl border border-border bg-card p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">Загрузка из файла</h2>
            <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">{fileName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Закрыть"
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-1 text-sm text-foreground">
          <p>
            Будет применено: <b>{changes.length}</b> ключей (изменено значений: hy {counts.hy} / ru{" "}
            {counts.ru} / en {counts.en}
            {counts.mark > 0 && `, метки: ${counts.mark}`}
            {counts.note > 0 && `, заметки: ${counts.note}`}).
          </p>
          <p className="text-muted-foreground">
            Пропущено: {unknownKeys.length} (нет таких ключей в словаре) · без изменений:{" "}
            {unchanged}
          </p>
        </div>

        {changes.length > 0 && (
          <ul className="mt-4 space-y-2 rounded-xl border border-border bg-muted/50 p-3">
            {shown.map((c) => (
              <li key={c.key} className="text-xs">
                <span className="font-mono text-foreground">{c.key}</span>
                {c.diffs.map((d, i) => (
                  <span key={i} className="mt-0.5 block text-muted-foreground">
                    {diffLabel(d)}
                  </span>
                ))}
              </li>
            ))}
            {changes.length > shown.length && (
              <li className="text-xs text-muted-foreground">
                …и ещё {changes.length - shown.length} ключ(ей)
              </li>
            )}
          </ul>
        )}

        {unknownKeys.length > 0 && (
          <p className="mt-3 rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 text-xs text-warn">
            Пропущены неизвестные ключи: {unknownKeys.slice(0, 10).join(", ")}
            {unknownKeys.length > 10 && ` …и ещё ${unknownKeys.length - 10}`}
          </p>
        )}

        {progress && (
          <p className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            сохранено {progress.done} / {progress.total}
          </p>
        )}

        {outcome && (
          <p
            className={`mt-4 rounded-lg border px-3 py-2 text-sm ${
              outcome.failed > 0
                ? "border-danger/40 bg-danger/10 text-danger"
                : "border-success/40 bg-success/10 text-success"
            }`}
          >
            Сохранено ключей: {outcome.saved}
            {outcome.failed > 0 &&
              ` · не сохранилось: ${outcome.failed} — эти строки отмечены ошибкой, попробуйте ещё раз`}
            . Чтобы тексты попали на сайт, нажмите «Опубликовать».
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
          {outcome ? (
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Закрыть
            </button>
          ) : (
            <>
              <button type="button" onClick={onClose} disabled={busy} className={btnClass}>
                Отмена
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={busy || changes.length === 0}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Применить
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
