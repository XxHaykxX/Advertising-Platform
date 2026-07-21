/* Shared helpers for the Google-Sheets i18n round-trip
   (scripts/i18n-export.ts + scripts/i18n-import.ts). */

export const CSV_HEADER = ["key", "Где на сайте", "hy", "ru", "en"] as const;

/* Human-readable "where does this text live" labels, derived from the key
   prefix. Longest prefix wins (account.brand. before account.). Unknown
   prefixes fall back to the prefix itself so new namespaces still export. */
const CONTEXT_LABELS: Record<string, string> = {
  "nav.": "Шапка (меню)",
  "footer.": "Подвал",
  "hero.": "Главная — верхний блок",
  "how.": "Главная — как это работает",
  "why.": "Главная — почему мы",
  "trust.": "Главная — блок доверия",
  "featured.": "Главная — избранные проекты",
  "getStarted.": "Главная — призыв к действию",
  "faq.": "Вопросы и ответы",
  "about.": "Страница «О нас»",
  "contact.": "Страница «Контакты»",
  "portfolio.": "Портфолио",
  "partners.": "Партнёры",
  "catalog.": "Каталог (фильтры, карточки)",
  "report.": "Страница медиа-отчёта",
  "form.": "Формы (общие поля)",
  "formErr.": "Формы (ошибки)",
  "btn.": "Кнопки",
  "ui.": "Мелкие элементы интерфейса",
  "login.": "Вход",
  "register.": "Регистрация",
  "auth.": "Авторизация (общее)",
  "account.brand.": "Кабинет бренда",
  "account.": "Кабинет создателя",
  "notif.": "Уведомления",
  "legal.": "Юридические страницы",
  "translate.": "Кнопка перевода",
  "genre.": "Жанры (значения фильтра)",
  "placement.": "Типы размещения (значения)",
  "formatCategory.": "Категории формата (значения)",
  "language.": "Языки (значения)",
  "category.": "Категории бренда (значения)",
  "gender.": "Пол (значения)",
  "metric.": "Метрики портфолио (значения)",
};

export function contextLabel(key: string): string {
  let best = "";
  for (const prefix of Object.keys(CONTEXT_LABELS)) {
    if (key.startsWith(prefix) && prefix.length > best.length) best = prefix;
  }
  return best ? CONTEXT_LABELS[best] : key.slice(0, key.lastIndexOf(".") + 1) || key;
}

/* ── RFC-4180 CSV ─────────────────────────────────────────────────────── */

export function csvField(v: string): string {
  return /[",\r\n]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v;
}

export function csvLine(fields: string[]): string {
  return fields.map(csvField).join(",");
}

/** Parse RFC-4180 CSV (quoted fields, embedded commas/quotes/newlines, CRLF
 *  or LF row breaks). Returns rows of raw string fields; strips a UTF-8 BOM. */
export function parseCsv(text: string): string[][] {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  // Drop fully-empty trailing rows (Sheets often appends blank lines).
  while (rows.length && rows[rows.length - 1].every((f) => f.trim() === "")) rows.pop();
  return rows;
}

/* ── validation shared with src/lib/i18n.guard.test.ts ────────────────── */

export const CYRILLIC = /[Ѐ-ӿ]/;

export function placeholders(s: string): string[] {
  return [...s.matchAll(/\{([a-zA-Z0-9_]+)\}/g)].map((m) => m[1]).sort();
}
