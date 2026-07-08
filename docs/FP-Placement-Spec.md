# FP — Placement Marketplace (spec + design system)

Изолированный сайт-маркетплейс product placement внутри этого же репозитория.
Референс: https://filmustageplacement.com — копируем структуру, **своя** палитра.
Старый сайт (AdvPlatform, красный/Netflix) **не трогаем**.

---

## 1. Решения (утверждено 2026-07-08)

| Пункт | Значение |
|---|---|
| Изоляция | **отдельный Next-app в `placement/`** (свой package.json/next.config/tsconfig/root-layout/globals). Порт dev **3001**. Делит root `node_modules` через upward-резолв Node. Старый `src/…` не трогаем — источник кода (копируем). |
| Роуты | корень нового app: `/`, `/catalog`, `/reports/[id]`, `/login`, `/register` (префикс `/fp` **не нужен** — отдельный app) |
| Палитра | светлая (белый + индиго). См. §3 |
| Тема | только светлая (theme-toggle убран) |
| Скоуп | **full-stack с реальными данными сразу** (БД+auth+админка). Плейсхолдеры → **seed-строки в БД**. Отчёты наполняет паблишер **руками** (без AI) |
| Бренд-аккаунты | **позже**; сейчас Express Interest → лид (`Application`) |
| i18n | **UI — ru/en/hy**; данные проекта — **один язык на проект** |
| БД | **своя Prisma + отдельная MySQL-база `placement`** на том же локальном контейнере (порт 3307), расширенная схема |
| Seed | демо-проекты (6-10) + GARM + opportunities как seed-строки |
| Анонимизация | **позже**; сейчас только текст-баннер «anonymized until…» |
| Деплой | решим потом; сейчас локально (app 3001, БД 3307) |
| Порядок | 1) БД+схема+seed → 2) auth+паблишеры → 3) админ-CRUD → 4) лендинг/каталог/отчёт на **реальных** данных |

Правило процесса: **не начинать код без явного «поехали»** от пользователя.

---

## 2. Скоуп страниц

1. **Главная `/`** — лендинг (делаем первой)
2. **Отчёт `/reports/[id]`** — детальный отчёт по проекту (все поля, минус theme-toggle)
3. **Каталог `/catalog`** — сетка проектов + фильтры + grid/list
4. **Логин/Регистрация** `/login`, `/register` (заглушка бренда)
5. **Бэкенд + админка** — своя Prisma/БД, порт auth/паблишеров, CRUD перерисован

### 2a. Модель данных (расширение старой схемы)

- `Project` +поля: `projectedViews`, `cpmRange`, `budgetRange`, `countries[]`, `audienceGender`, `audienceAge`, `status` (Pre-Production/Filming/Post/Released), `opportunitiesCount`, `safetyScore`, `lang` (язык данных проекта).
- Новая `SafetyCategory` (GARM, на проект): `name`, `score`, `aiText`. 11 категорий.
- Новая `PlacementOpportunity`: `sceneNo`, `description`, `mood`, `rationale`, `type` (visual/audio), `prominence` (background/active), `category`, `estValue`, `durationSec`, `safety`.
- Наполнение — паблишер руками в админке. Без AI.
- `Application` (лиды) — Express Interest + контакт-форма.

**Отложено:** бренд-роль/кабинет, реальная анонимизация-гейт, AI-пайплайн, escrow/оплата, PDF-генератор, деплой/домен.

---

## 3. Дизайн-система

### 3.1 Цвета

| Токен | HEX | Назначение |
|---|---|---|
| `--fp-bg` | `#FFFFFF` | основной фон |
| `--fp-section` | `#F4F5FA` | фон секций (чередование) |
| `--fp-primary` (CTA) | `#4F46E5` | индиго — кнопки, ссылки, акцент |
| `--fp-primary-hover` | `#4338CA` | ховер CTA |
| `--fp-success` | `#16A34A` | safety / успех / «SAFE» |
| `--fp-warn` | `#F59E0B` | средний safety-балл |
| `--fp-danger` | `#DC2626` | низкий safety-балл / риск |
| `--fp-text` | `#111827` | основной текст |
| `--fp-text-muted` | `#6B7280` | вторичный текст |
| `--fp-border` | `#E5E7EB` | границы, разделители |
| `--fp-card` | `#FFFFFF` | карточки (на сером фоне) |

