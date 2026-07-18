# FIX / TODO — пакетный список (фиксим и тестим одним махом)

Живой список. Пользователь диктует пункты — сюда добавляем. Ничего не делаем по отдельности;
собираем всё, потом реализуем + тестируем за один заход, потом деплой.

Статус легенда: `[ ]` не начато · `[~]` в работе · `[x]` готово+протестировано.

---

# ⭐ АКТУАЛЬНЫЙ СТАТУС — 2026-07-18 (источник правды; всё ниже этого блока — исторический лог)

**Прод:** `igovazd.am`, HEAD = `ed9cb98`. Прод-БД мигрирована (`srv2026.hstgr.io`). Смоук зелёный (home/catalog/portfolio/admin-login/reports/login/register = 200; portfolio RU/HY метки локализованы).

**2026-07-18 ДЕПЛОЙ батча #40 (commit `acc5aa9` + build-fix `ed9cb98`):** Content-i18n Portfolio (per-locale titleHy/Ru/En + descriptionHy/Ru/En, pickLocale fallback, метки метрик localizeMetricLabel, admin-форма 3-язычн.+Translate), тест-инфра vitest+Playwright (~70 тестов, 61 unit + e2e), фикс cookie «remember me OFF» (session.ts), матчер бренда (genres[]), дроп мёртвых таблиц Application+Setting (забэкаплены в scratchpad), чистка estValue/exposure.
- **Прод-миграция вручную ПЕРЕД push:** +6 Portfolio-колонок (additive) + DROP Application/Setting + backfill En←base (6 строк). Application-строка = тест-лид юзера (ԱՐԱՄ), Setting = default_lang=en — обе мёртвые.
- **⚠️ build упал 1-й раз:** `next build` тайпчекает vitest.config.ts/*.test.ts → на проде devDeps срезаны → `Cannot find module 'vitest/config'`. Фикс: tsconfig `exclude` тест/конфиг-файлов (`ed9cb98`). Урок — расширение [[deploy-types-in-deps]]: не только @types, но и любой файл, импортящий devDep, тайпчекается прод-билдом.

**Прежний прод HEAD был `3addfe5`** (Notification, Project.formatCategory/language, Interest/moderation/roles/brand-поля).

## ✅ ЗАДЕПЛОЕНО НА ПРОД (всё работает)
- **Фаза 1** (`c33e3e2`): email-уведомления, кабинет создателя, фикс чёрного экрана, аватар в хедере, авто-Code, Genre multi-select, Film/Serial, рег без модерации, модерация проектов, роли (MODERATOR/PUBLISHER), кабинет бренда (Interest/expressInterest), быстрая заливка+авто-перевод, генерация постера (Nano Banana Pro), #20² single-page форма.
- **Фаза 2** (`3ca72bc`): чистка admin-формы, единый page-hero на всех публичных страницах, Registrations→Users (табы), creator-форма 1:1 с admin, translate-устойчивость (fallback-модель), фикс логаута (клиентская навигация), убраны анонимные Applications, телефон +374.
- **Батч V1–V11 + V7** (`3addfe5`, 2026-07-17):
  - V1 каталог респонсив + фикс кнопок карточек (overflow/clip на desktop, перенос длинного CTA).
  - V2–V5 фильтры каталога: Формат, Возраст, Язык, Платформа, Страна; убрана верхняя плашка.
  - V6 /reports респонсив + ROI + login-CTA.
  - V7 переключатель валюты: убран из хедера, оставлен в футере.
  - V8 бренд «Мои интересы» — add/remove A→Z.
  - V9 **уведомления A→Z** — модель Notification, триггеры (интерес→владелец+суперадмины, сабмит→модераторы, approve/reject→владелец), страницы в 3 кабинетах + badge непрочитанных.
  - V10 валидация форм — локализация ошибок (admin-логин целиком + users/portfolio/partners) + `required`.
  - V11 security — postcss ≥8.5.10.
  - Admin-логин полностью локализован (форма+ошибки, hy/ru/en).

## 🔎 АУДИТ 2026-07-17 (4 разведчика по коду) — fix.md был устаревшим, реальность ниже
- **#11 Поиск персон** — оказалось УЖЕ СДЕЛАНО: `getKnownPeople()` (`src/lib/data/actors.ts:22`) + `<datalist>` в `actors-editor.tsx`, автозаполнение role/kind/photo, подключено в admin new/edit И creator-форме. Только проверить в /qa.
- **Локализация creator-формы** — оказалось УЖЕ СДЕЛАНО: creator переиспользует admin `project-form.tsx` с `makeUI(mode==="creator"?locale:"en")`, всё через `t()`. Осталась мелочь (закрыта сегодня, см. ниже).

## ✅ СДЕЛАНО СЕГОДНЯ (2026-07-17, локально, tsc 0 — НЕ на проде)
- [x] **Фаза 1 — хвост локализации creator-формы:** `multi-select.tsx` видимая кнопка `Add "{q}"` + aria-label Remove → i18n (`ui.addOption/remove`); `poster-generator.tsx` aria Close/Remove; `image-uploader.tsx` aria Remove. Новые ключи `ui.addOption/remove/close` (hy чистый).
- [x] **Фаза 2 — тех-долг:** убран мёртвый `soon`-label (`brand/layout.tsx`+`brand-sidebar.tsx`); удалены мёртвые ключи `creatorUploadSoon/ProjectsSoon`; поправлен stale-коммент `requireModerator` (`require.ts`).

## ✅ Фаза 3 — РЕШЕНО ЮЗЕРОМ + СДЕЛАНО (2026-07-17, локально, tsc 0)
- [x] **Ответ на интерес → решение: НЕ строить.** Юзер: «отвечает только iGovazd». Creator accept/decline НЕ делаем; интересы обрабатывает админ (уже видит их в `/admin/interests`). `Interest.MUTUAL/DECLINED` остаются в enum, но не используются (enum не трогаем — удаление значений = миграция прод-БД, лишний риск).
- [x] **Анонимность → решение: убрать обещание.** Юзер: имена открыты. Удалён неиспользуемый ключ `catalog.anonymizedNotice`; переписаны `about.pillar2Body` и `faq.q3.answer` — больше НЕ обещают «скрыто до взаимного интереса». Код и так показывал имена открыто → теперь тексты соответствуют. Уведомление с именем бренда создателю = корректно.
- [x] **GARM Brand-Safety → решение: удалить всё.** В коде GARM/safety-UI НЕ БЫЛО (только план в доках) — удалять нечего; не строим. Из планов ниже вычеркнуть.
- [ ] **Google OAuth** (по готовности) — код готов (`lib/auth/google.ts`, роуты `/api/auth/google/*`), ждёт `GOOGLE_CLIENT_ID/SECRET` в env. Задача юзера.

## 🟡 ОСТАЛОСЬ — тех-долг (НЕ быстрая чистка — by-design/отложено)
- [ ] Захардкоженные англ. taglines / portfolio-метрики (`i18n.ts:5` TODO) → ждёт Content-i18n механизма.
- [ ] `estValue`/`exposureTotal` (`format.ts:19-21`) — placeholder-числа, ждут currency-spec / реальных данных.
- [ ] Примитивный genre-matcher рекомендаций бренда (`brand-dashboard.ts:48`) — намеренно «простой фильтр», улучшать при желании.
- ~~`ModerationStatus.DRAFT` не используется~~ — НЕВЕРНО: DRAFT используется (`projects.ts:124`, moderation-страницы). Не долг.
- ~~`i18n-brand.ts` → merge~~ — файла уже НЕТ (удалён ранее). Закрыто.

## 🔵 ОСТАЛОСЬ — операционка / гигиена
- [ ] `noreply@igovazd.am` — проверить, создан ли ящик (нужен для писем).
- [ ] Google OAuth creds в hPanel — когда юзер создаст OAuth-клиент.
- [ ] Полный **/qa прогон на проде** — системно не делали.
- [ ] Автотестов нет вообще (не срочно).
- [ ] Пере-ревью старого Logic-Review 2026-07-08 (мёртвые колонки Application note/budget, Setting/default_lang) — частично устарел, проверить актуальность.

---

