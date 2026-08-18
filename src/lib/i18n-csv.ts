/* Pure CSV helpers for the Google-Sheets i18n round-trip. No node:fs here —
   this module is imported both by the build-time scripts
   (scripts/i18n-export.ts + scripts/i18n-import.ts, via scripts/i18n-lib.ts)
   and by the public route handler (src/app/api/i18n/export.csv/route.ts),
   which runs in the Next.js server runtime. */

export const CSV_HEADER = ["key", "Где на сайте", "hy", "ru", "en"] as const;

/* Human-readable "where does this text live" labels, derived from the key
   prefix. Longest prefix wins (account.brand. before account.). This is the
   only thing standing between the translator and 1000 rows of dot-notation:
   it names the group headers in /admin/i18n, fills the section dropdown, and
   is the "Где на сайте" column of the CSV export.

   Two rules, both load-bearing:

   1. EVERY key must match a prefix here. Until 2026-08-10 only 34 prefixes
      were covered, so 534 of the 1002 keys fell through to the fallback below
      and Мариам got 95 one-row "sections" named `forCreators.field.
      castPhoto.`. src/lib/i18n.guard.test.ts now fails when a key has no
      label, so a new namespace can't ship unnamed again.
   2. The label IS the sort key — the dropdown and the group list are ordered
      alphabetically by it. Hence the "Раздел — подраздел" shape: every
      "Форма проекта — …" lands together, in one run, without any extra
      grouping machinery. Keep the prefix wording identical across siblings. */
