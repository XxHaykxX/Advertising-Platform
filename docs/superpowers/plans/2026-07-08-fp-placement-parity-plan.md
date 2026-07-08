# FP Placement — Parity Plan: перенос функционала 3000 → 3001

> **Правило:** палитра и дизайн-стиль **3001** (светлый индиго, Tailwind-токены из `placement/src/app/globals.css`, ui-примитивы из `placement/src/components/ui/`) сохраняются. Из 3000 переносим **функции, страницы, поля, кнопки** — не внешний вид.
>
> **Оркестрация:** Fable 5 — оркестратор. Волны → параллельные пакеты для `coder`-агентов (модель по сложности: haiku = презентационное, sonnet = логика/данные/формы). Между волнами — gate-review (`architect`/opus для схемы и auth-чувствительного, иначе быстрая самопроверка). Перед фреймворк-кодом агенты сверяются с Context7 (Next 16 / Prisma 6 / Tailwind v4).

## Сравнение (снято 2026-07-08 с localhost:3000 и :3001)

### Что есть в 3000 и отсутствует в 3001

**Страницы:**
| 3000 | 3001 сейчас | Гэп |
|---|---|---|
| `/how-it-works` (отд. страница) | секция на лендинге + ссылка `/#how-it-works` | нужна страница `/how-it-works` |
| `/portfolio` (кейсы, DB `Portfolio`) | нет | страница + модель + админ CRUD |
| `/partners` (логотипы, марки-лента, DB `Partner`) | нет | страница + модель + админ CRUD |
| `/contact` (отд. страница: форма + телефон/WhatsApp/Telegram) | секция Contact на лендинге (форма работает — `submitLead`) | нужна страница `/contact` |
| `/projects/[id]` — детальная проекта | `/reports/[id]` (отчёт) | паритет блоков: актёры, сцены, слоты, дедлайн, площадки, CTA-заявка |
| `/privacy`, `/consent` (документы) | футер-ссылки Terms/Privacy ведут в никуда | страницы `/privacy`, `/terms` |
| `/experience`, `/hero-scroll` (экспериментальные) | — | **не переносим** |

**Поля данных (модель `Project` 3000 → добавить в 3001):**
- Слоты: `slotsTotal`, `slotsTaken` → «Доступно 3 из 5» + прогресс-бар
- `applicationDeadline` → «Заявки до 25 июня 2026»
- `releaseDate` → «Выход: Апрель 2026»
- `platforms[]` (YouTube / Kinodaran / TV) → теги на карточке и в сайдбаре
- `placementType` (в кадре / сюжетная интеграция / упоминание) → бейдж
- `priceNote` («Цена по запросу»)
- Модель `Actor` (имя, роль) — блок «Актёры» на детальной
- (Сцены уже есть: `PlacementOpportunity`)

**Кнопки/функции:**
1. **Заявка (лид)** с карточки каталога и с детальной: «Request details» / «Express Interest» сейчас декоративные → форма заявки (поля как 3000: name*, phone*, email, company, message, consent-чекбокс, honeypot `website`) → `Application` через server action (по образцу `submitLead`), rate-limit по IP.
2. **i18n ru/en/hy**: cookie `locale`, словарь UI, свитчер в хедере и футере (порт `src/lib/i18n.ts` + `Content`-модель уже есть в схеме 3001).
3. **Контакт-каналы в хедере**: иконки телефон / WhatsApp / Telegram.
4. **Футер-паритет**: телефон, email, соцкнопки, колонка «Документы», локале-свитчер (стиль 3001).
5. **Легал-страницы**: на 3000 `/privacy` + `/consent` (баннера нет — только страницы из футера); в 3001 делаем `/privacy` + `/terms`.
6. **SEO**: `metadata.alternates`, canonical, json-ld (порт `json-ld.tsx`).
7. **Админка**: CRUD «Портфолио», «Партнёры», «Контент (i18n)», поля проекта из списка выше; лиды уже есть (`applications/`).

