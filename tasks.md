# tasks.md — Админка продукта: рефактор формы под CSV-схему

## ⭐ СТАТУС 2026-07-25 (source of truth)

**Сделано локально + проверено (tsc 0, vitest 62/62):**
- Фаза 1: вёрстка 2 колонки восстановлена, Format Single/Series, Format Category убран, Language мультиселект, Country+AgeRating→General, превью 16:9 крупнее, цена/аудитория убраны — #1–11, #26.
- Фаза 2: Duration Single, Budget=boxOffice, tier Available/Total/Exclusive, «X из Y» слоты (карточка+деталь), Streaming Source ГЛОБАЛЬНЫЙ СЛОВАРЬ (add persist / delete «×»), Expected Release Date, Reference Projects repeatable, видео первым слайдом галереи, кнопка «Add Placement» — #12–16, #23, #24, #25.
- Фаза 3: Actor→Person рефактор (21 Person сид+линк, roles мультивыбор 18, person-picker кросс-язычный translit, /admin/cast поиск+CRUD) — #17–21. Round-trip проверен вживую.
- Баг-фикс: budget/cpm обнулялись при сохранении — починено.

**Architect-ревью Ф3 (castreview) — ПОЛУЧЕНО + ПОЧИНЕНО (tsc 0):**
- MAJOR#1 data-loss: parseActorRows резал roles по ROLE_VALUES → старые не-англ. роли (Ռեժиսор и т.п.) стирались при edit-save. ФИКС: убран жёсткий фильтр, храним все непустые строки. ВЕРИФИЦИРОВАНО вживую (#38 роли сохраняются). (admin+account actions.ts)
- MAJOR#2 надёжность: interactive $transaction без timeout (деф. 5с) + последовательные person.create → большой каст мог упасть. ФИКС: `{timeout:15000}` на все 3 tx (create/update/duplicate + creator).
- MAJOR#3 дубли справочника: personId==null всегда создавал нового Person. ФИКС: findFirst по имени перед create (admin+account).
- MINOR#4: миграционный seed-join по коллации — косметика, оставлено.
- ⚠️ Побочно: мой тест-save РАНЬШЕ стёр роли #38 — восстановлены вручную (restore38.sql). 
- Следствие фикса#1: server больше не форсит строгий 18-список (UI — гейт). Старые проекты держат легаси-роли пока вручную не перевыберут. Возможна будущая задача: маппинг арм/рус ролей→англ enum.

**НЕЗАКРЫТО:**
- ⏳ #22 mp4 upload — код готов (bodySizeLimit 52mb + mime + fallback), ЖДЁТ живой тест юзера >8MB.
- ⛔ ДЕПЛОЙ на HOLD (юзер: «не делай пока не скажу»). Прод-SQL готов: `docs/prod-migrations/2026-07-25-{phase2-fields, streaming-source-dict, phase3-cast-person}.sql` — применить прод-БД ДО push.
- 🗺 #27 ROADMAP (ПЛАНИРОВАНИЕ, не строить пока не скажет): красивый визуальный roadmap (таймлайн как слайд Kinodaran — тёмный/фиолетовый/glow) — какие данные/фичи админки в какой точке; + вывод какие пункты админки станут не нужны. Скиллы UI/UX Pro Max + Artifact. Юзер сначала компакт+обновление доков.

---

Источник истины по структуре: `iGovazd_Admin_Product_Schema - Product Detail Page.csv` (владелец: «колонки/секции как в документе»).
Форма: `src/app/admin/(panel)/projects/project-form.tsx` (+ `form-shared.ts`, `actors-editor.tsx`, `tiers-editor.tsx`, `image-uploader.tsx`, `media-field.tsx`).
Cast-данные: `src/lib/data/actors.ts`, `src/lib/data/persons.ts`; страница `/admin/cast` = `src/app/admin/(panel)/cast/`.

Правило деплоя: **миграцию прод-БД делать ДО push** (Hostinger git-autodeploy не гоняет `db:push`). SQL складывать в `docs/prod-migrations/`.

---

## Целевая структура (из CSV) и маппинг на текущий код

