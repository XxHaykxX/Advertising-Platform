# Aram → сайт: дизайн добавления реальных полей (2026-07-09)

**Статус:** В РАБОТЕ (2026-07-09). Скоуп финализирован владельцем. Реализация
локально, БЕЗ деплоя до явной команды.

**Финальный скоуп (утверждено):**
- SponsorshipTier — ДА (фронт + админка), секция-заголовок «Հовանավорներ / Sponsors».
- cinemas — ДА.
- tagline / subgenre / references / crew(Actor.kind) — ДА.
- SKIP: per-project contact, productionDays, timeline фаз.
**Ограничение:** вся работа локально, БЕЗ деплоя на сервер до явной команды.
**Источник данных:** пресс-кит `Aram Asatryan 2026.press   .pdf` (корень репо) →
извлечено в память `reference-aram-film-data.md`. Гап-анализ:
`project-admin-gaps-aram.md`.

## Текущая модель (что есть)
- `Project` (title/genre/synopsis/poster/gallery/format/studio/переводы/status/
  releaseLabel/countries/audience*/projViews/budget|cpm|price MinMaxAmd/slots/
  deadline/releaseDate/platforms/placementType/priceNote).
- `Actor` (name, role, sortOrder) — каст.
- `PlacementOpportunity` (scene-level: sceneNo/description/mood/rationale/type/
  prominence/category/estValue/durationSec).
- Фронт `/reports/[id]`: секции Hero / KeyFacts / Cast / RoiSnapshot / Investment
  / DeepDive; табы overview/cast/investment/more.

## РЕШЕНИЕ ПО ТИРАМ (утверждено владельцем)
Реальный оффер Kinodaran = **тиры спонсорства** (20M/30M/40M AMD, каждый со
списком бенефитов). Текущая схема этого не выражает.

**Выбрано: новая сущность `SponsorshipTier`** (не переиспользовать
PlacementOpportunity, не текст в priceNote).

```prisma
model SponsorshipTier {
  id        Int     @id @default(autoincrement())
  projectId Int
  name      String  // "Official Sponsor" | "General Sponsor" (+ переводы позже)
  priceAmd  Int     // 20000000 / 30000000 / 40000000
  benefits  String  @db.Text // JSON string[] — список включённого
  sortOrder Int     @default(0)
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  @@index([projectId])
}
```
- **Админка:** суб-редактор как `saveOpportunities`/`saveActors` (строки
  бенефитов через \n, цена AMD, название). Инвалидация `revalidateTag("projects")`.
- **Фронт:** 3 карточки-тира в табе Investment (название, цена в валюте
  посетителя через formatMoney, маркир-список бенефитов).
- **i18n:** имена тиров/бенефиты — на старте на языке ввода; per-locale переводы
  отложить (как сделано с title/synopsis колонками-на-язык).

## ADD — дёшево, высокая ценность (мелкие поля Project)
| Поле | Схема | Где на фронте |
|---|---|---|
| Логлайн/tagline | `tagline String?` | Hero (панчлайн, отдельно от synopsis) |
| Поджанр (Musical) | `subgenre String?` | KeyFacts рядом с genre |
| Междунар. референсы (Bohemian Rhapsody/Ray/Michael) | `references String?` (comma/JSON) | DeepDive «сравнимо с» |
| **Crew** (продюсеры/режиссёр) | `Actor.kind` enum CAST\|CREW (в пресс-ките каста НЕТ, только crew) | Cast-секция → «Команда» + «Каст» |

## ОПЦИОНАЛЬНО — ждёт да/нет владельца
- Кинотеатры показа (Cinema Star/Moscow Cinema/Kino Park) → `cinemas String?`.
- Съёмочные дни (30) → `productionDays Int?`.
- Per-project контакт (Seda Hovhannisyan, +374 94 84 60 26) → `contactName/
  contactPhone/contactEmail` на Project (сейчас только глобальный контакт сайта).
- Timeline фаз (препрод/съёмки/пост/премьера) → JSON или отдельные даты.

## SKIP — не добавлять (обоснование)
- **Метрики платформы** (DAU/MAU/watch-time/гео-сплит) — платформенные,
  одинаковы для всех фильмов → уровень сайта, не per-project.
- **Каналы промо** → уже покрыто `platforms`.
- **Фильмография режиссёра**, **затронутые темы** → текстом в synopsis/DeepDive,
  не structured.
- **Бюджет $600k USD** → маппится в существующие AMD-поля (min=max эквивалент),
  новых полей не надо.

## План внедрения (когда «go»)
1. Prisma: +`SponsorshipTier`, +`Actor.kind`, +Project поля (tagline/subgenre/
   references [+опциональные]). `prisma migrate`/`db push` на локальной БД.
2. Админ-форма проекта: новые инпуты + суб-редактор тиров (авторизация как у
   opportunities/actors).
3. DTO (`src/lib/types.ts`, `src/lib/data/projects.ts`): +новые поля, +tiers,
   +crew-разделение. Кэш уже тегирован `projects`.
4. Фронт-секции report: Hero(tagline), KeyFacts(subgenre), Cast(crew), Investment
   (тиры), DeepDive(references).
5. Завести Aram реальными данными в админку (Playwright или вручную).
6. Локальный билд-проверка. Деплой — ТОЛЬКО по команде владельца.