### Что в 3001 уже есть (не трогаем)
Лендинг (hero-стена, stats, featured, trust, how-it-works, get-started, why, faq, contact), каталог с фильтрами/сортировкой/grid-list, отчёт `/reports/[id]` (tabs, safety, opportunities, ROI), login/register, админка (projects, users, applications), auth JWT+bcrypt, lenis, рабочая контакт-форма `submitLead`.

### Найденные баги
- [x] `/reports/7` 500 «Jest worker…» — вылечен рестартом dev-сервера (stale Turbopack). Следить.

---

## Волны

### WAVE 0 — Схема + данные (sonnet, последовательно)
**Файлы:** `placement/prisma/schema.prisma`, `seed-data.ts`, `seed.ts`, `placement/src/lib/data/*`
- [x] 0.1 Расширить `Project`: `slotsTotal Int`, `slotsTaken Int`, `applicationDeadline DateTime?`, `releaseDate DateTime?`, `platforms Json` (string[]), `placementType String?`, `priceNote String?`
- [x] 0.2 Новые модели: `Actor` (projectId, name, role, sortOrder), `Portfolio` (title, brand, description, image, metrics, publisherId?, sortOrder), `Partner` (name, logo, url, sortOrder)
- [x] 0.3 `db push` + сид: актёры (по 3 на проект), 6 портфолио-кейсов, 8–10 партнёров, слоты/дедлайны/площадки на все 6 проектов
- [x] 0.4 DTO в `src/lib/data/`: `actors`, `portfolio`, `partners`; расширить `projects` DTO
- **Gate:** architect-review схемы (не ломает ли существующие поля/сид/отчёты)

### WAVE 1 — Лид-flow + i18n инфра (параллельно, sonnet)
- [x] 1.A Заявка: server action `submitApplication` (name*, phone*, email, company, budget, message, projectId-преселект, honeypot, consent, IP rate-limit 5/10мин — по образцу 3000 и `submitLead`), модалка/форма `ApplyDialog` в стиле 3001 + success-модалка; подключить к «Request details» (каталог, карточки, отчёт) и «Express Interest»
- [x] 1.B i18n: порт `lib/i18n.ts` (ru/en/hy, cookie), словарь для существующего UI 3001, `LocaleSwitcher` (хедер+футер), server-обвязка (`getLocale`)
- **Gate:** review server action (валидация, rate-limit, honeypot)

### WAVE 2 — Страницы (параллельно; haiku — статичные, sonnet — data-bound)
- [x] 2.A `/how-it-works` — страница: расширенная версия секции (шаги, CTA) — haiku
- [x] 2.B `/portfolio` — сетка кейсов из DB + видео/галерея-лайтбокс (модалка), JSON-LD VideoObject — sonnet
- [x] 2.C `/partners` — логотипы + марки-лента (CSS marquee-x, pause-on-hover, иконка-фоллбек по имени) из DB — sonnet
- [x] 2.D `/contact` — страница: форма (`submitLead` + селектор проекта + success-модалка) + телефон/WhatsApp/Telegram + email, лёгкий индиго-фон (аналог DotGridBackdrop) — haiku
- [x] 2.E `/privacy`, `/terms` — легал-страницы (порт `legal-page.tsx`-паттерна, стиль 3001) — haiku
- Всё — палитра/типографика 3001, `Section`/`Container`/`Reveal` примитивы

### WAVE 3 — Паритет карточек и детальной (sonnet)
- [x] 3.A Карточка каталога + featured: бейдж `placementType`, слоты-прогресс «X из Y», дедлайн, площадки-теги, `releaseDate`
- [x] 3.B `/reports/[id]`: блок «Актёры», сайдбар (слоты, выход, дедлайн, площадки, цена, CTA «Express Interest»), кнопка назад к каталогу
- [x] 3.C Хедер: иконки phone/WhatsApp/Telegram + LocaleSwitcher; футер: контакты, документы, локали, соц
- [x] 3.D i18n-проводка: ВСЕ публичные компоненты (лендинг-секции, каталог, отчёт, формы, хедер/футер, новые страницы) переведены на `makeUI`/`getLocale`; сайт полностью работает на ru/en/hy, свитчер реально переключает язык (cookie + revalidate)

