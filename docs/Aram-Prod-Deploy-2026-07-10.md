# Aram → Production Deploy (2026-07-10)

Перенос фильма **«Aram»** (байопик Арама Асатряна) из локальной БД на **прод** `igovazd.am`.

## Итог

Фильм живёт на проде: **project `id=7`**, страница `/reports/7`, виден в каталоге `/catalog`.

## Контекст / зачем понадобилось

- На проде фильма Aram не было. Причина — **две**:
  1. **Деплой сид не гоняет.** Hostinger git auto-deploy = `npm install` (→ postinstall `prisma generate`) + `next build`. Ни `db:seed`, ни `db:push` в деплой-цепочке нет — контент в прод-БД деплоем никогда не заливается.
  2. **Aram не в сиде.** `prisma/seed-data.ts` = 6 фильмов (Фул Хаус, Святой 3, Валдакар, Мхитарян, КомедЯан, Закрытая улица). Aram там нет — только имя `Aram Petrosyan` в crew Фул Хауса.
- Aram был добавлен **только в локальную БД** (руками через локальную админку), локально `id=38`.

## Почему нельзя было просто «скопировать запись»

- Прод-БД `u998961932_advertising` слушает `127.0.0.1:3306` на сервере Hostinger — **с рабочей машины напрямую недостижима** (нет remote-подключения; SSH к файлам не настроен).
- Aram задевает 4 сущности: `Project` + `Actor[]` (crew) + `SponsorshipTier[]` + картинки (постер + 3 фото crew). Файлы картинок лежат на **локальном** диске (`public/uploads/…`), на проде их нет.
- Прямой SQL-перенос потребовал бы ещё и заливки файлов на прод-сервер отдельным каналом.

## Способ переноса — прод-админка (Playwright)

Выбран как самый надёжный: приложение само грузит картинки в прод-`uploads` (server-action `uploadImage`) и пишет в прод-БД. Не нужен ни прямой доступ к БД, ни SSH.

Прод-админка: `/admin/login`, `admin@admin.com` / `admin1234` (юзер в прод-БД).

**Двухфазно** (тиры/crew добавляются только на edit-странице, не в форме create):
1. `/admin/projects/new` — общие поля + загрузка постера → **Create** → `id=7`.
2. `/admin/projects/7/edit`:
   - **Sponsorship tiers** ×3 → Save tiers
   - **Cast & crew** ×3 (kind=CREW) + загрузка 3 фото → Save actors

## Залитые данные (id=7)

| Поле | Значение |
|---|---|
| Title / HY / RU / EN | Aram / ԱՐԱՄ / Арам / Aram |
| Code | #PP-2026-1990 |
| Genre / Subgenre | Biographical Drama / Musical |
| Tagline | Փառքն իր գինն ունի։ |
| Format | Movie · 1h 40m · Color |
| Studio | Kinodaran Original |
| Status / Release | Filming / Q4 2026 (releaseDate 2026-10-01) |
| Countries | Armenia |
| Platforms | Kinodaran, TV, Cinema, Festivals |
| Budget | 231 000 000 AMD |
| Price | 1 000 000 – 5 000 000 AMD |
| Proj. views | 1M–2M |
| Slots | 5 total / 0 taken |
| References | Bohemian Rhapsody, Ray, Michael |
| Cinemas | Cinema Star, Moscow Cinema, Kino Park |
| Синопсис | hy/ru/en (3 языка) |

**Crew (kind=CREW, с фото):**
- Ռաֆայել Թադևոսյան — Գլխավոր պրոդյուսեր
- Արտաշ Ասատրյան — Պրոդյուսեր
- Արամ Շահբազյան — Ռեժիսոր

**Sponsorship tiers:**
- Պաշտոնական հովանավոր — 20 000 000 ֏ (4 benefits)
- Official Sponsor — 30 000 000 ֏ (5 benefits)
- Գլխավոր հովանավոր — 40 000 000 ֏ (6 benefits)

## Заметки / подводные камни

- **Картинки получили новые имена файлов на проде** (постер + 3 фото). Это норм — файлы теперь физически на прод-сервере в `public/uploads/`, локальные имена не переносятся.
- **Опечатки в армянском** в первом заходе (unicode-escape вручную): `Փ` вместо `Պ` в «Պաշտոնական», пропал `դ` в «գովազդակիրներ». Поймано readback-проверкой **до** сохранения, перезалито дословными глифами из дампа БД. Вывод: армянский/русский заливать **литеральными глифами**, не `\u`-эскейпами.
- Форма create тиры/crew не показывает — только edit-страница.
- Проверено вживую: `/reports/7` (тайтл, постер, синопсис, 3 crew с фото, 3 тира с benefits) + карточка в `/catalog`.

## Связано

- Данные-источник: пресс-кит Aram (memory `reference-aram-film-data`).
- Гап-анализ модели: `docs/Aram-Fields-Design-2026-07-09.md`, memory `project-admin-gaps-aram`.
- Индексация прода: OFF (`docs/DEPLOY-indexing-disabled.md`).