Градиент-акцент (hero heading, по желанию): `linear-gradient(120deg,#4F46E5,#6366F1,#818CF8)`.

Safety-шкала цветом: `>=80` зелёный `#16A34A`, `60-79` жёлтый `#F59E0B`, `<60` красный `#DC2626`.

### 3.2 Типографика

- Шрифт: **Inter** (наследуем из root layout, `--font-sans`).
- H1 hero: 48-64px, `font-weight 800`, `line-height 1.05`, `letter-spacing -0.02em`.
- H2 секций: 32-40px, `700`.
- H3: 20-24px, `600`.
- Body: 16px, `line-height 1.6`, цвет `--fp-text`.
- Muted/подписи: 13-14px, `--fp-text-muted`.
- Числа-статы: 36-44px, `800`.

### 3.3 Отступы и сетка

- Контейнер: `max-width 1200px`, паддинг по бокам `24px` (моб. `16px`).
- Вертикальный ритм секций: `py 80-96px` (моб. `56-64px`).
- Сетка карточек: 3 колонки (desktop) → 2 (tablet) → 1 (mobile), `gap 24px`.
- Радиусы: `--fp-r-sm 8px`, `--fp-r 12px`, `--fp-r-lg 16px`, `--fp-r-xl 24px`.

### 3.4 Тени

- Карточка: `0 1px 3px rgba(17,24,39,0.06), 0 1px 2px rgba(17,24,39,0.04)`.
- Ховер-карточки: `0 12px 32px -12px rgba(79,70,229,0.25)` + `translateY(-6px)`.
- CTA-кнопка: `0 8px 24px -8px rgba(79,70,229,0.4)`.

### 3.5 Компоненты

- **Button**: primary (индиго-залив, белый текст), secondary (белый фон, индиго-бордер), ghost.
- **Badge**: safety (зелёный/жёлтый/красный), genre (серый), «Best value» (индиго).
- **Card**: белая, бордер `--fp-border`, радиус `--fp-r-lg`, ховер-лифт.
- **Stat tile**: число + подпись + источник.
- **Accordion**: FAQ + Deep Dive; шеврон-поворот.
- **Gauge**: полукруг safety-скор (0-100).
- **Progress bar**: GARM-категории (цвет по баллу).
- **Meta row**: `A | B | C` через разделитель `|`.

### 3.6 Движение

- Появление секций: fade + `translateY(16px)`, `framer-motion`, `viewport once`.
- Ховеры: `transition 0.25-0.35s ease`.
- `prefers-reduced-motion` → отключать.

---

## 4. Главная `/fp` — секции (порядок референса)

1. **Header** — лого, меню (How It Works / FAQ / About / Contact), Sign In, Browse Projects (CTA). Sticky.
2. **Hero** — H1 «Brand Placement Marketplace», подзаголовок, 2 CTA (Get Started / Browse Projects), строка «Placements from $5K. Platform fee only on closed deals.»
3. **Stats-полоса** — 4 стата с источниками: CPM ~$5 (PQ Media), 85% Higher Recall (Nielsen), 2.5M+ Avg Views (Statista), 74% Brand Recall (IPG).
4. **Featured Productions** — заголовок + «View All →», 3-6 карточек проектов (постер, жанр, формат, safety-бейдж, синопсис, проекция просмотров, возраст, студия, бюджет, «Preview & Register»).
5. **Trust-полоса** — 100,000+ скриптов, 100+ стран, Scene-level safety.
6. **How It Works** — два потока (Brand ← → Filmmaker) сходятся в Matching → Deal.
7. **Get Started** — 2 колонки: For Brands / For Filmmakers.
8. **Why + основатели** — текст «почему» + 2 карточки основателей (фото, роль, био, LinkedIn).
9. **FAQ** — аккордеон (7 вопросов).
10. **Contact** — форма (Name / Email / Message) + прямой email.
11. **Footer** — лого, ссылки, соцсети, копирайт.