### WAVE 4 — Хром и полировка (параллельно)
- [x] 4.A Каталог: реализовать фильтры «Product Category» и «Status» (сейчас «Coming soon»); футер: убрать/оживить мёртвые соц-ссылки — sonnet
- [x] 4.B SEO: metadata/canonical/json-ld на все публичные страницы — sonnet
- [x] 4.C Админка: CRUD Portfolio, Partners, поля проекта (actors, slots, deadline, platforms, placementType) — sonnet
- **Gate:** architect-review админ-CRUD (authz, ownerId-скоупинг)

### WAVE 5 — Реальные данные (sonnet)
Источник: `kinodaran-catalog.json` (реальные тайтлы Kinodaran: названия, год, жанр MOVIE/TV_SHOW, длительность, возраст) + локальные кадры `/public/kino/`.
- [x] 5.A Пересобрать сид-проекты: реальные названия/года/жанры вместо вымышленных «Bandwidth» и т.п.; постеры/галереи — локальные кадры. ⚠️ Синопсисы пока EN-only (DB-контент не локализован — отложено вместе с Content-механикой)
- [x] 5.B Реальные партнёры (Kinodaran Studios) и портфолио-кейсы на базе реальных проектов (бренды вымышленные)
- [ ] 5.C Контакты (phone/email/Telegram/WhatsApp) из Setting — НЕ сделано, захардкожены плейсхолдеры (+374 00 000 000, hello@fpplacement.com, t.me/fpplacement). Ждём реальные контакты от владельца

### WAVE 6 — Тотальный QA кнопок (оркестратор + Playwright + coder на фиксы)
- [x] 6.A Обойти ВСЕ страницы 3001 и прокликать КАЖДУЮ кнопку/ссылку: хедер (все пункты, mobile-меню), лендинг (все CTA всех секций, FAQ-аккордеон, hero-стрелка), каталог (фильтры все до одного, сортировка, grid/list, поиск, карточки: View Report / Request details), отчёт (tabs, все CTA), формы (submit с валидацией и успехом), футер (все ссылки), login/register, локале-свитчер на каждой странице
- [x] 6.B Составить таблицу: кнопка → работает / битая / не связана с бэком; всё битое — чинить (coder), «не связано с бэком» — связать или осознанно пометить
- [x] 6.C Финал: консоль без ошибок на всех страницах, `tsc --noEmit`, скриншоты, коммит

## Статус
- [x] Сравнение и документ
- [x] W0 … W6 — см. чекбоксы (кроме 5.C — реальные контакты)

## Результаты QA-обхода (2026-07-08, Playwright, все страницы)

**Ссылки:** все внутренние (19 маршрутов, вкл. /reports/19-24, /admin/login) → 200. Якоря /#faq /#about /#contact /#stats существуют. Внешние: tel:, t.me, wa.me, mailto, youtube — префиксы валидны (номера/адреса — плейсхолдеры, см. 5.C). Единственная мёртвая `href="#"` (LinkedIn у фаундеров в why.tsx) — удалена.

**Кнопки/интерактив (всё работает):**
| Элемент | Результат |
|---|---|
| Каталог: фильтр жанра | 6 → 1 проектов |
| Каталог: фильтр статуса (Filming) | 6 → 2 |
| Каталог: поиск («Мхитарян») | 6 → 1 |
| Каталог: Clear All | сброс до 6 |
| Каталог: сортировка (4 опции), grid/list | переключаются |
| Request details (карточка) | модалка, валидация consent, запись в Application (проверено в БД) |
| Отчёт: табы Overview/Cast/Safety/Investment/More | рендерятся |
| Отчёт: Express Interest | модалка открывается |
| Портфолио: карточка кейса → лайтбокс, prev/next, ESC | работает |
| Контакт-форма (+ селектор проекта) | success-стейт |
| FAQ-аккордеон | aria-expanded toggle |
| Мобильное меню (390px) | открывается, все пункты + свитчер |
| Локале-свитчер | живое EN→RU→HY→EN кликами |
| Login → /admin/login, Register-заглушка | ок |

