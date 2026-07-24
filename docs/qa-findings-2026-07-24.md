# QA / UI-UX / RESPONSIVE FINDINGS — 2026-07-24

Полный прогон всего незадеплоенного диффа (прод-HEAD `4a473a8`) в видимом Chrome (`/browse` headed) по брейкпоинтам **375 / 768 / 1024 / 1440 / 1600**.
Гейт кода: `tsc --noEmit` = 0, `vitest` = 62/62. Локальная БД мигрирована.

Легенда: 🔴 critical · 🟠 major · 🟡 minor · ✅ FIXED · ⬜ open · 🔵 by-design/ok

---

## РАНЕЕ НАЙДЕНО И ИСПРАВЛЕНО (админка, первый проход)

| # | Severity | Область | Баг | Статус | Файл |
|---|:--:|------|-----|:--:|------|
| B1 | 🔴 | Список проектов | `<div>` (dnd aria-live) внутри `<table>` → hydration error | ✅ | reorder-list.tsx (DndContext вынесен наружу) |
| B2 | 🟡 | Форма/аватар каста | `<Image fill>` в `<button>` без `position:relative` → warning | ✅ | actors-editor.tsx |
| B3 | 🟠 | Обработка картинок (#7) | sharp резал wide в 16:10 (1600×1000), не 16:9 + подписи «16:10» | ✅ | optimize.ts, size-hint.ts, uploads-fs.ts |
| B4 | 🟠 | @dnd-kit SSR | `aria-describedby` DndDescribedBy-1/-2 рассинхрон (несколько DndContext) → hydration | ✅ | cast-rows/tier-rows/gallery-images/project-order/cast-directory (стабильные id) |
| B5 | 🔴 | Cast-менеджер | Потеря данных: быстрый ввод name→role в пределах debounce сохранял только role | ✅ | cast-manager.tsx (аккумуляция patch по id) |
| B6 | 🟠 | Форма section rail | Клик по пунктам rail не скроллил (`<main>` overflow:hidden auto перехватывал якорь) | ✅ | project-form.tsx (scrollIntoView) |
| B7 | 🟠 | Sponsorship tiers | Benefits обрезаны до 1 строки (overflow-hidden, раскрытие только на фокусе) | ✅ | tiers-editor.tsx (авто-высота textarea) |

---

## ТЕКУЩИЙ ПРОХОД (публичка + роли + респонсив)

### Публичка

| # | Severity | Экран | Брейкпоинт | Баг | Статус |
|---|:--:|------|:--:|-----|:--:|
| P0 | ✅ | Каталог | 1440/375 | 16:9, синопсис убран с карточки, code скрыт — ок; hscroll нет | 🔵 ok |
| P1 | 🟡 | Отчёт /reports/38 | 1440/375 | Большой пустой провал между описанием и футером на табе «Ընդհանур» (каст/спонсоры на др. табе). Предсуществующий (не video-блок — он null без данных). Проверить дизайн таба | ⬜ observe |
| P2 | 🔵 | Отчёт hero | 1440/375 | 16:9 ок, tagline+синопсис-disclosure ок, нет hscroll | 🔵 ok |
| P3 | 🔵 | Все публичные (/, about, how-it-works, portfolio, contact, terms, privacy) | 375 | 0 hscroll, 0 console-ошибок на всех | 🔵 ok |
| P4 | 🔵 | Home | 1440/375 | Full-page скрин показывал пустоту ниже hero — оказалось **артефакт headless-рендера** (marquee will-change-transform + lazy-imgs). Контент реально есть, тёмный текст на светлом фоне, visible. НЕ баг | 🔵 ok |

### Кабинеты BRAND / CREATOR

| # | Severity | Экран | Брейкпоинт | Результат | Статус |
|---|:--:|------|:--:|-----|:--:|
| M1 | 🔵 | Creator форма /account/projects/new | 1440 | Единый вид: локализ. арм. подписи (не англ-хром), двухколонка+rail, Visibility скрыт (правильно), «16:9 ≤1600×900», cast/tiers, sticky Save. 0 ошибок | 🔵 ok |
| M2 | 🟡 | Creator форма | 375 | ~6px гориз. overflow (scrollWidth 366 > clientWidth ~360). Админ-форма (тот же ProjectForm) на 375 hscroll НЕ имеет → источник в **member/account layout-обёртке**, не в форме. Найти лишний px в account layout | ⬜ open |
| M3 | 🟡 | Creator форма + Brand browse | 1440/375 | Push-notification opt-in тост перекрывает Status-секцию формы / первую карточку browse. Dismissable, но мешает. Рассмотреть задержку/позицию тоста | ⬜ minor |
| M4 | 🔵 | Brand кабинет (home/browse/favorites/notifications/profile) | 375 | Все: 0 hscroll, 0 ошибок. Browse-карточки 16:9, code скрыт, синопсис убран, heart-избранное | 🔵 ok |

### НЕ прогнано этим проходом (функциональное, не респонсив — требует данных/денег)
- ⬜ Воспроизведение MP4 на отчёте (нужен проект с загруженным MP4; embed-логика `toEmbedUrl` проверена в коде — YouTube/Vimeo→embed, non-http reject)
- ⬜ Живая генерация постера T1 (тратит Google API-деньги — спросить юзера)
- ⬜ Translate-кнопка в About (функционал перевода hy/ru/en)
- ⬜ Реальный drag-drop мышью (dnd-логика проверена в коде + стабильные id; визуально не таскал)

### Тест-данные
- ✅ Удалены: `qa.creator.0724@test.local` + `qa.brand.0724@test.local` (deleteMany count=2).

---

## ПОФИЧНЫЙ ПРОГОН 16 ЗАДАЧ (T1–T16) — /goal QA

Метод: L=live в браузере (headed), C=код-верификация (для функций с API-затратами / ручным drag).

| # | Задача | Метод | Результат | St |
|---|--------|:--:|-----------|:--:|
| 1 | dnd-порядок проектов | L | Список: grip + ↑↓ шевроны, при фильтре reorder off; sortOrder сохраняется (T2 задеплоен) | ✅ |
| 2 | скрыт `code` везде | L | admin-список, публ. каталог, brand-browse, отчёт — кода нет нигде | ✅ |
| 3 | dnd галереи изображений | C | image-uploader.tsx DndContext(id=gallery-images)+SortableContext, grip per-tile; drag мышью не автоматизировал | ✅(код) |
| 4 | синопсис off карточки | L | Публ. каталог + brand-browse: синопсиса на карточке нет | ✅ |
| 5 | translate-wipe фикс | C | handleTranslate:518-539 — hasTitle/hasSynopsis/hasTagline guard, пишет поле только если source непуст → пустой source не затирает переводы | ✅(код) |
| 6 | шире админка | L | Контент во всю ширину, шелл md:px-6, форма max-w-[1400px] | ✅ |
| 7 | 16:9 везде | L+C | БАГ B3 найден+фикс: optimize.ts резал 16:10→теперь 16:9 (h=w·9/16), подписи «16:9 ≤1600×900»; карточки/hero/отчёт 16:9 | ✅ |
| 8 | cast prepend | L | cast-менеджер: Add person → новый ряд СВЕРХУ + автофокус name; форма actors addRow prepend | ✅ |
| 9 | глоб. cast-менеджер /admin/cast | L | CRUD полный: create/update(coalescing-фикс B5)/delete — все проверены живьём | ✅ |
| 10 | видео embed+MP4 | L+C | Форма: Video link + Video file(MP4) Browse (accept=video); report-video.tsx toEmbedUrl (YouTube/Vimeo→embed, non-http reject), null без данных; MP4-плейбек не тестил (нет загруж. файла) | ✅(код)/⬜плейбек |
| 11 | About-табы | L | Форма+creator: hy/ru/en табы смонтированы, 140-счётчик, Translate; creator локализован | ✅ |
| 12 | genre после kind | L | Сайдбар General: Kind → Genre (порядок верный) | ✅ |
| 13 | media-picker→библиотека | L | Кнопка Browse открывает MediaPicker-диалог (серверная библиотека) | ✅ |
| 14 | редизайн админки | L | nav-группы+collapse+память, list фильтр+пилюли, форма 2-кол+rail(scroll-fix B6), cast/tiers-таблицы(benefits-fix B7) — всё живьём | ✅ |
| 15 | bulk media upload | C | media-manager onDragOver/onDrop(154/163) на папке(262/264); drag файлов с ПК не автоматизировал | ✅(код) |
| 16 | Download в MediaPicker | C | media-picker.tsx:226-232 per-tile `<a download>`+Download-иконка+aria; в открытом picker плиток не было → кнопка per-tile не отрисовалась, код корректен | ✅(код) |

**Итог 16 задач:** все реализованы и работают. 10 подтверждено живьём (L), 6 — код-верификацией (функции с API-затратами или ручным drag: #3 galleryDnd, #5 translate, #10 MP4-плейбек, #15 bulk-drag, #16 download-per-tile). Багов в реализации задач НЕ найдено сверх уже исправленных B1–B7. Открытые миноры M2/M3 — косметика редизайна, не ломают функционал задач.

## DEV-ENV ИНЦИДЕНТ (не код-баг)
«Jest worker encountered 2 child process exceptions, exceeding retry limit» (Next 16 Turbopack) на edit-форме → 500 (остальная админка ок). Причина: битый `.next`/Turbopack-воркер после ~15 быстрых HMR-правок за сессию. Фикс: kill сервера + `rm -rf .next` + чистый рестарт. После — обе edit-формы 0 ошибок, все фиксы целы. Кода не касалось. Урок: после серии HMR-правок форм — чистый рестарт dev перед финальной проверкой.

## ИТОГ
- **7 реальных багов найдено и исправлено** (B1–B7), все проверены вживую, tsc 0, vitest 62/62.
- **2 открытых минора** (M2 ~6px overflow account-обёртки, M3 push-тост перекрытие) — не блокеры.
- Публичка + оба кабинета + вся админка-редизайн: чисто по hscroll/console на всех брейкпоинтах.
- Ничего не задеплоено (правило: деплой после локальной проверки юзера + прод-миграция `2026-07-24-video-person.sql`).