| # | Секция CSV | Поля CSV | Текущее состояние / что делать |
|---|---|---|---|
| 1 | **About** (hy/ru/en) | Title*, Synopsis*, Longline/Short info* | ✓ есть (title/synopsis/tagline per-locale). Оставить. |
| 2 | **General Info** | Format* (Single/Series), Single→Duration*, Series→Episode Count*/Duration*, Genre*, Studio*, Budget, Original Country, Age Rating | Format = переименовать Kind (T2). Duration Single = новое поле (T8). Episodes/EpisodeMin ✓. Genre ✓. Studio ✓. Budget = новое опц. (T9). Country = перенести сюда (T4). Age Rating = перенести сюда из Audience. |
| 3 | **Design** (было Press-kit) | Poster 16:9, Preview Video/Trailer 16:9, Detail Images 16:9 | Переименовать секцию (T1). Poster/gallery/video ✓. Разместить ПОСЛЕ General (сейчас до). |
| 4 | **Cast & Crew** | Director, Main Actors (name + опц. фото) | Рефактор на Person + мульти-роли (T10–T13). |
| 5 | **Placement(s)** (повторяемый) | Name*, Description*, Price, Is Exclusive (toggle), Available Slots | Маппится на `SponsorshipTier` (name, priceAmd, benefits). Добавить `isExclusive`, `availableSlots`. Переименовать «Tiers» → «Placement(s)». |
| 7 | **Production Info** | Release Date*, Production Stage, Streaming Source, Expected Release Date* | releaseDate ✓, status(Stage) ✓. Добавить `streamingSource`, `expectedReleaseDate`. |
| 8 | **Reference Projects** (повторяемый) | Past Projects/Placements (name + link/image) | Сейчас `references` = одно текстовое поле. Переделать в повторяемый список (name + ссылка/фото). |

### Поля в текущей форме, которых НЕТ в CSV — РЕШЕНО
**Оставить** (свернуть в ближайшую секцию, проверить потребителей перед перемещением):
- `applicationDeadline` → Production Info (к датам).
- `platforms`, `cinemas` → Production Info (рядом со Streaming Source).
- `placementType` (In-Frame/Story/Mention) → General или блок «Дополнительно» (решить в плане).

**Убрать из админки:**
- `priceMinAmd`, `priceMaxAmd`, `priceNote` (цена теперь на уровне каждого Placement).
- `audienceGender`, `audienceAge` (секция «Audience & Value» распадается).
- `budgetMinAmd`, `budgetMaxAmd`.
- `formatCategory` (дропдаун) — T3.

⚠️ Перед удалением каждого поля — grep потребителей (каталог/отчёт/фильтры/заявки), чтобы не сломать публичную часть. Если поле где-то читается — заменить на дефолт/скрыть, а не рушить.

---

## Решения (утверждено владельцем)

- **Format:** Kind (Film/Serial) → подпись «Format», варианты **Single / Series**. Дропдаун **Format Category** — удалить из формы.
- **Duration Single:** новое поле `durationMinutes Int?` (миграция). Single → Duration; Series → Episodes + Episode Duration.
- **Budget:** = кассовый сбор, только инфо, опц. Новое `boxOfficeAmd Int?`. `budgetMin/Max` убрать из админки.
- **Language:** Select → MultiSelect, хранить CSV в колонке `language`.
- **Cast роль:** строгий searchable-дропдаун из 18 ролей, без своего варианта.
- **Один человек — несколько ролей:** ✅ **полный рефактор через справочник Person.** Человек = запись в `Person` (имя+фото). В проекте выбираешь его из справочника и задаёшь **роли** (мультивыбор) на этот проект. `/admin/cast` становится реальным источником, **наполняется из существующих `Actor`**. Автокомплит формы читает из Person.

---

## 18 ролей Cast & Crew
Actor, Director, Writer, Producer, Music, Show Host, Showrunner, General Producer, Executive Producer, Voice Actor, Singer, Performer, Stand-up Comedian, Animator, Line Producer, Creative Producer, Host, Guest.

---

## Почему сейчас путаница (диагноз, для контекста)
Две несвязанные таблицы: **`Person`** (глобальный справочник, страница `/admin/cast`, сейчас пустой — никто не добавлял) и **`Actor`** (строки каста по проектам). Автокомплит имени в форме тянет из `Actor` всех проектов, поэтому «custom crew уже есть», хотя `/admin/cast` пуст. Рефактор объединяет их в Person как единый источник.

---