**Консоль:** 0 ошибок на всех 12 страницах. `tsc --noEmit` чистый.

**Не связано с бэком (осознанно):** контакты-плейсхолдеры (5.C), логотипы партнёров (монограммы до загрузки логотипов через админку), i18n DB-контента (синопсисы/сцены — EN).

## Отключено / отвязано (2026-07-08) — вход и регистрация брендов

Решение владельца: страницы `/login` и `/register` — заглушки (инпуты `disabled`), реального входа для брендов **нет** (в бэкенде только auth для админа/паблишеров). Убраны из UI, **но код сохранён** (закомментирован / отвязан) для восстановления, когда появятся бренд-аккаунты.

- Хедер: ссылка **Sign In** (десктоп + мобайл) закомментирована в `placement/src/components/header.tsx` (не удалена).
- CTA, которые вели на `/register`, перенаправлены на **`/contact`** (рабочая лид-форма — единственный путь конверсии): `hero.tsx` («Get Started»), `get-started.tsx` («List project»).
- Файлы `placement/src/app/login/page.tsx` и `.../register/page.tsx` оставлены нетронутыми (с комментарием-пометкой вверху). Прямой заход по URL ещё работает, но из навигации страницы недостижимы.
- Восстановление: раскомментировать Sign In в header, вернуть CTA на `/register`, реализовать бренд-auth (роль BRAND, хеш пароля, сессия, кабинет) — отдельная волна.

## UI-полировка и ребренд (2026-07-08, после паритета)

Все изменения — в `placement/`, дефолт-язык переключён на **hy**. Коммиты `624fc98`..`7f9c512`.

**Бренд iGovazd:** «FP Placement» → **iGovazd** во всём UI (имя слитно, только «i» в `var(--primary)`; логотип без пробела). Домен `igovazd.am` только в URL/почте (metadataBase, `hello@igovazd.am`, `t.me/igovazd`). Фавикон «iG». Админ-хедер/логин переименованы. Ноль «FP» в коде.

**Единый хедер:** общий `<Header>` теперь на всех страницах — каталог (был свой инлайн-хедер) и отчёт `/reports/[id]` (не было хедера, добавлен над баром табов; бар табов `sticky top-16`). Login/register оставлены минимальными (только лого).

**Навигация хедера:** `Каталог · Портфолио · Партнёры · Контакты` (How It Works и FAQ — только в футере). Каталог первым.

**Язык:** дефолт `hy`; `<html lang>` динамический по cookie; свитчер — **dropdown** (родные названия ru/en/hy + глобус), в футере открывается вверх. Inter грузит latin+cyrillic.

**Hover:** nav-ссылки, контакт-иконки, триггер языка — полупрозрачный primary (`bg-primary/10` + text-primary); футер-ссылки/контакты hover → primary.

**Футер-иконки:** Telegram/WhatsApp/YouTube — брендовые SVG (`placement/src/components/brand-icons.tsx`) вместо дженерик-lucide. Mail/Phone остались lucide.

**Убрано (по решению владельца):**
- Блок «режиссёр/админ → админ-вход» с login и register.
- Кнопка «Գրանցվել որպես պրոդյուսեր» на how-it-works.
- Вход/регистрация брендов отключены — Sign In в хедере закомментирован, CTA `/register` → `/contact`; файлы страниц сохранены (см. раздел выше).

**Багфикс:** hydration-mismatch на /catalog (сервер рендерил дату по-русски, клиент по-армянски — ICU-фолбэк для hy-AM). `formatMonthYear/formatFullDate` заменены на детерминированные таблицы месяцев (UTC) ru/en/hy. Консоль чистая на всех страницах.

**Прод:** deploy НЕ делался (правило владельца — только по явной команде). Legacy films-сайт на Hostinger заморожен на последней ревизии.

**Открыто:** реальные контакты (сейчас плейсхолдеры +374 00 000 000, hello@igovazd.am, t.me/igovazd); логотипы партнёров (монограммы); i18n DB-контента (синопсисы EN); бренд-auth (вход брендов); новый deploy-pipeline под placement.