const CONTEXT_LABELS: Record<string, string> = {
  // ── Общие элементы, видны на каждой странице ──
  "nav.": "Шапка (меню)",
  "footer.": "Подвал",
  "btn.": "Кнопки",
  "ui.": "Мелкие элементы интерфейса",
  "translate.": "Кнопка перевода",
  "form.": "Формы (общие поля)",
  "formErr.": "Формы (ошибки)",

  // ── Главная ──
  "hero.": "Главная — верхний блок",
  "adTypes.": "Главная — виды рекламы",
  "whyUs.": "Главная — почему мы",
  "homePartners.": "Главная — каналы-партнёры",
  "testimonials.": "Главная — видеоотзывы",
  "homeCta.": "Главная — призыв к действию",
  "callForm.": "Главная — заказ звонка",
  // Блоки, снятые с главной 2026-08-18. Их ключи ещё в словаре — дроп идёт
  // отдельным заходом ПОСЛЕ деплоя (черновик переводчицы на удалённом ключе
  // блокирует публикацию), а подписи должны говорить, где текст виден теперь.
  "why.": "Страница «О нас» — почему мы",
  "landingHow.": "«Как это работает» — короткая версия",
  "faq.": "Вопросы и ответы",
  "trust.": "Не используется (снято с главной)",
  "featured.": "Не используется (снято с главной)",
  "getStarted.": "Не используется (снято с главной)",
  "homeCases.": "Не используется (снято с главной)",
  "investment.": "Главная — спонсоры и инвестиции",

  // ── Остальные публичные страницы ──
  "hiw.flow.": "«Как это работает» — схема шагов",
  "hiw.": "Страница «Как это работает»",
  "about.": "Страница «О нас»",
  "contact.": "Страница «Контакты»",
  "contactPage.": "Страница «Контакты»",
  "portfolio.": "Портфолио",
  "partners.": "Партнёры",
  "legal.": "Юридические страницы",

  // ── Рекламные каналы (/ads) ──
  "ads.": "Реклама — обзор и общие блоки",
  "adGroup.": "Реклама — группы каналов (названия и описания)",
  "adChannel.": "Реклама — описания девяти каналов",
  "adSpacePublic.": "Реклама — карточка рекламного места",
  "adSpaceForm.": "Реклама — форма рекламного места",
  "adSpace.": "Реклама — рекламные места (админка и кабинет)",
  "attrValue.": "Фильтры: значения",
  "attr.": "Фильтры: названия",

  // ── Каталог и страница проекта ──
  "catalog.": "Каталог — фильтры и сортировка",
  "card.": "Каталог — карточка проекта",
  "favorite.": "Каталог — избранное",
  "report.": "Страница проекта",
  "keyFacts.": "Страница проекта — ключевые факты",
  "cast.": "Страница проекта — каст и команда",
  "format.": "Страница проекта — формат и хронометраж",
  "deadline.": "Страница проекта — срок приёма заявок",

  // ── Заявки бренда ──
  "apply.": "Заявка бренда — форма отклика",
  "interests.status.": "Заявки — статусы (значения)",
  "interests.": "Заявки — список и переписка",

  // ── Вход, регистрация, уведомления ──
  "login.": "Вход",
  "register.": "Регистрация",
  "auth.": "Авторизация (общее)",
  "adminLogin.": "Вход в админку",
  "logout.": "Выход",
  "error.": "Страница ошибки",
  "notFound.": "Страница не найдена (404)",
  "notif.": "Уведомления",
  // Не "Push-…": список сортируется по подписи, и латиница уехала бы в конец.
  "push.": "Уведомления в браузере (push)",

  // ── Личные кабинеты ──
  "account.brand.": "Кабинет бренда",
  "account.": "Кабинет создателя",

  // ── Форма проекта (её же видит создатель в кабинете) ──
  "projectForm.section.": "Форма проекта — названия разделов",
  "projectForm.field.": "Форма проекта — названия полей",
  "projectForm.help.": "Форма проекта — подсказки к полям",
  "projectForm.about.": "Форма проекта — описание и синопсис",
  "projectForm.media.": "Форма проекта — постер, галерея, медиа",
  "projectForm.video.": "Форма проекта — видео",
  "projectForm.cast.": "Форма проекта — каст и команда",
  "projectForm.placements.": "Форма проекта — плейсменты",
  "projectForm.tiers.": "Форма проекта — пакеты спонсорства",
  "projectForm.offers.": "Форма проекта — предложения (общее)",
  "projectForm.offer.crop.": "Форма проекта — обрезка картинки предложения",
  "projectForm.offer.": "Форма проекта — карточка предложения",
  "projectForm.milestones.": "Форма проекта — этапы производства",
  "projectForm.releasePrecision.": "Форма проекта — точность даты выхода (значения)",
  "projectForm.": "Форма проекта — общее",
  "completeness.item.": "Форма проекта — чеклист, названия пунктов",
  "completeness.": "Форма проекта — чеклист заполнения",
  "publish.missing.": "Форма проекта — что мешает публикации",
  "publish.": "Форма проекта — проверка перед публикацией",
  "poster.": "Форма проекта — генератор постера",

  // ── Медиатека ──
  "media.crop.": "Медиатека — обрезка изображения",
  "media.": "Медиатека — выбор и загрузка файлов",

  // ── Гид «Создателям» ──
  "forCreators.hero.": "Гид создателям — верхний блок",
  "forCreators.steps.": "Гид создателям — шаги",
  "forCreators.step.": "Гид создателям — шаги",
  "forCreators.field.": "Гид создателям — пояснения к полям",
  "forCreators.fileReq.": "Гид создателям — требования к файлам",
  "forCreators.tier.": "Гид создателям — пакеты спонсорства",
  "forCreators.moderation.": "Гид создателям — модерация",
  "forCreators.legend.": "Гид создателям — легенда обозначений",
  "forCreators.example.": "Гид создателям — пример проекта",
  "forCreators.finalCta.": "Гид создателям — призыв к действию",
  "forCreators.": "Гид создателям — общее",

  // ── Админка ──
  "admin.registrations.": "Админка — регистрации",
  "admin.dashboard.": "Админка — сводка",
  "admin.": "Админка — общее",

  // ── Закрытые списки: то, что подставляется в текст как значение ──
  "genre.": "Значения — жанры",
  "role.": "Значения — роли каста и команды",
  "formatCategory.": "Значения — категории формата",
  "category.": "Значения — категории бренда",
  "metric.": "Значения — метрики портфолио",
  "placementType.": "Значения — типы интеграции",
  "placementTypeHint.": "Значения — типы интеграции, пояснения",
  "platformCategory.": "Значения — категории платформ показа",
};

/** The prefixes above, longest first — so `account.brand.` wins over
 *  `account.` without re-scanning the whole map for every key. */
const CONTEXT_PREFIXES = Object.keys(CONTEXT_LABELS).sort((a, b) => b.length - a.length);

/** The label a key would carry, or "" when nothing covers it (which the guard
 *  test treats as a failure — see the note on CONTEXT_LABELS). */
export function contextLabelOrNone(key: string): string {
  const hit = CONTEXT_PREFIXES.find((p) => key.startsWith(p));
  return hit ? CONTEXT_LABELS[hit] : "";
}

export function contextLabel(key: string): string {
  return contextLabelOrNone(key) || key.slice(0, key.lastIndexOf(".") + 1) || key;
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
