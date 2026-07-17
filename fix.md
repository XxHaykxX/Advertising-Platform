# FIX / TODO — пакетный список (фиксим и тестим одним махом)

Живой список. Пользователь диктует пункты — сюда добавляем. Ничего не делаем по отдельности;
собираем всё, потом реализуем + тестируем за один заход, потом деплой.

Статус легенда: `[ ]` не начато · `[~]` в работе · `[x]` готово+протестировано.

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