## Сырой список владельца (verbatim)
изменить слово на format · при Film должна быть duration · episode duration поднять после Film/Serial · format удалить · Film/Serial → single/series · language multiselect · budget/price добавить optional · countries → general · Press-kit → Design · mp4 upload не работает · картинки 16:9 крупнее · cast&crew выбор из ролей (список выше) · роль с поиском, поиск не работает кросс-язычно (арм. имя не по латинице) · budget = кассовый сбор, только инфо, budgetMin/Max убрать · **один человек может быть и актёром и продюсером** · `/admin/cast` пуст, а в форме люди «есть» — почему.

---

## Задачи по фазам

### Фаза 1 — структура/подписи/UI (минимум миграций)
- [ ] **T1.** Секция «Press-kit» → **«Design»**, разместить ПОСЛЕ General (порядок секций как в CSV).
- [ ] **T2.** Kind → подпись «Format», варианты **Single / Series** (i18n hy/ru/en; enum БД `FILM|SERIAL` внутренне).
- [ ] **T3.** Удалить дропдаун **Format Category** из формы.
- [ ] **T4.** **Country** → в General.
- [ ] **T5.** **Age Rating** → в General (из Audience&Value).
- [ ] **T6.** Блок длительности (Duration/Episodes) — сразу после Format.
- [ ] **T7.** **Language** → MultiSelect (CSV в `language`); проверить каталог-фильтр.
- [ ] **T8.** Превью картинок 16:9 в админке — немного крупнее.
- [ ] **T9.** Общий порядок секций формы = About → General → Design → Cast&Crew → Placement(s) → Production Info → Reference Projects.
- [ ] **T9b.** Убрать из формы: `priceMinAmd/priceMaxAmd/priceNote`, `audienceGender/audienceAge`, `budgetMinAmd/budgetMaxAmd`. Секцию «Audience & Value» распустить. Перед удалением — grep потребителей.
- [ ] **T9c.** Оставленные вне-CSV поля разместить: `applicationDeadline`+`platforms`+`cinemas` → Production Info; `placementType` → General/«Дополнительно».

### Фаза 2 — миграция БД + новые поля
- [ ] **T10.** Миграция (одна): `+ durationMinutes Int?`, `+ boxOfficeAmd Int?`, tier `+ isExclusive Boolean`, `+ availableSlots Int?`, project `+ streamingSource`, `+ expectedReleaseDate DateTime?`, Reference Projects (структура).
- [ ] **T11.** Duration Single (durationMinutes) + Budget (boxOfficeAmd) в General; убрать budgetMin/Max из админки.
- [ ] **T12.** «Tiers» → «Placement(s)»: + Is Exclusive (toggle), + Available Slots.
- [ ] **T13.** Production Info: + Streaming Source, + Expected Release Date.
- [ ] **T14.** Reference Projects: `references` текст → повторяемый список (name + ссылка/фото).
- [ ] **T14b.** Available slots «X из Y» (= Σavailable из Σtotal). Схема: tier +totalSlots +availableSlots. Показ в ДВУХ местах: (1) карточка каталога `project-card.tsx` — сумма по проекту; (2) детальная/отчёт страница — у КАЖДОГО Placement «X из Y» + Exclusive-бейдж. Данные через getProjects (`projects.ts`). Делать после phase2.

### Фаза 3 — Cast & Crew рефактор (Person)
- [ ] **T15.** Мигрировать: связать `Actor.personId → Person`; сид `Person` из уникальных `Actor` (имя/фото).
- [ ] **T16.** Роли: `role String` → **мультивыбор** ролей на проект (строгий список 18, searchable, без своего варианта). Хранение roles (CSV/JSON или таблица связей — решить в плане).
- [ ] **T17.** Форма проекта: выбор человека из справочника Person (автокомплит из Person, не из Actor).
- [ ] **T18.** `/admin/cast` — рабочий справочник (наполнен, редактируется).
- [ ] **T19.** Фикс кросс-язычного поиска имени: `Ռաֆայել Թադևոսյան` находить по латинскому `raf` (транслит/нормализация).

### Фаза 4 — баг
- [ ] **T20.** **mp4 upload не работает** — расследовать (`media-field.tsx`, `videos`-роут, `UPLOADS_DIR`) + починить.

---

## Дефолты (беру сам, вето если не так)
- Роли значениями на английском; локализация ролей на публичной странице — позже.
- Language MultiSelect = CSV в `language`.