# 🧪 QA-ПЛАН 2026-07-17 (ОДОБРЕН ЮЗЕРОМ) — A→Z, все роли, UI/UX

Легенда: **M** = мануальный (браузер, Playwright MCP — gstack /browse на Windows не работает) · **A** = автотест (предложение). Роли: Гость / Создатель / Бренд / Админ. Языки: hy/ru/en. Вьюпорты: desktop 1280 + mobile 375. Тест-данные с префиксом `QA-` (чистить после). **Google OAuth — ПРОПУСК** (нет creds). Баги по ходу → сюда в fix.md с severity.

**Стратегия параллелизма (браузер = один сеанс, нельзя дублировать):** статические/код-проверки (i18n-дыры, гомоглифы, инвентарь кнопок/ссылок, проверка правок сессии) → параллельные агенты (Fable 5 на механику-скан, sonnet на аудит). Браузерные A→Z потоки → одна последовательная линия (я или один агент). Автотесты (G) — отдельный объём, только по доп. команде.

## 0. Среда
- 0.1 dev :3001 (200) ✅ + Docker MySQL 3307 healthy ✅.
- 0.2 Тест-данные `QA-*`, почистить после.

## A. Гость / публичный сайт
- A1 (M) Home: hero, «Как работает», Featured (6 карт), stats, About, FAQ, Contact, footer + console.
- A2 (M) Навигация хедера + лого.
- A3 (M) Каталог: сетка, фильтры (Формат/Возраст/Язык/Платформа/Страна/Жанр/Пол), сортировка, grid/list, поиск.
- A4 (M/UI) Карточка: кнопки, перенос длинного CTA, нет висячей запятой/пустых метрик.
- A5 (M) /reports/[id]: hero/key-facts/cast/ROI/login-CTA респонсив.
- A6 (M) Портфолио, О нас, Контакты, how-it-works, terms, privacy + все ссылки.
- A7 (M) Контакт-форма: пустой→локализ.ошибки, валидный→успех.
- A8 (UI) Языки hy↔ru↔en (хедер+футер) + валюта только футер.
- A9 (UI) Mobile 375: бургер, фильтр-sheet, карточки, футер-switcher.

## B. Регистрация + авторизация (все роли)
- B1 (M) Рег создателя QA-Creator → APPROVED → /account.
- B2 (M) Рег бренда QA-Brand → APPROVED → /account/brand.
- B3 (M/UI) Валидация рег: пустые/невалид email/слабый пароль → inline-локализ.; глаз-пароль.
- B4 (M) Логин member (верный/неверный) + логаут (клиентский, без краша).
- B5 (M) Логин админа /admin/login — локализ. ошибка hy/ru/en + форма.
- B6 (—) Google OAuth — ПРОПУСК.