---

## 5. Отчёт `/fp/reports/[id]` — поля (следующий заход)

Оставляем **всё**, убираем только theme-toggle.

**Шапка/навигация**
- Back to Catalog · лого · хлебные крошки (Catalog | #code)
- Табы секций: Overview / Safety / Investment / More  ✅
- Share  ✅  · Download PDF  ✅  (заглушка допустима)
- ~~Theme toggle~~ ❌ убрано

**Герой**
- Постер + статус («Pre-Production»)
- 4 плитки: Projected Views · Brand Safety (80/100) · CPM · Budget Range
- Мета-строка: жанр · формат · студия · страны · возраст · релиз-квартал
- Синопсис + 5 сториборд-миниатюр

**Estimated ROI Snapshot**  ✅ (оставили)
- Оценка стоимости экспозиции · проекция зрителей · CPM · число мест (X across N types)
- Methodology-тултипы  ✅ (оставили)
- Explanation (AI-текст) + футнот «Projections powered by…»

**Express Interest** — CTA-баннер (locked)  ✅ (оставили ×4, но собрать аккуратно)

**Brand Safety Assessment**
- Gauge 80/100 «Generally Safe»
- 11 GARM-категорий с баллами (Adult, Arms, Crime, Drugs, Hate, Military, Profanity, Sensitive, Spam, Terrorism, Tobacco)
- Context-анализ (превью)

**Investment & Deliverables**
- Сумма + список «что входит» (6 пунктов)
- How This Compares: This vs Traditional TV CPM, «85% дешевле», таблица каналов (TV/Print/Influencer/This — «Best value»)
- CTA-строка: Download PDF / Share / Express Interest

**Deep Dive (аккордеоны)**
- **All Placement Opportunities (X)** — карточка места: № сцены · описание · настроение (курсив) · обоснование (подсветка) · теги [тип visual/audio · заметность background/active · категория] · $ оценка · длительность · safety-точка. Сверху «Category Exclusive» + Total Est. Exposure. «Showing 4 of X» + Show All.
- **Audience Psychographics**  ✅ (оставили; допустимо «нет данных»)
- **Value Alignment Details** — locked → Express Interest
- **Project Signals** — X мест / N сцен · экранное время (сек) · дата анализа
- **Full Safety Analysis**  ✅ (оставили, хоть и дублирует) — gauge · «Suitable» · сворачиваемый GARM-разбор · Potential Risks (AI по категориям) · Recommendations · Context Analysis · чипы Recommended for / Use caution with

**Demo-баннер** — «Demo data. …sample reports…»

---

## 5b. Каталог `/fp/catalog` — поля

**Шапка** (лёгкая, отличается от главной): лого «Placement» · Sign In · Register (со `?redirect=/catalog`).

**Над сеткой**
- Demo-баннер «Demo data…»
- Полоса-заметка: «Reports are anonymized until mutual interest is confirmed» (щит-иконка)

**Левый сайдбар — Filters**
- **Genre** (чекбоксы): Romance, Drama, Thriller, Comedy, Action, Sci-Fi
- **Target Audience → Gender** (сегмент): All / Male / Female
- **Budget Range**: Min — Max ($ спиннеры)
- **Product Category** (сворачиваемый; на референсе пусто → стаб)
- **Brand Safety**: свитч «Safe only (80+)»
- **Status** (сворачиваемый; пусто → стаб)
- **Clear All** (disabled пока нет фильтров)

**Тулбар над карточками**
- Search «Search by genre, market, keyword…»
- Sort-дропдаун (relevant / …)
- Grid/List toggle ✅ (оставили; List-вид сделать простой строкой)
- «Showing N projects»

**Карточка проекта (grid, 3 кол.)**
- Постер-сториборд
- Бейдж жанра (верх-лево)
- Safety-бейдж (верх-право): **Safe** (зелёный) / **Review** (жёлтый) / **Risk** (красный)
- Название + `#code`
- Формат: `50 ep × 1m 15s` (иконка)
- Страны (иконка гео)
- Аудитория: `Gender, age` (иконка люди)
- `N opportunities` (индиго, иконка)
- Бюджет-диапазон
- `X projected views`
- Кнопка **View Report** (→ `/fp/reports/[id]`)
- Кнопка **Request details**

Плейсхолдеров в `data.ts` расширить до ~10 проектов (сейчас 6) + поля `countries`, `opportunities`.

---

## 5c. Переиспользование из старого проекта (копированием)

Старый проект (`src/…`) — **источник кода**, берём копированием в `placement/`:

**Бэкенд (всё):**
- Prisma-схема + MySQL: `User` (role SUPERADMIN/PUBLISHER, `name`), `Project` (+`ownerId`→owner), `Actor`, `Scene`, `Portfolio` (+`publisherId`), `Partner`, `Application`, `Content`, `Setting`. **Расширить** под новые поля: brand-safety (GARM), placement opportunities, projected views, CPM, budget-range, countries, статус (Pre-Production/Filming/…).
- **Auth:** JWT (jose) + bcrypt, логин, сессии.
- **Паблишер-аккаунты:** роли + `ownerId`-скоупинг. Админ создаёт паблишера (`name`=компания); каждый фильм получает `ownerId`; в админ-списке видно **Owner** (кто создал). Паблишер видит только свои проекты, суперадмин — все. (`src/app/admin/(panel)/projects/page.tsx:14,50,75`)
- **Админка CRUD:** проекты, юзеры, портфолио, лиды — перенести и **перерисовать** под светлый индиго-дизайн.

**Данные/контент (всё):**
- Контакт-форма → `Application` (лиды) + обработка.
- Портфолио-кейсы (`Portfolio`).
- Партнёры-логотипы (`Partner`, марки-лента).
- **Мультиязычность ru/en/hy** (`Content` + locale). ⚠️ Референс EN-only, но делаем 3 языка. Лендинг v1 — English-плейсхолдер, i18n подключим при переносе `Content`.

**Фронт-инфра:** framer-motion, shadcn/ui, lenis smooth-scroll. **Без** three.js/3D.

---

## 6. Файловая структура (изоляция)

```
placement/
  package.json  next.config.ts  tsconfig.json  postcss.config.mjs
  prisma/schema.prisma          # своя схема (копия+расширение), отдельная БД
  src/
    app/
      layout.tsx                # свой root (светлая тема, Inter, lenis)
      globals.css               # индиго/светлая палитра + tailwind
      page.tsx                  # главная
      reports/[id]/page.tsx
      catalog/page.tsx
      login/page.tsx  register/page.tsx
      admin/…                   # (фаза 5) перенос из старого, перерисован
    components/                 # Header, Hero, Stats, Featured, ProjectCard,
                                # HowItWorks, GetStarted, Why, Faq, Contact, Footer, …
    data.ts                     # плейсхолдеры (проекты, статы, FAQ, основатели)
    lib/                        # utils(cn), auth, prisma — копируем из старого по мере надобности
```

Черновики из первой итерации (`src/fp/data.ts`, `src/app/fp/fp.css`) — **перенести** в `placement/src/` и перекрасить в светлую; старые копии удалить.

---

## 7. Открытые вопросы / потом

- Реальные данные вместо плейсхолдеров.
- Реальный генератор Download PDF.
- Функциональные формы (сейчас статичные/мок).
- Деплой (Hostinger) — отдельно.
