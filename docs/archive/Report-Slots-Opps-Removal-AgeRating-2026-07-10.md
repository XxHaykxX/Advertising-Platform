# Report/Catalog rework — remove slots+opportunities, add age rating, merge partners (2026-07-10)

Session batch. Все правки — код + `schema.prisma`. **Локальная и прод БД ещё НЕ мигрированы** (см. «Миграции» ниже).

## Что сделано

### 1. Возрастной рейтинг (новое поле)
- `schema.prisma` → `Project.ageRating String @default("")` (бейдж «16+», «18+»…).
- Бейдж на постере отчёта **вверху справа** (`report-hero.tsx`), показывается только если поле непустое.
- Админка: поле «Age rating (poster badge)» в форме проекта (секция Audience & value).
- Проброшено через DTO (`types.ts`, `data/projects.ts`), форму (`actions.ts`, `project-form.tsx`, edit page).
- **Aram (id=7): выставить `16+`** — на проде руками через админку (после миграции) или SQL.

### 2. Удалены slots + opportunities (везде)
- `schema.prisma`: убраны `Project.slotsTotal`, `Project.slotsTaken`, relation `opportunities`, модель `PlacementOpportunity`.
- Карточка каталога + `ProjectRow` в `catalog-view.tsx`: строки «N opportunities», бар «slots available».
- Отчёт: `key-facts.tsx` — блок «Placement slots»; `roi-snapshot.tsx` — плитки Exposure value + Placements (осталось **2 плитки**: Projected viewers + CPM, баннер Express Interest на месте).
- Фильтр каталога «Product Category» (питался от opportunities) удалён.
- Админка: колонка «Opportunities» в списке; `OpportunitiesEditor` + `saveOpportunities` удалены; поля Slots в форме.
- Удалены файлы: `opportunities-editor.tsx`, `report/opportunity-item.tsx` (был мёртвый).
- `types.ts`, `data/projects.ts`, `i18n.ts` (мёртвые ключи), `seed-data.ts`, `seed.ts` — вычищены.

### 3. Секция Investment удалена целиком
- Убрана с отчёта (`reports/[id]/page.tsx`), файл `report/investment.tsx` удалён.
- **Внимание:** вместе с ней с публичного отчёта ушли спонсорские **тиры** (пакеты Aram), бюджет-блок, сравнение цен, нижний Express Interest CTA. (Тиры остаются в БД и в админке — просто не рендерятся на отчёте.)
- `investment.*` i18n-ключи оставлены (безвредны).

### 4. Синопсис-дропдаун на отчёте
- `report-hero.tsx`: синопсис свёрнут (line-clamp-3) + кнопка «Читать полностью ▾» со стрелкой (поворот на 180°).
- Новый client-компонент `report/synopsis-disclosure.tsx`; ключи `report.showMore` / `report.showLess`.

### 5. Партнёры → страница /portfolio
- Секция партнёров (marquee + grid) добавлена в `PortfolioView` (перед CTA), данные через `getPartners()` в `portfolio/page.tsx`.
- Роут `/partners` удалён; ссылки в `header.tsx` (nav) и `footer.tsx` убраны.
- `nav.partners` / `footer.partners` i18n и `PartnersCta` — остались как мёртвый код (безвредно).

## Проверка
- `npx tsc --noEmit` → источник чист. Единственные 2 ошибки — в `.next/types/validator.ts` (stale-ссылка на удалённый `/partners`), уходят при `next build`.
- `next build` **не запускался**: локальная БД ещё без колонки `ageRating`, статик-рендер каталога упал бы. Запустить после локальной миграции.

## Миграции (ОБЯЗАТЕЛЬНО перед деплоем)

Деплой Hostinger = `npm install` + `next build`, **миграции не гоняет**. Код теперь читает `Project.ageRating`. Если колонки на проде нет — **отчёт и каталог упадут (500)** после пуша.

### Прод (через phpMyAdmin / hPanel, БД `u998961932_advertising`)
Критично (добавить колонку) — сделать **до/вместе** с деплоем:
```sql
ALTER TABLE `Project` ADD COLUMN `ageRating` VARCHAR(191) NOT NULL DEFAULT '';
UPDATE `Project` SET `ageRating` = '16+' WHERE `id` = 7;  -- Aram
```
Опциональная чистка (безопасно отложить — лишние колонки/таблица Prisma не трогает):
```sql
ALTER TABLE `Project` DROP COLUMN `slotsTotal`;
ALTER TABLE `Project` DROP COLUMN `slotsTaken`;
DROP TABLE `PlacementOpportunity`;
```

### Локально (перед `next build` / dev)
```
npx prisma db push        # синхронит схему: +ageRating, -slots, -PlacementOpportunity
# при желании: npx prisma db seed
```
(`prisma generate` уже выполнен — клиент актуален.)

## Осталось / на подтверждение
- Применить прод-SQL (могу через Hostinger phpMyAdmin-линк).
- Aram id=7 → `ageRating=16+`.
- Коммит.
