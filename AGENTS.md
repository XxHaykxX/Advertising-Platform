<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Repo layout

The FP Placement marketplace app (Next 16, dev port 3001) now lives at the **repo root** — `package.json`, `src/`, `prisma/`, `public/` are top-level. Default language `hy` (ru/en/hy via the locale cookie). It was moved up from the former `placement/` subdirectory on 2026-07-09 so Hostinger's git auto-deploy (which builds from the repo root) finds `package.json`. The legacy films-landing app that used to share the repo root (port 3000, MySQL db `adplatform_site`) was removed on 2026-07-08.

Deploy target: Hostinger shared Node.js (git auto-deploy on push to `main`), prod MySQL `u998961932_advertising` at `127.0.0.1:3306`, domain `igovazd.am`. Env vars (`DATABASE_URL`, `SESSION_SECRET`, `ADMIN_PASSWORD`) are set in the hPanel Node.js app config, not committed (`.env` is gitignored). Indexing stays OFF (noindex + robots disallow).

# Auth & roles (added 2026-07-14)

Four staff roles (sign in at `/admin/login`): `SUPERADMIN` (everything), `PUBLISHER` (content editor), `MODERATOR` (project moderation only), `TRANSLATOR` (UI dictionary editor). Two self-serve member roles (`BRAND`, `CREATOR` — sign in at `/login`). Members self-register at `/register` and are **auto-approved** (`AccountStatus=APPROVED`) and signed in immediately — moderation happens at the *project* level, not the account level (decision #12, 2026-07-15). The admin `/admin/registrations` page + pending-count badge exist for the manual approve/reject/block workflow but self-registrations never enter `PENDING`, so that queue stays empty unless an account is created/blocked another way. Only `APPROVED` members can sign in. On login, `CREATOR` lands in `/account` (submit / my-projects), `BRAND` is redirected to `/account/brand` (browse / interests / profile — the buyer cabinet). `requireUser()` = staff-only (guards `/admin` + `src/proxy.ts`), `requireMember()` = approved member (guards `/account`); both re-check the DB per request. Auth code lives in `src/lib/auth/` (`members.ts`, `require.ts`, `password.ts`, `session.ts`, `google.ts`).

**Naming:** the non-brand side is **Создатели / Creators / CREATOR** — never "режиссёр"/"filmmaker".

**Google/Gmail sign-up** is scaffolded but inert until `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are set in env (Web OAuth client, redirect `…/api/auth/google/callback`). Empty creds hide the button.

Full details: `docs/archive/Session-Progress-2026-07-14.md`.

# i18n editor & TRANSLATOR role (added 2026-07-25)

A third staff role, `TRANSLATOR` (content writer), signs in at `/admin/login` and lands
straight on `/admin/i18n` — the only section it can reach. It edits the UI dictionary
(`src/lib/i18n.ts`) there; "Save & publish" validates the edits and commits the file to
`main` via the GitHub Contents API (`src/lib/github/contents.ts`), which triggers the usual
Hostinger auto-deploy. The Google Sheet that used to hold these translations is now archived
— see `docs/i18n-editor.md`. Requires prod migration `docs/prod-migrations/2026-07-25-i18n-editor.sql`
applied **before** push (per `docs/DEPLOY-PLAYBOOK.md`).

# Реклама: четыре группы, девять каналов (2026-08-18)

Верхний уровень каталога — **четыре группы**, не девять каналов и не один общий
список: наружная (`outdoor`), цифровая (`digital`), вещание (`broadcast`) и
спонсорство с product placement (`sponsorship`). Точка входа — секция `#ad-types`
на главной; те же четыре карточки рендерит `/account/brand/browse` для вошедшего
бренда (ему главная недоступна — с `/` его редиректит в кабинет).

`/ads/<slug>` обслуживает **оба уровня одним динамическим сегментом**: канал
резолвится первым (`findAdChannel`), иначе группа (`findAdGroup`), иначе 404.
Слаги групп и каналов обязаны не пересекаться — это пинует `src/lib/ad-channels.test.ts`,
иначе новая группа молча затенит страницу канала. Страница группы показывает
инвентарь всех своих каналов сразу и добавляет фасет «Канал» как переключатель
(на странице одного канала его нет — был бы один вечно отмеченный чекбокс).

Группы живут в `AD_CHANNEL_GROUPS` + `AD_GROUP_SLUGS` (`src/lib/ad-channels.ts`).
Токен группы `MEDIA` подписан как «Вещание» — токен это ключ словаря, а не текст,
та же конвенция, что у каналов. Группы `CONTENT` больше нет, флаг `alsoSponsorship`
удалён вместе с ней.

`/ads` — **редирект**, а не страница: `?channel=<CODE>` ведёт на страницу этого
канала, без параметра — на `/#ad-types`. `/catalog` редиректит туда же. Общий
список всего инвентаря (2026-08-14 … 2026-08-18) снят: покупатель билборда
пролистывал сквозь фильмы и радио.

Фильтры — не хардкод-блоки в компоненте, а реестр `src/lib/catalog/facets.ts`,
читающий характеристики канала из `src/lib/ad-channel-attrs.ts` (тип конструкции,
дейпарт, длительность ролика и т.д.) и генерирующий по фасету на каждый
select/multiselect/boolean-атрибут; та же таблица кормит и форму владельца места.
`facetsFor()` принимает **список** кодов каналов (один — канал, несколько — группа).
Подробнее и как добавить десятый фильтр — `docs/ad-channel-filters.md`.
Маркетинговые лендинги каналов сняты — канал сразу ведёт в свой инвентарь.

# Главная (2026-08-18)

Продающий лендинг, не витрина проектов: hero с двумя действиями («Зарегистрироваться»
и «Заказать звонок» → якорь `#callback`), четыре карточки видов рекламы, «почему мы»,
логотипы каналов-партнёров (`Partner`), видеоотзывы клиентов (`Testimonial`), семь целей
рекламодателя и финальный CTA с формой заказа звонка (`CallRequest`). Блоки логотипов и
отзывов сами скрываются на пустых таблицах — их наполняет staff через `/admin/partners`
и `/admin/testimonials`.

**Цели рекламодателя** (`src/lib/ad-goals.ts` + `home-goals.tsx`, 19.08) — семь пунктов из
документа Мариам строками над CTA, чей заголовок «Достигайте бизнес-целей» их и накрывает.
Реестр `{code, group}`, слова в словаре под `adGoal.<CODE>` / `adGoal.<CODE>.sub`;
отдельных страниц у целей нет — цель ведёт в свою группу. Формулировки **свои, не с
vibe.co**: ретаргетинг, установки приложения и «измеримые продажи» наш инвентарь не даёт
(нет пикселя, атрибуции в сторе, сквозной воронки), поэтому текст говорит, что реклама
делает **в сторону** цели. Не давать им уехать в обещание измеримости — двумя секциями
выше стоит аргумент «отчётность».

Сняты с главной (компоненты удалены, страницы остались): `Trust`, `HowItWorks`
(→ `/how-it-works`), `Featured`, `GetStarted`, `Faq` (→ `/faq`), `HomeCases`
(кейсы `Portfolio` остались на `/portfolio` со своей админкой).

**Карусель отзывов** (`src/components/home-testimonials.tsx`, по образцу vibe.co):
центральная карточка крупно, соседние обрезаются краями экрана. Превью — **живое
зацикленное видео без звука**, а не постер с бейджем Play: замерший кадр читается как
картинка видео, движущийся — как видео. Постер (`image`) только на время загрузки и как
фолбэк. Play открывает модалку со звуком и контролами. Стрелки прячутся до `sm` (на 375
они легли бы поверх самого видео) — там остаются свайп и точки.

Все текстовые поля отзыва **необязательны и не рисуются пустыми** (19.08): ролика
достаточно, цитата и подпись — то, что staff добавляет, когда есть. Резерв высоты под
текстом держится, только пока текст есть хоть у одного слайда, иначе блок появлялся бы и
исчезал при переключении. Аватар без имени и должности не показывается.

**Пропорции витрины берутся из самого ролика**, а не заданы 16:9: клиенты присылают то, что
снял телефон или агентство (вертикаль, широкий кинокадр), и в жёстком 16:9 от говорящего
оставался горизонтальный срез. Соотношение читается и по `loadedmetadata`, **и через ref** —
браузер начинает грузить из серверной разметки, и закэшированный ролик успевает пройти
`HAVE_METADATA` до того, как React повесит обработчик. Вертикальные ролики витрина считает
по высоте, а не по ширине (иначе карточка выше экрана), и для них шире разлёт соседей.

# Загрузки: у видео нет лимита размера (2026-08-19)

`MAX_BYTES_VIDEO` в `src/lib/uploads-store.ts` теперь `null` — решение владельца: 50 МБ
выбирались под shared hosting, а телефон в 4K проходит их за минуту. Зеркала лимита живут
ещё в трёх местах клиента (`media-field.tsx`, `media-picker.tsx`, `media-manager.tsx`) и в
`next.config.ts` (`serverActions.bodySizeLimit`, `proxyClientMaxBodySize` — «безлимита» они
не принимают, стоит 1024mb). Меняя лимит, править все пять, иначе кто-то из них станет
фактическим потолком. Картинки (8 МБ) и PDF (20 МБ) свои лимиты сохранили.

⚠️ Чего снятие лимита **не** делает: тело запроса целиком буферизуется в памяти до записи
файла, так что потолок теперь — оперативка хостинга, а не наше число, и занять её может
любой залогиненный редактор. Плюс перед приложением стоит собственный лимит Passenger,
который из кода не поднять — на проде реальный предел может оказаться ниже.

# Документация

Карта всех доков проекта (живые/справочные/архив) — `docs/INDEX.md`. Чеклист деплоя на
Hostinger (перед push / после push, известные грабли) — `docs/DEPLOY-PLAYBOOK.md`.