## C. Кабинет создателя + подача проекта (A→Z)
- C1 (M) /account карточки.
- C2 (M) «Мои проекты» + статус-пилюли.
- C3 (M) ★ Подача /account/projects/new — ВСЕ секции: title hy/ru/en + Translate, synopsis, жанры (multi-select + кнопка «Ավելացнел»), Film/Serial→эпизоды/минуты, страны/платформы/кинотеатры, студия datalist, возраст, формат, актёры/crew + datalist автозаполнение (#11), тиры, press-kit, постер-генератор (не сабмитит форму), автосейв.
- C4 (M) Submit → PENDING, авто-Code, creator НЕ ставит isActive.
- C5 (M/UI) Форма локализована hy/ru/en (chrome + aria Remove/Close).
- C6 (M) Уведомления создателя + badge.

## D. Кабинет бренда (A→Z)
- D1 (M) Dashboard.
- D2 (M) Browse + express-interest toggle.
- D3 (M) My Interests + withdraw.
- D4 (M) Profile save + export JSON.
- D5 (M/UI) Sidebar без мёртвого «Скоро» + badge.
- D6 (M) Уведомления бренда.

## E. Админка (SUPERADMIN)
- E1 (M) Moderation: PENDING QA-Creator → Approve → в каталоге.
- E2 (M) Reject → уведомление создателю.
- E3 (M) Проекты CRUD: create/edit (фото→Save без краша)/delete/Duplicate.
- E4 (M) Users (Staff/Members) create/сброс пароля локализ.
- E5 (M) Interests / Registrations / Media / Notifications badge.
- E6 (UI) Admin-nav все разделы.

## F. UI/UX кросс-роль
- F1 i18n: нет англ. дыр в hy/ru; нет кириллических гомоглифов (скрипт = 0).
- F2 Анонимность: About pillar2 + FAQ q3 — нет обещания «аноним до взаимного».
- F3 Каталог: нет плашки анонимности.
- F4 Responsive desktop/mobile ключевых.
- F5 States: empty/loading/error/overflow.
- F6 Console 0 ошибок на каждом маршруте.
- F7 Клик по КАЖДОЙ кнопке/ссылке — нет мёртвых.

## G. Автотесты (предложение, НЕ без доп. команды)
- G1 (A) Юнит: renderNotification, parseNotificationData, getKnownPeople dedupe, format.ts guard.
- G2 (A) Интеграция actions: register→APPROVED, createCreatorProject→PENDING, expressInterest/withdraw, admin approve→isActive.
- G3 (A) i18n-гард в CI: нет гомоглифов + все ключи hy/ru/en.
- G4 (A) E2E Playwright smoke: гость→каталог→report, creator→submit, brand→interest.

---

## ✅ РЕЗУЛЬТАТЫ ПРОГОНА QA-ПЛАНА — 2026-07-17 (Playwright MCP, dev :3001, tsc 0)

Оркестрировано: 4 статик-агента (i18n/гомоглифы, правки сессии, мёртвые кнопки/гарды, корень каталог-багов) + одна последовательная браузерная линия (я). Прогон A→E, роли Гость/Создатель/Бренд/Админ, hy/ru, desktop 1280 + mobile 375. Тест-данные `QA-*` созданы и **почищены** после (qa-creator/qa-brand/проект #44/уведомления удалены из локальной БД).

### ✅ Проверено ЧИСТО (работает)
- **A. Гость:** home (hero/how-it-works/Featured 6/stats/about/FAQ/contact/footer, console 0), навигация+лого, каталог (все фильтры V2–V5 присутствуют, верхней плашки нет V4, сортировка/grid-list/поиск), report /reports/32 (галерея/key-facts/cast/ROI-CTA, **валюта ֏ консистентна с каталогом — V7 ✅**), публичные роуты portfolio/about/how-it-works/terms/privacy = 200, контакт-форма happy-path («Շնորհակալություն…», без чёрного экрана), переключение языка hy↔ru, mobile 375 (нет гориз. скролла V1, бургер + фильтр-sheet).
- **B. Авторизация:** рег creator→APPROVED→/account (аватар «QC», авто-логин), рег brand→APPROVED→**/account/brand** (F13 фикс ✅, не тупик), логаут клиентский (редирект на /, без краша), admin-логин: неверный→«Неверный email или пароль.» (V10 локализ. ✅), верный→/admin.
- **C. Создатель:** /account (3 карточки), «Мои проекты»+статус-пилюли, **форма подачи = полный паритет с админской** (#304 ✅: все 9 секций, авто-Код, жанр multi-select 40, Фильм/Сериал, Формат/Язык, студия-datalist, переводы+Translate, автосейв черновика, **datalist автозаполнения персон #11 — 20 known people ✅**, актёры/тиры, постер-генератор), submit→PENDING+авто-Код `#PP-2026-9013` (creator не ставит isActive), уведомления создателя.
- **D. Бренд:** dashboard (аватар «QB», рекомендации, недавние), Browse+express-interest toggle (→«Интерес отправлен» V8 ✅), My Interests+withdraw (V8 ✅), Profile (Email ro/Company/Website/Categories/Budget/Скачать JSON), **sidebar без мёртвого «Скоро» D5 ✅**, уведомления.
- **E. Админ:** nav все 9 разделов + бейджи (Moderation 1 / Notifications 2), **Moderation: Approve QA-проекта → APPROVED+isActive=1+/reports/44=200 (E1 ✅)**, Projects edit+Save→редирект без «This page couldn't load» (баг #14 не воспроизв.), Users Staff/Members (qa-юзеры видны), Interests (F14 закрыт — раздел есть).
- **V9 уведомления A→Z ✅** — все 3 триггера подтверждены в БД: PROJECT_SUBMITTED→admin, INTEREST→admin, PROJECT_APPROVED→creator.
- **F. Статик-агенты:** гомоглифы **0** (i18n.ts чист), мёртвых кнопок/ссылок **0**, формат-гарды F6/F7 на месте (нет висячей запятой/пустых метрик), V7 CurrencySwitcher только в футере, все обязательные ключи (ui/auth/genre×44/formErr) в hy/ru/en.

### 🐛 НАЙДЕНО + ИСПРАВЛЕНО (tsc 0, каталог-фиксы проверены в браузере)
- **[MED] Каталог-фильтр «Формат» возвращал 0** — `formatCategory` пуст у ВСЕХ проектов (колонка добавлена поздно, `kind` тоже бесполезен — везде FILM). Фикс: `deriveFormatCategory()` (`form-shared.ts`) выводит бакет из токена `format`/`genre` («Series»→SERIES, «Feature/Film/Movie/Documentary»→FEATURE, +sitcom/podcast/reality/short/program), kind как запасной; применён в `projects.ts` (list+detail DTO). **Проверено:** Сериал→3, Полнометражный→5 = 8. Бакеты без данных законно пусты. Чинит и локальные, и прод-данные без миграции.
- **[MED] Каталог-фасет «Страна» разбивал `Diaspora (US, France)`** на «Diaspora (US» + «France)». Фикс: `splitCountries()` (`format.ts`) — парсер, уважающий скобки (не режет запятую внутри `()`). **Проверено:** один пункт `Diaspora (US, France)`.
- **[LOW] Подзаголовок регистрации** обещал «Доступ открывается после проверки администратором» — противоречит авто-APPROVED. Переписан (hy/ru/en): доступ сразу после регистрации.
- **[LOW] Профиль бренда, MultiSelect категорий** (`profile-form.tsx:77`) без `addLabel/removeLabel` → англ. дефолты «Add»/«Remove». Фикс: проброшены `t("ui.addOption")/t("ui.remove")`.
- **[LOW] `multi-select.tsx` кнопка добавления опции** без aria-label → добавлен (a11y).
- **[LOW] i18n `about.*` hy** латиница «Product placement» → транслитерация «Փրոդակթ փլեյսմենթ» (как на home). ru/en — заимствованный термин, оставлены.

**Файлы фикса:** `format.ts`, `form-shared.ts`, `projects.ts`, `i18n.ts`, `profile-form.tsx`, `multi-select.tsx`. **Миграция БД НЕ нужна** (деривация рантайм, схема не менялась).

### ✅ ОСТАЛОСЬ — данные/операционка → ЗАКРЫТО 2026-07-18 (прод+локалка)
- **[DATA] Проект «ԱՐԱՄ»** (прод id7 / локалка id38) ✅ нормализован под токены: `format="Feature · 100 min"`, `genre="Biography"` → на карточке hy рендерится «Ֆիլմ · 100 րоպе» / «Կենսագրական» (проверено live). UPDATE делать с `SET NAMES utf8mb4` (иначе двойная кодировка middot). Битый постер (`...e2e6d531.jpg` 404, файл потерян везде) → `poster=""` = чистый placeholder. Юзер может перезалить постер в админке.
- **[HOUSEKEEPING] Leftover** `e2e.creator.test@example.com` (локалка User id6, 0 FK) ✅ удалён. На проде его нет (там demo `creator@/brand@test.igovazd.am` — не трогали).
- B6 Google OAuth — ПРОПУСК (нет creds, как в плане).

### Деплой этого QA-батча
Код-фиксы готовы локально (tsc 0). Деплой — по команде юзера: git push (Hostinger соберёт), **db push НЕ нужен**. Прод-данные автоматически станут фильтруемыми по Формату (деривация рантайм). #38 — почистить в админке отдельно.

---

## ✅ СТАТУС 2026-07-15: батч РЕАЛИЗОВАН ЛОКАЛЬНО (tsc 0, E2E зелёный)

Всё оркестрировано параллельными агентами (coder/architect/scout). Готово и проверено локально (dev :3001, browse E2E):
- **п.1 email** (#22) ✅ nodemailer+Hostinger SMTP, трёхъязычные письма, хуки в модерации+подаче создателя.
- **п.2/5 кабинет создателя** (#16) ✅ /account/projects: мои проекты+статусы, подача→PENDING.
- **п.3+14 баг чёрного экрана** (#10) ✅ корень: redirect() в useActionState рендерит цель от корня + нет error.tsx. Фикс: {ok,redirect}+клиентская навигация во ВСЕХ потоках (login/register) + error.tsx. E2E: вход и сохранение с 1 раза, без чёрного экрана.
- **п.4 хедер аватар** (#15) ✅ SiteHeader-обёртка, кружок инициалы/фото + dropdown по роли.
- **п.6 авто-Code** (#17) ✅ #PP-YYYY-NNNN, retry на P2002.
- **п.7 Genre** (#18) ✅ searchable multi-select, 40 жанров (src/components/ui/multi-select.tsx).
- **п.8 Film/Serial** (#19) ✅ toggle→episodes/minutes→"60m/24episodes" в data-layer.
- **п.9 рег без модерации** (#12) ✅ status APPROVED, auto-login, сразу /account.
- **п.10 модерация проектов** (#13) ✅ /admin/moderation approve/reject, каталог фильтрует APPROVED.
- **п.11 роли** (#14 +#25 security) ✅ MODERATOR+PUBLISHER, хелперы canModerate/canEditContent, серверные гейты (закрыта эскалация MODERATOR).
- **п.12 кабинет бренда** (#23) ✅ /account/brand: dashboard/browse/interests/profile, модель Interest, expressInterest. TODO: MUTUAL-reveal, GARM-отчёт (заглушки).
- **п.13 быстрая заливка** (#20¹ ✅ multi-selects/studio/age-select) + **авто-перевод** (#21 ✅ Google AI, model gemini-flash-latest, редактируемо). ⏳ ОСТАЛОСЬ #20² проход2: single-page (tiers/crew inline), клон-шаблон, автосейв.
- **BONUS генерация постера** (#26) ✅ Nano Banana Pro (gemini-3-pro-image), 16:9, image-to-image, лого-оверлей (sharp), wave-анимация, кнопка в обеих формах.

**ОСТАЛОСЬ:** #20² (проход2 формы) + опц. мерж i18n-brand.ts→i18n.ts (сейчас работает через makeBrandUI). Секреты в .env + память external-secrets. Тестовые данные в ЛОКАЛЬНОЙ БД (E2E Test Serial, E2E Creator) — почистить перед деплоем. Деплой — раздел ниже, по команде.

---

## 1. Уведомления (email) — провайдер: **Hostinger SMTP**

Сейчас: одобрение = админ меняет `status` в БД (`setMemberStatus`), НИКАКИХ писем не уходит.
Почтовой инфры в проекте нет. Пользователь не узнаёт, что может войти.

Инфра:
- [ ] `nodemailer` + SMTP. Ящик `noreply@igovazd.am` (создать в hPanel), взять SMTP-данные.
- [ ] Env: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM="iGovazd <noreply@igovazd.am>"` (в hPanel, не в git).
- [ ] Абстракция `sendMail()` + шаблоны. Отправка **async + try/catch** — письмо НЕ блокирует и не ломает действие; ошибки в лог.
- [ ] Слать только при реальной смене (old ≠ new) — повторный клик не дублирует.
- [ ] Локаль юзера не хранится → письма **трёхъязычные (hy/ru/en)** ИЛИ добавить `User.locale` при регистрации. (решить)

События (все выбраны):
- [ ] **APPROVED → юзеру:** «аккаунт одобрен, можете войти» + ссылка `/login`.
- [ ] **REJECTED / BLOCKED → юзеру:** уведомление о решении.
- [ ] **Новая регистрация → админу:** письмо о новой заявке (в дополнение к бейджу в панели).
- [ ] **Публикация одобрена/доступна → создателю:** когда проект создателя одобрен и уже виден на igovazd.am (в каталоге) — письмо «ваша публикация одобрена и доступна» + ссылка на страницу проекта.

---

## 2. Кабинет `/account` — нет функционала

Сейчас: кабинет показывает профиль + карточки-заглушки. Юзер (создатель/бренд) **ничего не может делать**.

Нужно спланировать реальный функционал:
- [ ] **Создатель:** что именно? (загрузка проекта/сценария, «мои проекты» со статусами, редактирование, аналитика?) — нужно ТЗ.
- [ ] **Бренд:** что именно? (просмотр каталога, отправка интереса/заявок на размещение, «мои заявки»?) — нужно ТЗ.
- [ ] Связь с уведомлением из п.1 (публикация одобрена) — создатель подаёт проект из кабинета → админ одобряет → письмо + проект в каталоге.

> Требуется уточнение объёма от пользователя (диктует ниже).

---

## 3. Баг: вход в админку — ошибка на чёрном экране, потом ОК после reload

- [ ] При входе как админ: после нажатия кнопки login сначала выдаёт ошибку на чёрном экране,
      потом после reload заходит нормально. Починить (не должно быть ошибки/чёрного экрана; вход с первого раза).

## 4. Хедер: залогиненный юзер видит «Войти/Регистрация» + клик по лого

- [ ] После логина как создатель клик по лого ведёт на home page, и там показывается кнопка
      «Войти / Регистрация» — хотя юзер уже залогинен. Должно показывать, что вошёл.
- [ ] Показывать **кружок с фото ИЛИ инициалами** (напр. Hayk Karapetyan → «HK», первые буквы).
- [ ] При клике на кружок — маленькое окошко (dropdown) с «Выход» и (ещё пункты — спланировать, что там нужно).

## 5. Функционал создателя (creator) — нет, нужно сделать

- [ ] У создателя нет функционала. Нужно спланировать и сделать. (ждёт ТЗ — что именно может делать создатель)

## 6. Project Code (#PP-2026-1990) — авто-генерация

- [ ] Поле `Code` проекта (напр. `#PP-2026-1990`) должно **генерироваться автоматически**,
      не вводиться вручную в админке.

## 7. Genre — выбор из списка (dropdown)

- [ ] Поле `Genre` — **выбор из списка** (select), не свободный ввод.
- [ ] Список жанров (из Filmustage, 40 уникальных; в источнике `Documentary` дублировался — оставить один):
      Comedy, Drama, Melodrama, War, Adventure, Biography, Crime, Kids, Documentary, Romance, Action,
      Fantasy, History, Family, Thriller, Musical, Short, Detective, Cartoon, Horror, Sitcom, Psychological,
      Animation, Rock-Opera, Tragicomedy, Mystery, Sci-Fi, Teen Movies, TV Show, Stand-Up, Theater,
      Television play, Opera, Football Show, Music, Sport, Psychological Thriller, Reality Show, Western, Interview.
- [ ] Дропдаун **с выбором и поиском** (searchable select, как react-select у Filmustage — можно печатать/фильтровать список).
- [ ] Мульти-выбор (у Filmustage — multi-select listbox с поиском).

## 8. Тип: Фильм / Сериал + поля сериала

- [ ] При добавлении проекта — выбор **Фильм или Сериал**.
- [ ] Если **Сериал** → открывается/активируется поле: **кол-во эпизодов** + **время** (напр. 60 минут, 24 эпизода).
- [ ] В UI пользователя отображать как **`60m/24episodes`**.

## 9. Регистрация без модерации — сразу в кабинет

- [ ] После регистрации **модерация НЕ нужна** — юзер сразу попадает в кабинет (`/account`).
      Т.е. статус при регистрации = `APPROVED` (не `PENDING`), без ожидания одобрения админа.

> ⚠️ Влияет на п.1: письмо «аккаунт одобрен» и «новая заявка админу» теряют смысл при отсутствии модерации.
> Уточнить: оставляем ли за админом возможность блокировать юзера позже (BLOCKED)?
> Уведомления тогда: только блок→юзеру + публикация одобрена→создателю.

## 10. Модерация — на уровне ПРОЕКТА, не аккаунта

- [ ] Модерация нужна, когда юзер **добавляет проект**. Т.е.:
      - аккаунт — без модерации (п.9), сразу в кабинет;
      - проект от создателя → уходит на модерацию → админ одобряет → проект публикуется на igovazd.am.
- [ ] Проекту нужен статус модерации (напр. `DRAFT/PENDING/APPROVED/REJECTED`).
- [ ] Одобрение проекта → письмо создателю «публикация одобрена и доступна» (связь с п.1).

> Итог по уведомлениям (с учётом п.9+п.10): аккаунт-модерации нет; модерируются проекты.
> Письма: публикация одобрена→создателю, публикация отклонена→создателю, новый проект на модерацию→админу,
> (опц.) блок юзера→юзеру, если оставляем блокировку.

## 11. Роли в админке: MODERATOR + PUBLISHER

- [ ] Добавить роль **MODERATOR** в админке.
- [ ] Роль **PUBLISHER** (уже есть в enum как staff — уточнить/донастроить права).
- [ ] Определить права каждой роли: SUPERADMIN (всё), MODERATOR (модерация проектов?), PUBLISHER (что именно?).

> Требует уточнения: какие права у MODERATOR vs PUBLISHER (кто модерирует проекты, кто публикует/редактирует контент).

## 12. Кабинет ПОКУПАТЕЛЯ рекламы (бренд) — по референсу filmustageplacement.com

Референс-скриншоты: `filmustage-ref/01-dashboard-full.png … 05-report-detail.png`.
Сделать похожий кабинет для бренда (покупатель рекламы). Структура:

- [ ] **Сайдбар:** Dashboard · Browse Projects · My Interests · My Profile · Notifications (Soon) · email+тема · Log Out.
- [ ] **Dashboard:** приветствие «Welcome back, {бренд}» + дата · demo-баннер · Active Interests (пусто→CTA) ·
      Recommended for You (по категориям профиля) · Recent Updates · Recently Added (сетка проектов).
- [ ] **Browse Projects (каталог):** баннер «анонимно до взаимного интереса» · поиск + сортировка + grid/list ·
      карточки: постер, жанр, badge безопасности (Safe/Review/Risk), код, `50 ep × 1m 15s`, рынки, аудитория,
      «N opportunities», цена, прогноз просмотров, кнопки View Report + Request details.
- [ ] **My Interests:** проекты, где нажал «интерес» (пусто→CTA).
- [ ] **My Profile:** Email (не меняется) · Company Name + Website · Brand Profile: **Categories** (чипы) +
      **Budget Range** · Download my data (JSON).
- [ ] **Report detail (для покупателя):** табы Overview/Scenes/Safety/Investment/More · статы (просмотры, brand safety,
      CPM, бюджет) · Brand Match Report (scene-level opportunities) · ROI Snapshot · **GARM Brand Safety** (gauge+категории) ·
      Investment & Deliverables · **Express Interest** (главная CTA) · Deep Dive (раскрывашки).
- [ ] Связь: «Express Interest» бренда → появляется у создателя/админа; взаимный интерес → раскрывается анонимность.

> Примечание: на iGovazd публичный каталог/отчёты уже есть (для создателей). Здесь — приватный кабинет БРЕНДА
> с матчингом по категориям, списком интересов и express-interest.

## 13. Быстрая заливка контента (админ-форма проекта) — выбранные оптимизации

Поля:
- [ ] **Searchable multi-select** для Genre, Countries, Platforms, Cinemas (дропдаун с поиском + мульти-выбор).
- [ ] **Film/Serial toggle → авто Format** (сериал: эпизоды+время → `60m/24episodes`; п.8).
- [ ] **Авто-генерация Code** (`#PP-2026-XXXX`; п.6).
- [ ] **Studio autocomplete** (из уже введённых) + **Age rating select** (вместо текста).

Поток:
- [ ] **Одна страница** — тиры/crew в той же форме (убрать двухэтапность create→edit).
- [ ] **Клон проекта как шаблон** (кнопка Duplicate).
- [ ] **Автосохранение черновика** (не терять ввод).

- [ ] **Авто-перевод hy/ru/en** через **Google API (free tier)** — модель Gemma 3 (`gemma-3-27b-it`) или
      Gemini 2.5 Flash (один бесплатный ключ, армянский поддерживают; модель переключаемая, выбрать по качеству).
      Env `GOOGLE_AI_API_KEY`. Кнопка «Перевести»: заполняешь один язык → автозаполняет остальные (title+synopsis).
      **Результат перевода можно редактировать вручную** после автозаполнения (не финальный, правится).

## 14. Баг: редактирование проекта + добавление фото → Save → ошибка

- [ ] При редактировании проекта в админке: добавил фото → «Сохранить» → ошибка
      **«This page couldn't load. Reload to try again, or go back.»** — **та же** ошибка, что при входе в админку (п.3).
- [ ] Похоже на общий баг server-action/рендера на проде (одинаковый экран ошибки). Проверить оба вместе.

## QA 2026-07-17 (Волна 2) — находки

- [x] **BUG (краш, найден+исправлен QA):** creator `/account/projects/new` → 500 «Что-то пошло не так». Причина: серверный `new/page.tsx` передавал в клиентский ProjectForm инлайн-обёртку `posterAction={(input)=>generateCreatorPosterAction(input)}` — Next запрещает передавать обычные функции в client component (только "use server"-actions). tsc НЕ ловит (рантайм). Фикс: передавать `posterAction={generateCreatorPosterAction}` напрямую (project-form сам оборачивает с projectId). Проверено: форма рендерится, локализована. **УРОК:** при передаче server-action как пропа в client-компонент — БЕЗ инлайн-обёрток из серверного компонента.
- Прочее QA чисто: логаут (клиентский, без краша), Applications убран (nav+роут+dashboard-карточка), Users-вкладки Staff/Members, hero на всех не-home (хедер читаем), admin-форма англ. + удалённые поля убраны + cast-datalist, creator-форма локализована (8 секций, Visibility скрыт), /contact (leads→email), карточки login-CTA. Console-ошибок нет (leads.ts/project-card в логе — стейл HMR, ушли).

## (место для новых пунктов — пользователь диктует)

- [x] **BUG: иконка пароля на логине** — ПРОВЕРЕНО 2026-07-17: и `/login` (login-form.tsx:69), и `/admin/login` (login-form.tsx:56) УЖЕ используют `PasswordInput` с глазом (коммит a0d5991, на проде). Ложный баг — юзер видел старую вкладку до деплоя. Ничего чинить не нужно.

- [ ] **Creator-форма подачи проекта ≠ админская (нужна полная паритетность).** `/account/projects/new` (`src/app/account/projects/new/project-submit-form.tsx`) — урезанная: есть только title, synopsis, genres, kind(film/serial), episodes/episodeMinutes, poster(+генератор), format, studio, countries. НЕТ (а в админской `project-form.tsx` есть): переводы hy/ru/en + кнопка Translate, Status & release, Placement (даты/платформы/placementType/цена/priceNote), Audience & value (CPM/бюджет/projViews/ageRating), Press-kit (tagline/subgenre/references/cinemas), Cast & crew (ActorsSection), Sponsorship tiers (TiersSection), автосейв черновика. Хочет: creator-форма как в админке, с тем же функционалом. **Подход:** переиспользовать `project-form.tsx` для creator-потока (или вынести общий компонент), submit → moderationStatus=PENDING (не APPROVED), ownerId=creator. Проверить: авто-Code, гейты, что creator НЕ может ставить isActive/moderationStatus сам. (записано 2026-07-16, НЕ чинено)

- [ ] **BUG (прод): логаут кидает «Что-то пошло не так» на igovazd.am** — при выходе из member-аккаунтов (creator И brand), свежие вкладки, воспроизводится стабильно. **Корень найден:** обе logout-actions (`src/app/account/actions.ts` memberLogout + `src/app/admin/actions.ts` staffLogout) используют серверный `redirect()` внутри server-action. Это ТОТ ЖЕ паттерн, что батч-фикс «чёрного экрана» (2026-07-15) убрал из login/register → перевёл на `{ok,redirect}` + клиентскую навигацию, т.к. серверный `redirect()` в action крашит на Hostinger/Passenger. Логаут забыли мигрировать. Локально (dev + прод-билд :3002) НЕ воспроизводится — только на Hostinger. **Фикс:** сделать logout клиентским — server-action только удаляет cookie (без redirect), клиент делает `window.location.assign("/")` (member) / `"/admin/login"` (staff). Правки: `header.tsx` UserMenu + мобильное меню (обе `<form action=logout>` → onClick-хендлер), `account/actions.ts`, `admin/actions.ts` (убрать redirect, вернуть void/`{ok}`). Проверить также логаут из `/account`, `/account/brand` сайдбаров + `admin-shell.tsx`. (записано 2026-07-16, НЕ чинено)

- [ ] …

---

## Отдельно: уже готово локально, ждёт деплоя (не терять)
- Убраны 3 иконки (звонок/Telegram/WhatsApp) из хедера.
- Страница `/about` (hero + «Бренды⇄Создатели» + принципы + сеть + CTA) + пункт «О нас» в навигации.
- Перенос блока «Вся сеть» из `/portfolio` в `/about`.
- Фиксы: пульс кнопки «Product placement», чистый hero-баннер.

---

## ДЕПЛОЙ НА ПРОД (⛔ ТОЛЬКО по явной команде юзера — снят с task list)

Работаем локально. Деплой делать ТОЛЬКО когда юзер скажет «сделай деплой».

**Что деплоить:** весь батч fix.md (#10–#26) + /about + хедер −3 иконки.

**Процесс (см. память prod-deploy-migration + docs/Prod-Deploy-2026-07-15.md):**
1. Deploy-цепочка Hostinger (git push→main) делает только `npm install`+`next build` — **НЕ мигрирует БД и НЕ несёт .env**.
2. **Прод-БД мигрировать ВРУЧНУЮ ПЕРЕД push:** remote `prisma db push` (host srv2026.hstgr.io, порт 3306, доступ открыт). Новые поля/модели: Project.moderationStatus/kind/episodes/episodeMinutes/genres, Role+=MODERATOR, User.avatar/website/brandCategories/budgetRange, модель Interest. Сначала `prisma migrate diff` (превью), потом push.
3. **Новые env в hPanel (Node.js app config) ДО рестарта** (значения — в памяти external-secrets, не в git):
   `GOOGLE_AI_API_KEY`, `GOOGLE_AI_MODEL=gemini-flash-latest`, `GOOGLE_IMAGE_API_KEY`, `GOOGLE_IMAGE_MODEL` (рабочая image-модель), `SMTP_HOST/PORT/SECURE/USER/PASS`, `MAIL_FROM`, `ADMIN_EMAIL`. (Google OAuth CLIENT_ID/SECRET — юзер отложил.)
4. Почистить тестовые данные (E2E Test Serial, E2E Creator) — но это ЛОКАЛЬНАЯ БД, прод отдельная, не касается.
5. Создать почтовый ящик noreply@igovazd.am в hPanel (для SMTP) если ещё нет.
6. `tsc`+`next build` чисто локально → git push main → рестарт Node.js app → проверить роуты 200. **Indexing OFF** (noindex+robots disallow).

---

## QA-АУДИТ 2026-07-15 (полный проход как пользователь) — task #36

Статус: ✅ АУДИТ ЗАВЕРШЁН (20 находок: 1 HIGH, 8 med, 11 low). Динамика — Playwright (dev :3001), статика — агент. Чиним в task #37 по приоритету (внизу).

Флоу для прохода: публичный сайт (nav/каталог/about/how-it-works/portfolio/contact/legal — все ссылки+кнопки), регистрация→/account, логин (member+admin), кабинет создателя (мои проекты/подача), кабинет бренда (dashboard/browse/interests/profile), заявки (contact/express-interest/apply-dialog), формы+валидация.

### Находки

#### A. Динамика (Playwright, проход как пользователь)

**Регистрация / кабинет создателя**
- **F1 [med] i18n** — глаз-пароль: aria-label жёстко русский «Показать/Скрыть пароль» (`ui/password-input.tsx`), при hy/en локали не переводится. Фикс: локализовать через i18n-ключ.
- **F2 [med] copy-paste** — `/account/projects/new` подзаголовок формы = «Ձեր ներկայացրած բոլոր նախագծերն ու դրանց մոդերացիայի կարգավիճակը» (описание СПИСКА проектов), не формы подачи. Тот же неверный текст на карточке кабинета `/account`. Фикс: отдельный i18n-ключ описания формы подачи.
- **F3 [low] i18n** — placeholder email в регистрации `you@brand.com` не меняется для роли Создатель (он не бренд); поле «Ընկերություն»(Компания) для создателя странно. Фикс: условный placeholder/лейбл по роли.
- **F4 [low] UX** — карточка проекта в `/account/projects` не кликабельна: создатель не может открыть/редактировать/посмотреть свой поданный проект. Фикс: ссылка на detail/edit (или явно указать «редактирование недоступно на модерации»).

**Публичный сайт / данные**
- **F5 [med] i18n** — список жанров (40 шт) ВЕЗДЕ на английском (Comedy/Drama/Melodrama…): в форме создателя, на карточках каталога/главной («Biographical Drama», «Comedy»), фильтрах. При hy/ru не переводится. Фикс: словарь перевода жанров по локали.
- **F6 [med] формат-баг** — карточка проекта: при пустом age-range рендерится «Բոլորը,» с висячей запятой (АРАМ #38, E2E Serial #39). Фикс: не выводить запятую/лейбл если возраст пуст.
- **F7 [med] формат-баг** — «X кանխատեսվող դիտում» рендерится с пустым числом когда просмотров нет (E2E Serial). Фикс: скрывать строку если значения нет.
- **F8 [low] формат** — формат сериала «60m/24episodes» без пробелов и не локализован (карточка E2E Serial). Фикс: «60 мин × 24 эпизода» локализованно.
- **F9 [low] данные/i18n** — на карточке #38 (АРАМ) поля англ. посреди армянской локали: «Movie · 1h 40m · Color», «Biographical Drama». Часть — данные (введено админом англ.), часть — метки не локализованы.
- **F10 [med] i18n** — фильтр жанров в `/catalog` мешает англ. коды жанров («Comedy», «Biographical Drama») с армянскими категориями («Կատակերգական ֆիլմ»…) в одном списке чекбоксов — несогласованно. Связано с F5. Фикс: единый локализованный источник жанров/категорий.

**Заявки / формы (заявки-флоу)**
- **F11 [med] i18n — ПОДТВЕРЖДЕНО динамически** — apply-диалог (report page, «Ցուցաբերել հետաքրքրություն»): пустой submit → англ. ошибка «Please enter your name.» в полностью армянском диалоге (`src/lib/actions/applications.ts` `submitApplication`). Фикс: локализовать ошибки через i18n. Happy-path работает (лид создаётся, попадает в /admin/applications).
- **F12 [med] i18n** — контактная форма (home/`/contact`, `submitLead` в `src/lib/actions/leads.ts`) — ошибки валидации тоже жёстко английские при локализованной форме. Фикс: локализовать.

**Кабинет бренда — КРИТИЧНО ДЛЯ БИЗНЕСА**
- **F13 [HIGH] навигационный тупик — ПОДТВЕРЖДЕНО динамически** — кабинет бренда `/account/brand/**` (dashboard/browse/interests/profile) полностью РАБОТАЕТ (проверено e2e: express-interest → карточка «Ուղարկված» в интересах, профиль сохраняется), НО на него нет НИ ОДНОЙ ссылки. BRAND после логина попадает на `/account` (`account/page.tsx`), где видит только карточку «Դիտել կատալոգը»→/catalog. Кабинет достижим лишь ручным вводом URL. Итог: главная фича маркетплейса (express-interest брендом + рекомендации + профиль) недоступна обычному пользователю. Фикс: для `role==="BRAND"` — `redirect("/account/brand")` в `account/page.tsx`, либо `cabinetHref="/account/brand"` в `site-header.tsx`, либо заменить карточку ссылками на кабинет бренда.
- **F14 [low] gap** — express-interest бренда создаёт ProjectInterest, но в админке НЕТ раздела для просмотра интересов брендов (есть только Applications=лиды). Возможно by-design, но интересы никуда не эскалируются. Проверить: нужен ли админу их видеть.

#### B. Статика (агент по коду) — доп. находки к A

- **F15 [low] i18n/утечка** — `account/projects/actions.ts:178,183` + `poster-action.ts:30,50`: англ. строки в локализ. флоу создателя («Could not generate a unique project code…», «Prompt is required.») и сырой `e.message` из image-gen прокидывается пользователю (утечка внутр. ошибки). Фикс: i18n-ключи; логировать e.message, показывать общий текст.
- **F16 [low] UX/валидация** — `admin/login/login-form.tsx`: поля email/password без `required` (в member-логине есть). Не крашит (сервер валидирует), но пустой submit летит на сервер. Фикс: добавить `required`.
- **F17 [low] UX/валидация** — `contact-page/contact-form.tsx`: поля name/email/message без `required` и клиентской валидации; только серверная (с англ. ошибками, F12). Фикс: `required` на name/email.
- **F18 [low] баг** — `poster-generator.tsx` внутри креатор `project-submit-form.tsx`: панель генератора вложена в основной `<form>`; поле «Текст на постере» — `<input type=text>` → Enter в нём преждевременно сабмитит createCreatorProject. Фикс: вынести генератор из `<form>` или перехватывать Enter (preventDefault).
- **F19 [low] doc/код рассинхрон** — само-регистрация создаёт `status=APPROVED` и логинит сразу (`members.ts` + `register/actions.ts`), а AGENTS.md/MEMORY описывают `PENDING→одобрение админом`. Следствие: pending-badge и `/admin/registrations` для само-рег. мёртвые; ветка `login.errPending` недостижима. Код помечен комментарием как намеренный → устарела ДОКУМЕНТАЦИЯ. Фикс: обновить AGENTS.md/память (или вернуть PENDING, если модерация нужна).
- **F20 [low] UX** — `brand/browse/browse-view.tsx:60`: при ошибке express-interest показывается общий `errorMessage`, а не конкретный `res.error` (уже в state). Фикс: показывать `error`.

#### C. Проверено — ЧИСТО (без багов)
Логин member (верный+неверный → локализ. ошибка «Սխал էl. փost…»), глаз-toggle (type→text), регистрация creator+brand→/account (авто-APPROVED, F19), подача проекта→PENDING→админ Approve→isActive=true→публично на /reports/42 (полный флоу модерации ✅), express-interest брендом e2e, профиль бренда save (website+budgetRange персистятся), apply-диалог happy-path→/admin/applications, гейт модерации (PENDING-проект НЕ виден в каталоге), auth-гейты `requireMember`/`requireUser` (defense-in-depth, перечитка БД), кнопки дизейблятся по pending (нет двойного submit), класс «label вокруг composite» не воспроизводится. Локаль-бейдж `Հայ` ок.

### Приоритет фикса (task #37)
1. **F13 [HIGH]** — тупик кабинета бренда (бизнес-критично).
2. **F11+F12+F15 [med]** — локализация ошибок форм (apply/contact/creator-actions).
3. **F5+F10 [med]** — единый локализованный источник жанров.
4. **F6+F7 [med]** — формат-баги карточек (висячая запятая, пустое число).
5. **F1+F2 [med]** — aria-label глаза, подзаголовок формы подачи.
6. **F3,F4,F8,F9,F16–F20 [low]** — мелочи по мере времени.

### Статус исправлений (task #37) — ✅ ЗАВЕРШЕНО, tsc 0, E2E-проверено

- **F13 [HIGH] ✅** — `account/page.tsx`: `if (user.role==="BRAND") redirect("/account/brand")` + удалена мёртвая brand-ветка. **E2E:** логин бренда → сразу `/account/brand` (кабинет), не тупик.
- **F1 [med] ✅** — `PasswordInput` получил props `showLabel`/`hideLabel` (дефолт англ.), member-формы (login/register/reset ×4) прокидывают `t("auth.passwordShow/Hide")`. Ключи добавлены. **E2E:** aria глаза на /login = «Ցույց տալ գաղտնաբառը». Admin-формы — англ. дефолт (staff).
- **F2 [med] ✅** — новый ключ `account.submitProjectSubtitle`; заменён неверный `myProjectsSubtitle` в `account/page.tsx` (карточка) и `account/projects/new/page.tsx` (форма).
- **F5+F10 [med] ✅** — 38 ключей `genre.*` добавлены в `i18n.ts` (всего 44) → `localizeValue` переводит жанры на карточках/каталоге/фильтре/report/browse. **E2E:** «Comedy»→«Կատակերգություն». Кастомные жанры вне списка (напр. «Biographical Drama») остаются как есть (fallback, ожидаемо).
- **F6 [med] ✅** — висячая запятая при пустом age убрана: `[gender, age].filter(Boolean).join(", ")` в project-card, browse-view, catalog-view (list), report-hero (join " ").
- **F7 [med] ✅** — пустые метрики (просмотры/CPM) больше не рендерятся: guard в project-card, catalog-view, report-hero (3 карточки), roi-snapshot.
- **F11 [med] ✅** — `submitApplication` (applications.ts): ошибки через `makeUI(getLocale())` + ключи `formErr.*`. **E2E:** пустой apply → «Մուտքագրեք ձեր անունը։».
- **F12 [med] ✅** — `submitLead` (leads.ts): те же `formErr.*` ключи.
- **F15 [low] ✅** — `account/projects/actions.ts` unique-code ошибка → `account.form.errCode`; `poster-action.ts` не течёт `e.message` (console.error + `errPosterFailed`), prompt-ошибка → `errPosterPrompt`.
- **F16 [low] ✅** (агент) — `admin/login/login-form.tsx`: `required` на email/password.
- **F17 [low] ✅** (агент) — `contact-form.tsx`: `required` на name/email/message.
- **F18 [low] ✅** (агент) — `poster-generator.tsx`: `onKeyDown` preventDefault на Enter (не сабмитит внешнюю форму).
- **F19 [low] ✅** — `AGENTS.md`: описание auth обновлено (авто-APPROVED, BRAND→/account/brand redirect).
- **F20 [low] ✅** — `browse-view.tsx`: показывается конкретный `res.error` (fallback errorMessage).
- **F21 [БОНУС, найдено при фиксах] ✅** — кириллические гомоглифы в 5 армянских i18n-строках («Դерасаннер», «Blocked», «redirecting») → заменены на настоящие армянские буквы. Скрипт-скан `i18n.ts`: ALL hy CLEAN.
- **F3 [low] — отложено** — placeholder email `you@brand.com` / поле «Компания» для роли Создатель (косметика, нужен client-state по роли).
- **F8 [low] — не чинилось** — формат «60m/24episodes» это сохранённые ДАННЫЕ теста #39 (генератор #19 в норме для новых).
- **F9 [low] — данные** — англ. поля на карточке #38 (АРАМ) введены админом вручную, не код-баг.
- **F14 [low] — на решение** — express-interest бренда не виден в админке (нет раздела Interests). Нужно продуктовое решение: эскалировать ли брендовые интересы админу/создателю.

---

## 🆕 РАУНД 2026-07-17 — визуальные / респонсив баги (после деплоя Фазы-2, прод `3ca72bc`)

Юзер обходит живой прод (igovazd.am), диктует по одному. СОБИРАЕМ ВСЁ, потом фиксим+тестим одним заходом, потом деплой. Ничего не начинаем, пока список не закрыт.

Легенда: `[ ]` не начато · `[~]` в работе · `[x]` готово+протест.

- [ ] **V1 — /catalog: респонсивность + кнопки** (task #17). На https://igovazd.am/catalog проблемы с адаптивом (узкие/мобильные вьюпорты) и с кнопками. Проверить также остальные страницы на те же проблемы (grid карточек, панель фильтров/сортировки, view-toggle grid/list, hero). Детали — уточнить у юзера / воспроизвести на мобильном вьюпорте.
- [ ] **V2 — /catalog: фильтр «Ձևачափ» (Формат)** (task #18). Добавить в сайдбар фильтров новую секцию-заголовок **Ձևачափ** с чекбоксами-категориями:
  - Լիամետրаж ֆիлм (полнометражный фильм)
  - Սериал
  - Սиթком
  - Փодкаст
  - Ռеалиты шоу
  - Հагордум (передача)
  - Карчаметраж филм (короткометражка)
  ⚠️ Источник данных: поле **Format** удалили из формы на #7. Решить — вернуть Format в форму проекта / расширить `kind` (сейчас Film|Serial) / новое поле enum. Локализовать hy/ru/en. Фасет+фильтрация в catalog-view + data-layer.
- [ ] **V3 — /catalog: фильтр ՏԱՐԻՔ (Возраст)** (task #19). В секции «Թираխайин ласаран» ПОСЛЕ ՍԵՌ (пол) добавить ՏԱՐԻՔ: Բолорь / 0-12 տарекан / 13-17 / 18-24 / 25-44 / 45+. UI как у пола (toggle/select). Локализ hy/ru/en, фильтрация по audienceAge.
- [ ] **V4 — /catalog: убрать верхнюю плашку** (task #20). Удалить строку-нотис вверху («Հашветвутьюннерь ананун ен, минчев форцадарц…» — про анонимность). Юзер: инфо не нужна.
- [ ] **V5 — /catalog: доп. фильтры (язык/платформа/страна)** (task #21). В ТЕКУЩИЙ батч (юзер: сейчас, не позже). Рядом с сортировкой добавить фасеты: язык, платформа, страна и др. Данные: платформа+страна у проектов ЕСТЬ → сразу. Язык — поля НЕТ, добавить в схему+форму. Локализ hy/ru/en.
- [ ] **V6 — /reports/[id]: респонсив + ROI-блок / login-CTA** (task #22). На https://igovazd.am/reports/1 блок «Прогноз ROI» (`report/roi-snapshot.tsx`): (1) проблемы с респонсивностью; (2) кнопка «Войдите, чтобы оставить заявку» висит в пустой широкой band внизу — некрасиво, не на месте (появилось после #12 ApplyDialog→login-link). Переработать layout: разместить CTA логично + компактно, адаптив на узких вьюпортах. Проверить весь /reports на респонсив (report-hero, key-facts и т.д.).
- [ ] **V7 — /reports/[id]: консистентность данных (валюта)** (task #23). Юзер: «инфа должна полностью соответствовать». Наблюдение: свитчер = AMD, но report показывает € (€137 982–€275 964 + €22 838–€28 548 /scene), а на /catalog тот же #PP-2026-8540 = ֏ (58М–116М AMD). Report не уважает выбранную валюту / конвертация несогласована. ⚠️ УТОЧНИТЬ трактовку: соответствовать (а) валюте селектора / (б) значениям каталога / (в) между двумя ценами. Проверить currency-provider, formatMoney, localeSwitcher на report vs catalog.

---

## 🆕 ФАЗА B — крупный функционал (2026-07-17, после каталог-батча V1–V7)

- [ ] **V8 — Бренд «Мои интересы» A→Z** (task #24). Кабинет /account/brand: добавить в интересы / список / удалить из интересов / состояние кнопки на карточке+report. Модель Interest есть. Юзер: процесс непонятен/не реализован — довести полностью.
- [ ] **V9 — Система уведомлений** (task #25). Кнопка «Уведомления · Скоро» = placeholder. Реализовать A→Z: модель Notification, триггеры (интерес/заявка/модерация/статус), бейдж непрочитанных, список, отметить прочитанным. Админка + кабинеты creator/brand. Убрать «Скоро».
- [ ] **V10 — Валидация форм + подсказки ошибок (аудит всей системы)** (task #26). Многие формы молчат при ошибке (неверный пароль/логин), нет placeholder-подсказок. Пройти ВСЕ формы (login ×2, register, complete, forgot/reset, contact, project-form admin+creator, users, tiers/actors) → inline-ошибки, серверные ошибки наружу локализованно (hy/ru/en), placeholder где нет.

### Порядок Фазы B: B1=V8 (Interests) → B2=V9 (Notifications) → B3=V10 (валидация).
- [ ] **V11 — PostCSS override ≥8.5.10 (security)** (task #26+? see tasklist). Advisory postcss<8.5.10 XSS (</style>). Прямой=8.5.16 safe; уязвима только вложенная next/node_modules/postcss@8.4.31 (build-time, юзер-CSS в app нет → near-zero). Фикс: package.json `overrides:{"postcss":"^8.5.10"}` → npm install → `next build` обязан пройти (форс внутр. пина Next рискован — если ломается билд, откат). Делать ПОСЛЕ пишущих агентов.

---

## ✅ СТАТУС 2026-07-17 — батч V1–V8 РЕАЛИЗОВАН ЛОКАЛЬНО (:3001, tsc=0), НЕ на проде

Оркестрировано 3 агента (opus catalog-lane, sonnet report-lane, sonnet interests-lane) + form-audit scout. Все hy-строки чисты от гомоглифов.
- **V1 [x]** респонсив каталога: footer-кнопки flex-col/w-full → sm:flex-row (project-card + ProjectRow).
- **V2 [x]** фильтр Формат (7 категорий, formatCategory) — schema+form+data+filter, всегда полный набор.
- **V3 [x]** фильтр Возраст (бакеты 0-12…45+, overlap-логика) в Target audience.
- **V4 [x]** верхняя плашка-нотис удалена (+import ShieldCheck убран).
- **V5 [x]** фильтры Язык(language, новая колонка)/Платформа/Страна (Platform/Country — distinct, условный рендер).
- **V6 [x]** /reports ROI-CTA переделан (центр, Lock, w-full мобил), report-hero/key-facts респонсив.
- **V8 [x]** Бренд «Мои интересы» A→Z: withdrawInterest, toggle на Browse (Heart→Check→hover X/Remove), remove-button на Interests, badge в sidebar, empty-state. Interest-модель без изменений. +ключ btn.removeInterest (добавлен в i18n.ts). МИНОР: на тач-девайсах у активной кнопки Browse нет pre-tap подсказки «удалить» (на Interests есть явная Remove — не блокер).

### ⚠️ ДЕПЛОЙ-ПРИМЕЧАНИЯ
- **Прод БД: `prisma db push` ДО пуша** — 2 новые колонки `Project.formatCategory`, `Project.language` (обе `String @default("")`, аддитивно). Локально уже сделано (:3307).
- Локальный dev-фикс: prisma engine DLL держал прод-сервер :3002 → остановлен; полный `prisma generate` сделан; dev :3001 перезапущен.

### V7 [~] — ждёт решения юзера (валюта, не баг). V9/V10/V11 — Фаза B, не начаты (V10 аудит form-audit в процессе).

---

## 📋 V10 ПЛАН (form-audit, аудит 18 форм) — для Фазы B3

**Гуд (ошибки локализованы+показываются):** member login /login ✓, register, forgot, reset-password, contact, complete(google), brand-profile.

**Блок 1 — КРИТИЧНО (жалоба юзера #1):**
- `/admin/actions.ts::login` — 5 хардкод-EN ошибок (строки 55/60/65/68/79) → обернуть в t(); достать locale в экшене (как в /login/actions.ts:37-38). Форма показывает ошибку ок (login-form.tsx:75-79), но текст английский при hy/ru. → member-login работает, ADMIN-login = английский. Нужны новые ключи login.errTooManyAttempts, login.errDeactivated; reuse login.errInvalid.

**Блок 2 — MEDIUM (admin workflow):**
- `/admin/(panel)/users/user-form.tsx` + actions — добавить required на email/name/password; локализовать (reuse formErr.email, auth.resetWeak); resetUserPassword хардкод (строка 68)→t("auth.resetWeak").
- `/admin/(panel)/portfolio/actions.ts` validateMetrics (53/57) — новые ключи formErr.metricsNotObject, formErr.metricsNotJson; +required на title/brand.
- `/admin/(panel)/partners/actions.ts` (41) "Name is required." → t (новый formErr.company или partnerName).

**Блок 3 — POLISH:**
- `project-form.tsx` — required на title/titleHy/titleRu/titleEn.

**Новые i18n ключи (5):** login.errTooManyAttempts, login.errDeactivated, formErr.company, formErr.metricsNotObject, formErr.metricsNotJson (hy/ru/en у form-audit в отчёте). Reuse: formErr.name/email/emailInvalid, auth.resetWeak, register.errEmailTaken, login.errInvalid.

---
## ✅ V10 + V11 РЕАЛИЗОВАНО ЛОКАЛЬНО (2026-07-17, tsc=0, next build=0)
**V11 (postcss security):** package.json `overrides.postcss ^8.5.10` → resolved 8.5.19 везде (next+tailwind deduped). `next build` EXIT 0 (запуск напрямую через bash — npm-скрипт использует POSIX env-префикс, на Windows/cmd падает; на Hostinger/Linux ок).
**V10 (валидация форм):**
- Block1 (крит, жалоба #1): `admin/actions.ts::login` — 5 хардкод-EN ошибок → `t()` через `getLocale()+makeUI` (как /login). Ошибки admin-логина теперь hy/ru/en по cookie. Новые ключи: login.errTooManyAttempts, login.errDeactivated, login.errFillBoth; reuse login.errInvalid. (chrome формы оставлен EN — staff-панель.)
- Block2: users/actions.ts+user-form.tsx (required email/name/password, локализ.), portfolio/actions.ts validateMetrics(t) + portfolio-form required, partners/actions.ts validate(t) + partner-form required. Новые ключи: formErr.company/metricsNotObject/metricsNotJson.
- Block3: project-form.tsx required на titleHy/Ru/En.
- i18n.ts: +6 ключей (я, чтобы не конфликтовать с агентами). Гомоглифов нет.
Файлы НЕ на проде. Деплой не требует db push (схема не менялась в V10/V11).

## ОСТАЛОСЬ: V9 (уведомления A→Z, task#25 — большой, нужен Notification-модель+schema push), V7 (валюта, task#23 — ждёт решения юзера).

---
## 🐛 FIX (2026-07-17) — desktop-баг кнопки карточки каталога
project-card.tsx футер: `sm:flex-row sm:w-auto` → длинный CTA («Войдите, чтобы оставить заявку»/hy 34 симв.) шире узкой grid-карточки (footer 228px, кнопка 306px) → вылезал за карточку, обрезался `overflow-hidden`. Затем при w-full клипился `whitespace-nowrap`+`h-9`.
Фикс: кнопки full-width в столбик на всех ширинах (убрал sm:flex-row/sm:w-auto) + primary разрешён перенос (`h-auto min-h-9 whitespace-normal py-1.5 leading-tight`). Проверено Playwright на hy (худший случай): clipped=false, overflow=false, 2 строки, выровнены по 3 карточкам. ru/en короче → ок.
Причина «локально не менялось»: прод-артефакт `next build` осел в `.next`; снёс `.next`+рестарт dev.

## ✅ V9 УВЕДОМЛЕНИЯ — РЕАЛИЗОВАНО ЛОКАЛЬНО (tsc=0)
Notification-модель (userId/type/data-JSON/link/read) + локальный db push (⚠ прод нужен `prisma db push` — новая таблица Notification). data-layer (createNotification/notifyRoles/get/markRead/markAllRead) + server-actions + pure render-helper (локализация по locale зрителя). Триггеры: интерес→владелец+SUPERADMIN, сабмит→SUPERADMIN+MODERATOR, approve/reject→владелец. UI: общий NotificationList + страницы в brand (+sidebar badge, убрал «Скоро»), creator (/account/notifications + карточка), admin (/admin/notifications + nav badge). i18n +14 ключей (hy чистый). НЕ на проде.

## ✅ V7 РЕШЕНО (2026-07-17) — валюта
Решение юзера: переключатель валюты убрать из ШАПКИ (header), оставить в ФУТЕРЕ. Мультивалюта сохранена.
header.tsx: удалены оба `<CurrencySwitcher>` (desktop-кластер + mobile-меню) + импорт. LocaleSwitcher в шапке остался. footer.tsx не тронут (свитчер там). Prop `currency` в Header оставлен (3 вызывателя передают, безвреден). Проверено Playwright: header без валюты, footer с валютой. tsc 0.
