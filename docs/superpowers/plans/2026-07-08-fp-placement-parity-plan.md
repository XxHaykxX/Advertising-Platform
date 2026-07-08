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
- [ ] 0.1 Расширить `Project`: `slotsTotal Int`, `slotsTaken Int`, `applicationDeadline DateTime?`, `releaseDate DateTime?`, `platforms Json` (string[]), `placementType String?`, `priceNote String?`
- [ ] 0.2 Новые модели: `Actor` (projectId, name, role, sortOrder), `Portfolio` (title, brand, description, image, metrics, publisherId?, sortOrder), `Partner` (name, logo, url, sortOrder)
- [ ] 0.3 `db push` + сид: актёры (по 3 на проект), 6 портфолио-кейсов, 8–10 партнёров, слоты/дедлайны/площадки на все 6 проектов
- [ ] 0.4 DTO в `src/lib/data/`: `actors`, `portfolio`, `partners`; расширить `projects` DTO
- **Gate:** architect-review схемы (не ломает ли существующие поля/сид/отчёты)

### WAVE 1 — Лид-flow + i18n инфра (параллельно, sonnet)
- [ ] 1.A Заявка: server action `submitApplication` (name*, phone*, email, company, budget, message, projectId-преселект, honeypot, consent, IP rate-limit 5/10мин — по образцу 3000 и `submitLead`), модалка/форма `ApplyDialog` в стиле 3001 + success-модалка; подключить к «Request details» (каталог, карточки, отчёт) и «Express Interest»
- [ ] 1.B i18n: порт `lib/i18n.ts` (ru/en/hy, cookie), словарь для существующего UI 3001, `LocaleSwitcher` (хедер+футер), server-обвязка (`getLocale`)
- **Gate:** review server action (валидация, rate-limit, honeypot)

### WAVE 2 — Страницы (параллельно; haiku — статичные, sonnet — data-bound)
- [ ] 2.A `/how-it-works` — страница: расширенная версия секции (шаги, CTA) — haiku
- [ ] 2.B `/portfolio` — сетка кейсов из DB + видео/галерея-лайтбокс (модалка), JSON-LD VideoObject — sonnet
- [ ] 2.C `/partners` — логотипы + марки-лента (CSS marquee-x, pause-on-hover, иконка-фоллбек по имени) из DB — sonnet
- [ ] 2.D `/contact` — страница: форма (`submitLead` + селектор проекта + success-модалка) + телефон/WhatsApp/Telegram + email, лёгкий индиго-фон (аналог DotGridBackdrop) — haiku
- [ ] 2.E `/privacy`, `/terms` — легал-страницы (порт `legal-page.tsx`-паттерна, стиль 3001) — haiku
- Всё — палитра/типографика 3001, `Section`/`Container`/`Reveal` примитивы

### WAVE 3 — Паритет карточек и детальной (sonnet)
- [ ] 3.A Карточка каталога + featured: бейдж `placementType`, слоты-прогресс «X из Y», дедлайн, площадки-теги, `releaseDate`
- [ ] 3.B `/reports/[id]`: блок «Актёры», сайдбар (слоты, выход, дедлайн, площадки, цена, CTA «Express Interest»), кнопка назад к каталогу
- [ ] 3.C Хедер: иконки phone/WhatsApp/Telegram + LocaleSwitcher; футер: контакты, документы, локали, соц
- [ ] 3.D i18n-проводка: ВСЕ публичные компоненты (лендинг-секции, каталог, отчёт, формы, хедер/футер, новые страницы) переведены на `makeUI`/`getLocale`; сайт полностью работает на ru/en/hy, свитчер реально переключает язык (cookie + revalidate)

### WAVE 4 — Хром и полировка (параллельно)
- [ ] 4.A Каталог: реализовать фильтры «Product Category» и «Status» (сейчас «Coming soon»); футер: убрать/оживить мёртвые соц-ссылки — sonnet
- [ ] 4.B SEO: metadata/canonical/json-ld на все публичные страницы — sonnet
- [ ] 4.C Админка: CRUD Portfolio, Partners, поля проекта (actors, slots, deadline, platforms, placementType) — sonnet
- **Gate:** architect-review админ-CRUD (authz, ownerId-скоупинг)

### WAVE 5 — Реальные данные (sonnet)
Источник: `kinodaran-catalog.json` (реальные тайтлы Kinodaran: названия, год, жанр MOVIE/TV_SHOW, длительность, возраст) + локальные кадры `/public/kino/`.
- [ ] 5.A Пересобрать сид-проекты: реальные названия/года/жанры вместо вымышленных «Bandwidth» и т.п.; постеры/галереи — уже локальные кадры; форматы/аудитории — правдоподобные, синопсисы — краткие реальные описания; название и синопсис — на 3 языках (через `lang`-поле/Content-механику, минимум EN+RU)
- [ ] 5.B Реальные партнёры (Kinodaran, студии из тайтлов) и портфолио-кейсы на базе реальных проектов
- [ ] 5.C Контакты (phone/email/Telegram/WhatsApp) — из реальных настроек (Setting), не хардкод

### WAVE 6 — Тотальный QA кнопок (оркестратор + Playwright + coder на фиксы)
- [ ] 6.A Обойти ВСЕ страницы 3001 и прокликать КАЖДУЮ кнопку/ссылку: хедер (все пункты, mobile-меню), лендинг (все CTA всех секций, FAQ-аккордеон, hero-стрелка), каталог (фильтры все до одного, сортировка, grid/list, поиск, карточки: View Report / Request details), отчёт (tabs, все CTA), формы (submit с валидацией и успехом), футер (все ссылки), login/register, локале-свитчер на каждой странице
- [ ] 6.B Составить таблицу: кнопка → работает / битая / не связана с бэком; всё битое — чинить (coder), «не связано с бэком» — связать или осознанно пометить
- [ ] 6.C Финал: консоль без ошибок на всех страницах, `tsc --noEmit`, скриншоты, коммит

## Статус
- [x] Сравнение и документ
- [ ] W0 … W6 — см. чекбоксы
