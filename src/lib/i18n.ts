/* i18n core — SERVER ONLY (see the `server-only` import below). Locale is
   stored in the `locale` cookie and drives server rendering. This UI
   dictionary covers static chrome (nav, hero, forms, footer, catalog
   filters, report labels, legal page shells) — long legal body text and
   DB-sourced content (project titles/synopsis, partner taglines, portfolio
   metric keys) stay English-only for now (TODO: move to the `Content` i18n
   mechanism once that lands).

   Client components must NOT import this module — it ships all ~2400 lines /
   3 locales to whichever bundle pulls it in. Instead import locale helpers
   from `@/lib/i18n-base` and `t`/`localizeValue` from `@/lib/i18n-client`,
   which only carry the slice of keys client code actually needs (see
   clientDict() below and i18n-client-keys.ts, bundle audit 2026-07-31). */
import "server-only";

export {
  LOCALES,
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isLocale,
  intlLocale,
  labelSep,
  type Locale,
} from "@/lib/i18n-base";
import { LOCALES, type Locale } from "@/lib/i18n-base";
import { CLIENT_KEYS, CLIENT_PREFIXES } from "@/lib/i18n-client-keys";

type Dict = Record<Locale, string>;

export const UI: Record<string, Dict> = {
  // ── header nav ──────────────────────────────
  "nav.catalog": { ru: "Каталог", en: "Catalog", hy: "Նախագծեր" },
  "nav.ads": { ru: "Реклама", en: "Advertising", hy: "Գովազդ" },
  "nav.portfolio": { ru: "Портфолио", en: "Portfolio", hy: "Պորտֆոլիո" },
  "nav.about": { ru: "О нас", en: "About", hy: "Մեր մասին" },
  "nav.contact": { ru: "Контакты", en: "Contact", hy: "Կոնտակտներ" },
  "nav.signInUp": { ru: "Войти / Регистрация", en: "Sign In / Up", hy: "Մուտք / Գրանցում" },
  "nav.cabinet": { ru: "Кабинет", en: "Dashboard", hy: "Անձնական էջ" },
  // Shown only when the browser holds a staff AND a member session (IA-47):
  // the public header speaks for the staff account, and this is the way back
  // to the member cabinet that would otherwise be unreachable from here.
  "nav.memberCabinet": { ru: "Кабинет участника", en: "Member cabinet", hy: "Մասնակցի անձնական էջ" },
  "nav.logout": { ru: "Выйти", en: "Log out", hy: "Դուրս գալ" },
  "nav.browseProjects": { ru: "Смотреть проекты", en: "Browse Projects", hy: "Տեսնել նախագծերը" },
  "nav.openMenu": { ru: "Открыть меню", en: "Open menu", hy: "Բացել ընտրացանկը" },
  "nav.closeMenu": { ru: "Закрыть меню", en: "Close menu", hy: "Փակել ընտրացանկը" },
  // Side-switcher panel under the avatar (2026-08-11, dual-side accounts) —
  // both rows are always shown when both sides are on; the other row becomes
  // an invitation (startBuying/startSelling) when only one is. Deliberately
  // under nav., not account.: this is a header element, not a cabinet page.
  "nav.sideCreator": { ru: "Создатель", en: "Creator", hy: "Հեղինակ" },
  "nav.sideBrand": { ru: "Бренд", en: "Brand", hy: "Բրենդ" },
  "nav.sideCreatorSubtitle": { ru: "{n} проектов", en: "{n} projects", hy: "{n} նախագիծ" },
  "nav.sideBrandSubtitle": { ru: "{n} заявок", en: "{n} applications", hy: "{n} հայտ" },
  "nav.startBuying": { ru: "Начать покупать", en: "Start buying", hy: "Սկսել գնել" },
  "nav.startSelling": { ru: "Начать продавать", en: "Start selling", hy: "Սկսել վաճառել" },

  // ── logout confirm popup ────────────────────
  "logout.confirmTitle": { ru: "Выйти из аккаунта?", en: "Log out?", hy: "Դուրս գալ հաշվից" },
  "logout.confirmMessage": {
    ru: "Вы уверены, что хотите выйти?",
    en: "Are you sure you want to log out?",
    hy: "Համոզվա՞ծ եք, որ ցանկանում եք դուրս գալ։",
  },
  "logout.confirmYes": { ru: "Да, выйти", en: "Yes, log out", hy: "Այո, դուրս գալ" },
  "logout.confirmNo": { ru: "Отмена", en: "No", hy: "Ոչ" },

  "about.heroTitle": { ru: "О нас", en: "About us", hy: "ՓՐՈԴԱՔԹ ՓԼԵՅՍՄԵՆԹԻ ՀԱՐԹԱԿ" },
  "about.heroSubtitle": {
    ru: "iGovazd — маркетплейс, который соединяет бренды с создателями фильмов и контента для честного product placement.",
    en: "iGovazd is a marketplace connecting brands with film and content creators for authentic product placement.",
    hy: "iGovazd-ը հայկական առաջին թվային հարթակն է, որը կապում է բրենդներին մեդիա նախագծերի հեղինակների հետ՝ ապահովելով օրգանական և արդյունավետ գովազդային ինտեգրումներ:",
  },
  "about.missionTitle": { ru: "Наша миссия", en: "Our mission", hy: "Մեր առաքելությունը" },
  "about.missionBody": {
    ru: "Мы делаем размещение брендов в кино и контенте простым, прозрачным и доступным. Бренды находят подходящие проекты, а создатели получают финансирование — без посредников и лишних сложностей.",
    en: "We make brand placement in film and content simple, transparent and accessible. Brands find the right projects, creators get funding — without middlemen or friction.",
    hy: "Մենք բրենդների տեղաբաշխումը կինոյում ու բովանդակության մեջ դարձնում ենք պարզ, թափանցիկ և հասանելի։ Բրենդները գտնում են հարմար նախագծեր, հեղինակները՝ ֆինանսավորում՝ առանց միջնորդների ու ավելորդ բարդությունների։",
  },
  "about.forBrandsTitle": { ru: "Для брендов", en: "For brands", hy: "Բրենդների համար" },
  "about.forBrandsBody": {
    ru: "Просматривайте проекты, выбирайте подходящие форматы и связывайтесь с создателями напрямую. Ваш продукт — в руках любимых героев зрителей.",
    en: "Browse projects, pick the right formats and reach creators directly. Your product — in the hands of the characters audiences love.",
    hy: "Դիտեք նախագծերը, ընտրեք հարմար ձևաչափերը և ուղիղ կապվեք հեղինակների հետ։ Ձեր ապրանքը՝ հանդիսատեսի սիրելի հերոսների ձեռքում։",
  },
  "about.forCreatorsTitle": { ru: "Для создателей", en: "For creators", hy: "Հեղինակների համար" },
  "about.forCreatorsBody": {
    ru: "Разместите свой проект, покажите возможности для брендов и получайте финансирование под съёмки — сохраняя творческий контроль.",
    en: "List your project, showcase opportunities for brands and secure funding for production — while keeping creative control.",
    hy: "Տեղադրեք ձեր նախագիծը, ցույց տվեք բրենդների հնարավորությունները և ապահովեք ֆինանսավորում նկարահանումների համար՝ պահպանելով ստեղծագործական վերահսկողությունը։",
  },
  "about.ctaTitle": { ru: "Готовы начать?", en: "Ready to start?", hy: "Պատրա՞ստ եք սկսել" },
  "about.ctaBody": {
    ru: "Изучите активные проекты или зарегистрируйтесь, чтобы разместить свой.",
    en: "Explore active projects or register to list your own.",
    hy: "Լավագույն բրենդներն ու ստեղծագործողներն արդեն հարթակում են: Գրանցվե՛ք մի քանի վայրկյանում։",
  },
  "about.registerCta": { ru: "Зарегистрироваться", en: "Register", hy: "Գրանցվել" },
  "about.heroEyebrow": { ru: "Маркетплейс product placement", en: "Product-placement marketplace", hy: "Մեր մասին" },
  "about.connectTitle": { ru: "Как мы соединяем", en: "How we connect", hy: "Ինչպես ենք կապում" },
  // IA-26: the ru value was the English phrase, so the badge stayed in Latin
  // while everything around it on /about translated. Transliterated to match
  // the Armenian value, which was already written that way.
  "about.placementBadge": { ru: "Продакт-плейсмент", en: "Product placement", hy: "Փրոդակթ փլեյսմենթ" },
  "about.pillarsTitle": { ru: "Почему iGovazd", en: "Why iGovazd", hy: "Ինչու՞ iGovazd" },
  "about.pillar1Title": { ru: "Прозрачность", en: "Transparency", hy: "Թափանցիկություն" },
  "about.pillar1Body": {
    ru: "Честные условия и понятные цены — без скрытых комиссий и посредников.",
    en: "Fair terms and clear pricing — no hidden fees, no middlemen.",
    hy: "Ազնիվ պայմաններ և հասկանալի գներ՝ առանց թաքնված միջնորդավճարների։",
  },
  "about.pillar2Title": { ru: "Приватность", en: "Privacy", hy: "Գաղտնիություն" },
  "about.pillar2Body": {
    ru: "Ваши контактные данные не публикуются в каталоге — их видят только стороны, с которыми начинается сотрудничество.",
    en: "Your contact details aren't published in the catalog — only parties you start working with can see them.",
    hy: "Ձեր կոնտակտային տվյալները չեն հրապարակվում կատալոգում. դրանք տեսնում են միայն այն կողմերը, որոնց հետ սկսվում է համագործակցությունը։",
  },
  "about.pillar3Title": { ru: "Прямой контакт", en: "Direct contact", hy: "Ուղիղ կապ" },
  "about.pillar3Body": {
    ru: "Бренды и создатели общаются напрямую — быстрее сделки, честнее условия.",
    en: "Brands and creators talk directly — faster deals, fairer terms.",
    hy: "Բրենդներն ու հեղինակները շփվում են ուղիղ՝ ավելի արագ գործարքներ, ավելի արդար պայմաններ։",
  },

  // ── hero ────────────────────────────────────
  "hero.eyebrow": {
    ru: "Маркетплейс продакт-плейсмента",
    en: "Product placement marketplace",
    hy: "ԲԱՑԱՀԱՅՏԵ՛Ք ՆՈՐ ՀՆԱՐԱՎՈՐՈՒԹՅՈՒՆՆԵՐ",
  },
  "hero.titleHighlight": {
    ru: "Брендированный плейсмент",
    en: "Brand Placement",
    hy: "Բրենդների և մեդիա արտադրողների համար",
  },
  "hero.subtitle": {
    ru: "Соединяем бренды с кино- и сериальными продакшенами через посценовые отчёты о плейсменте.",
    en: "Connect brands with film & series productions through scene-level placement reports.",
    hy: "Հարթակ, որտեղ բրենդներն ու մեդիա նախագծերի հեղինակները գտնում են իրար՝ թափանցիկ և փոխշահավետ պայմաններով։",
  },
  "hero.scrollDown": { ru: "Прокрутить вниз", en: "Scroll down", hy: "Ոլորել ներքև" },

  // ── buttons / CTAs ──────────────────────────
  "btn.getStarted": { ru: "Начать", en: "Get Started", hy: "Սկսել" },
  "btn.viewReport": { ru: "Подробнее", en: "Learn More", hy: "Տեսնել ավելին" },
  "btn.removeInterest": { ru: "Убрать из интересов", en: "Remove from Interests", hy: "Հանել հետաքրքրություններից" },
  "btn.removeFavorite": { ru: "Убрать", en: "Remove", hy: "Հեռացնել" },
  // IA-48 §5: this key is the "go to the catalog" CTA and is shared by the hero,
  // /about, /how-it-works and the about hero. It briefly carried "Ստեղծել հաշիվ"
  // because the registration card downstairs reused it for a button that means
  // something else; that card now has btn.createAccount, so this one is back to
  // saying what all four of its call sites do.
  "btn.browseProjects": { ru: "Смотреть проекты", en: "Browse Projects", hy: "Տեսնել նախագծերը" },
  /** "Get started" card for brands — creates an account, so it must not borrow
   *  the catalog CTA's wording (IA-48 §1, §5). */
  "btn.createAccount": { ru: "Создать аккаунт", en: "Create account", hy: "Ստեղծել հաշիվ" },
  "btn.viewAll": { ru: "Смотреть все", en: "View All", hy: "Դիտել բոլորը" },
  "btn.listProject": { ru: "Разместить проект", en: "List Your Project", hy: "Գրանցվել" },
  "btn.sending": { ru: "Отправка…", en: "Sending…", hy: "Ուղարկվում է…" },
  "btn.close": { ru: "Закрыть", en: "Close", hy: "Փակել" },
  "btn.becomePartner": { ru: "Стать партнёром", en: "Become a partner", hy: "Դառնալ գործընկեր" },
  "btn.browseCurrentProjects": { ru: "Смотреть текущие проекты", en: "Browse current projects", hy: "Դիտել ընթացիկ նախագծերը" },
  "btn.translate": { ru: "Перевести", en: "Translate", hy: "Թարգմանել" },
  "translate.working": { ru: "Перевод…", en: "Translating…", hy: "Թարգմանվում է…" },
  "translate.error": { ru: "Не удалось перевести", en: "Translation failed", hy: "Չհաջողվեց թարգմանել" },
  "translate.emptyFields": {
    ru: "Сначала заполните название или синопсис.",
    en: "Fill in a title or synopsis first.",
    hy: "Նախ լրացրեք վերնագիրը կամ սինոպսիսը։",
  },
  "translate.notConfigured": {
    ru: "Перевод не настроен.",
    en: "Translation is not configured.",
    hy: "Թարգմանությունը կարգավորված չէ։",
  },
  "translate.busy": {
    ru: "Сервис перевода перегружен, попробуйте позже.",
    en: "Translation service is busy, try again shortly.",
    hy: "Թարգմանության ծառայությունը ծանրաբեռնված է, փորձեք մի փոքր ուշ։",
  },
  "translate.rateLimited": {
    ru: "Слишком много запросов, попробуйте позже.",
    en: "Too many requests, try again shortly.",
    hy: "Չափազանց շատ հարցումներ, փորձեք մի փոքր ուշ։",
  },
  "translate.timeout": {
    ru: "Превышено время ожидания, попробуйте снова.",
    en: "Translation timed out, try again.",
    hy: "Ժամանակը սպառվեց, փորձեք կրկին։",
  },
  "translate.network": {
    ru: "Ошибка сети, попробуйте снова.",
    en: "Network error, try again.",
    hy: "Ցանցի սխալ, փորձեք կրկին։",
  },
  "translate.genericError": {
    ru: "Не удалось перевести, попробуйте позже.",
    en: "Couldn't translate, try again shortly.",
    hy: "Չհաջողվեց թարգմանել, փորձեք մի փոքր ուշ։",
  },

  // ── poster generator (#26) ─────────────────
  "btn.generatePoster": { ru: "Сгенерировать постер", en: "Generate poster", hy: "Ստեղծել պաստառ" },
  "btn.browse": { ru: "Выбрать", en: "Browse", hy: "Ընտրել" },
  "poster.promptLabel": { ru: "Описание постера", en: "Poster prompt", hy: "Պաստառի նկարագրություն" },
  "poster.generating": { ru: "Генерация…", en: "Generating…", hy: "Ստեղծվում է…" },
  "poster.useThis": { ru: "Использовать", en: "Use this", hy: "Օգտագործել" },
  "poster.regenerate": { ru: "Сгенерировать снова", en: "Regenerate", hy: "Ստեղծել կրկին" },
  "poster.withLogo": { ru: "Логотип создателя на постере", en: "Creator logo on poster", hy: "Հեղինակի լոգոն պաստառի վրա" },
  "poster.noAvatarHint": {
    ru: "Сначала загрузите аватар в профиле",
    en: "Upload an avatar in your profile first",
    hy: "Նախ վերբեռնեք ձեր պրոֆիլի ավատարը",
  },
  "poster.customText": { ru: "Текст на постере (необязательно)", en: "Text on poster (optional)", hy: "Տեքստ պաստառի վրա (ոչ պարտադիր)" },
  "poster.customTextPlaceholder": { ru: "Оставьте пустым — без текста", en: "Leave empty for no text", hy: "Թողեք դատարկ՝ առանց տեքստի" },
  "poster.fromImage": { ru: "Из своего изображения", en: "From my image", hy: "Իմ նկարից" },
  "poster.fromLibrary": { ru: "Из библиотеки", en: "From library", hy: "Գրադարանից" },

  // ── footer ──────────────────────────────────
  "footer.tagline": {
    ru: "Находите премиальные возможности для брендированного плейсмента в кино и на ТВ.",
    en: "Discover premium brand placement opportunities in film and TV.",
    hy: "Բացահայտեք բրենդային տեղադրման պրեմիում հնարավորություններ կինոյում և հեռուստատեսությունում։",
  },
  "footer.product": { ru: "Продукт", en: "Product", hy: "Արտադրանք" },
  "footer.company": { ru: "Компания", en: "Company", hy: "Ընկերություն" },
  "footer.legal": { ru: "Правовая информация", en: "Legal", hy: "Իրավական տեղեկություններ" },
  "footer.contacts": { ru: "Контакты", en: "Contacts", hy: "Կապ մեզ հետ" },
  "footer.browseProjects": { ru: "Смотреть проекты", en: "Browse Projects", hy: "Դիտել նախագծերը" },
  "footer.howItWorks": { ru: "Как это работает", en: "How It Works", hy: "Ինչպես է աշխատում" },
  "footer.ads": { ru: "Рекламные каналы", en: "Advertising channels", hy: "Գովազդային ալիքներ" },
  "footer.portfolio": { ru: "Портфолио", en: "Portfolio", hy: "Պորտֆոլիո" },
  "footer.faq": { ru: "Вопросы и ответы", en: "FAQ", hy: "Հաճախ տրվող հարցեր" },
  "footer.about": { ru: "О нас", en: "About", hy: "Մեր մասին" },
  "footer.contact": { ru: "Контакты", en: "Contact", hy: "Կոնտակտներ" },
  "footer.terms": { ru: "Условия использования", en: "Terms", hy: "Պայմաններ" },
  "footer.privacy": { ru: "Политика конфиденциальности", en: "Privacy", hy: "Գաղտնիության քաղաքականություն" },
  "footer.rights": { ru: "Все права защищены.", en: "All rights reserved.", hy: "Բոլոր իրավունքները պաշտպանված են։" },

  // ── catalog / filters ───────────────────────
  "catalog.heroTitle": {
    ru: "Каталог проектов",
    en: "Project Catalog",
    hy: "Ձեր բրենդը՝\nճիշտ գործընկերների կողքին",
  },
  "catalog.heroSubtitle": {
    ru: "Изучайте кино- и ТВ-проекты, открытые для размещения бренда — фильтруйте по жанру, категории продукта и статусу.",
    en: "Browse film and TV productions open for brand placement — filter by genre, product category, and status.",
    hy: "Ընտրե՛ք Ձեր բրենդին համապատասխան նախագիծ, կա՛պ հաստատեք ստուգված արտադրողների հետ և իրականացրե՛ք արդյունավետ ինտեգրումներ։",
  },
  "catalog.filters": { ru: "Фильтры", en: "Filters", hy: "ՖԻԼՏՐՆԵՐ" },
  "catalog.genre": { ru: "Жанр", en: "Genre", hy: "Ժանր" },

  // ── Localized data-value labels (closed sets rendered from DB values) ──
  // Keyed by the raw DB value; localizeValue() falls back to the raw value
  // for anything not listed (e.g. a custom genre an admin types).
  "genre.Comedy Film": { ru: "Комедийный фильм", en: "Comedy Film", hy: "Կատակերգական ֆիլմ" },
  "genre.Comedy Series": { ru: "Комедийный сериал", en: "Comedy Series", hy: "Կատակերգական սերիալ" },
  "genre.Drama Series": { ru: "Драматический сериал", en: "Drama Series", hy: "Դրամատիկ սերիալ" },
  "genre.Family Series": { ru: "Семейный сериал", en: "Family Series", hy: "Ընտանեկան սերիալ" },
  "genre.Documentary": { ru: "Документальный", en: "Documentary", hy: "Վավերագրական" },
  "genre.Thriller": { ru: "Триллер", en: "Thriller", hy: "Թրիլլեր" },
  "genre.Comedy": { ru: "Комедия", en: "Comedy", hy: "Կատակերգություն" },
  "genre.Drama": { ru: "Драма", en: "Drama", hy: "Դրամա" },
  "genre.Melodrama": { ru: "Мелодрама", en: "Melodrama", hy: "Մելոդրամա" },
  "genre.War": { ru: "Военный", en: "War", hy: "Ռազմական" },
  "genre.Adventure": { ru: "Приключения", en: "Adventure", hy: "Արկածային" },
  "genre.Biography": { ru: "Биография", en: "Biography", hy: "Կենսագրական" },
  "genre.Crime": { ru: "Криминал", en: "Crime", hy: "Քրեական" },
  "genre.Kids": { ru: "Детский", en: "Kids", hy: "Մանկական" },
  "genre.Romance": { ru: "Романтика", en: "Romance", hy: "Ռոմանտիկա" },
  "genre.Action": { ru: "Боевик", en: "Action", hy: "Մարտական" },
  "genre.Fantasy": { ru: "Фэнтези", en: "Fantasy", hy: "Ֆենթզի" },
  "genre.History": { ru: "Исторический", en: "History", hy: "Պատմական" },
  "genre.Family": { ru: "Семейный", en: "Family", hy: "Ընտանեկան" },
  "genre.Musical": { ru: "Мюзикл", en: "Musical", hy: "Մյուզիքլ" },
  "genre.Short": { ru: "Короткометражный", en: "Short", hy: "Կարճամետրաժ" },
  "genre.Detective": { ru: "Детектив", en: "Detective", hy: "Դետեկտիվ" },
  "genre.Cartoon": { ru: "Мультфильм", en: "Cartoon", hy: "Մուլտֆիլմ" },
  "genre.Horror": { ru: "Ужасы", en: "Horror", hy: "Սարսափ" },
  "genre.Sitcom": { ru: "Ситком", en: "Sitcom", hy: "Սիթքոմ" },
  "genre.Psychological": { ru: "Психологический", en: "Psychological", hy: "Հոգեբանական" },
  "genre.Animation": { ru: "Анимация", en: "Animation", hy: "Անիմացիա" },
  "genre.Rock-Opera": { ru: "Рок-опера", en: "Rock-Opera", hy: "Ռոք օպերա" },
  "genre.Tragicomedy": { ru: "Трагикомедия", en: "Tragicomedy", hy: "Տրագիկոմեդիա" },
  "genre.Mystery": { ru: "Мистика", en: "Mystery", hy: "Միստիկա" },
  "genre.Sci-Fi": { ru: "Фантастика", en: "Sci-Fi", hy: "Գիտաֆանտաստիկա" },
  "genre.Teen Movies": { ru: "Подростковое кино", en: "Teen Movies", hy: "Պատանեկան" },
  "genre.TV Show": { ru: "Телешоу", en: "TV Show", hy: "Հեռուստաշոու" },
  "genre.Stand-Up": { ru: "Стендап", en: "Stand-Up", hy: "Ստենդափ" },
  "genre.Theater": { ru: "Театр", en: "Theater", hy: "Ներկայացում" },
  "genre.Television play": { ru: "Телеспектакль", en: "Television play", hy: "Հեռուստաներկայացում" },
  "genre.Opera": { ru: "Опера", en: "Opera", hy: "Օպերա" },
  "genre.Football Show": { ru: "Футбольное шоу", en: "Football Show", hy: "Ֆուտբոլային շոու" },
  "genre.Music": { ru: "Музыка", en: "Music", hy: "Երաժշտական" },
  "genre.Sport": { ru: "Спорт", en: "Sport", hy: "Սպորտ" },
  "genre.Psychological Thriller": { ru: "Психологический триллер", en: "Psychological Thriller", hy: "Հոգեբանական թրիլլեր" },
  "genre.Reality Show": { ru: "Реалити-шоу", en: "Reality Show", hy: "Ռեալիթի շոու" },
  "genre.Western": { ru: "Вестерн", en: "Western", hy: "Վեսթերն" },
  "genre.Interview": { ru: "Интервью", en: "Interview", hy: "Հարցազրույց" },
  // Cast & crew ROLES (IA-23) — localized via localizeValue(locale, "role", value).
  // Roles are free text entered per actor, so this is best-effort: standard
  // crew/cast roles map here (keyed by both the Armenian source, as stored, and
  // the English source, for future entries); anything not listed falls back to
  // the text as entered. Names are never translated (proper nouns).
  "role.Ռեժիսոր": { ru: "Режиссёр", en: "Director", hy: "Ռեժիսոր" },
  "role.Պրոդյուսեր": { ru: "Продюсер", en: "Producer", hy: "Պրոդյուսեր" },
  "role.Գլխավոր պրոդյուսեր": { ru: "Главный продюсер", en: "Lead Producer", hy: "Գլխավոր պրոդյուսեր" },
  "role.Գործադիր պրոդյուսեր": { ru: "Исполнительный продюсер", en: "Executive Producer", hy: "Գործադիր պրոդյուսեր" },
  "role.Դերասան": { ru: "Актёр", en: "Actor", hy: "Դերասան" },
  "role.Սցենարիստ": { ru: "Сценарист", en: "Screenwriter", hy: "Սցենարիստ" },
  "role.Օպերատոր": { ru: "Оператор", en: "Cinematographer", hy: "Օպերատոր" },
  "role.Կոմպոզիտոր": { ru: "Композитор", en: "Composer", hy: "Կոմպոզիտոր" },
  "role.Director": { ru: "Режиссёр", en: "Director", hy: "Ռեժիսոր" },
  "role.Producer": { ru: "Продюсер", en: "Producer", hy: "Պրոդյուսեր" },
  "role.Lead Producer": { ru: "Главный продюсер", en: "Lead Producer", hy: "Գլխավոր պրոդյուսեր" },
  "role.Executive Producer": { ru: "Исполнительный продюсер", en: "Executive Producer", hy: "Գործադիր պրոդյուսեր" },
  "role.Screenwriter": { ru: "Сценарист", en: "Screenwriter", hy: "Սցենարիստ" },
  "role.Writer": { ru: "Сценарист", en: "Writer", hy: "Սցենարիստ" },
  "role.Actor": { ru: "Актёр", en: "Actor", hy: "Դերասան" },
  "role.Cinematographer": { ru: "Оператор", en: "Cinematographer", hy: "Օպերատոր" },
  "role.Composer": { ru: "Композитор", en: "Composer", hy: "Կոմպոզիտոր" },
  // The rest of ROLE_VALUES (form-shared.ts). Without these the report page
  // printed the raw English value — a project credited "Music" and "Voice
  // Actor" in the middle of an otherwise Russian or Armenian cast list.
  "role.Music": { ru: "Композитор", en: "Music", hy: "Կոմպոզիտոր" },
  "role.Voice Actor": { ru: "Актёр озвучки", en: "Voice Actor", hy: "Դերասան-դուբլյոր" },
  "role.Animator": { ru: "Аниматор", en: "Animator", hy: "Անիմատոր" },
  "role.Show Host": { ru: "Ведущий шоу", en: "Show Host", hy: "Շոուի հաղորդավար" },
  "role.Showrunner": { ru: "Шоураннер", en: "Showrunner", hy: "Շոուռաններ" },
  "role.General Producer": { ru: "Генеральный продюсер", en: "General Producer", hy: "Գլխավոր պրոդյուսեր" },
  "role.Line Producer": { ru: "Линейный продюсер", en: "Line Producer", hy: "Գծային պրոդյուսեր" },
  "role.Creative Producer": { ru: "Креативный продюсер", en: "Creative Producer", hy: "Կրեատիվ պրոդյուսեր" },
  "role.Singer": { ru: "Певец", en: "Singer", hy: "Երգիչ" },
  "role.Performer": { ru: "Артист", en: "Performer", hy: "Կատարող" },
  "role.Stand-up Comedian": { ru: "Стендап-комик", en: "Stand-up Comedian", hy: "Սթենդափ կատակերգու" },
  "role.Host": { ru: "Ведущий", en: "Host", hy: "Հաղորդավար" },
  "role.Guest": { ru: "Гость", en: "Guest", hy: "Հյուր" },
  "formatCategory.FEATURE": { ru: "Полнометражный фильм", en: "Feature film", hy: "Լիամետրաժ ֆիլմ" },
  "formatCategory.SERIES": { ru: "Сериал", en: "Series", hy: "Սերիալ" },
  "formatCategory.MINISERIES": { ru: "Мини-сериал", en: "Mini-series", hy: "Մինի սերիալ" },
  "formatCategory.YOUTUBESHOW": { ru: "YouTube-шоу", en: "YouTube show", hy: "Յութուբյան շոու" },
  "formatCategory.DOCUMENTARY": { ru: "Документальный фильм", en: "Documentary", hy: "Վավերագրական ֆիլմ" },
  "formatCategory.ANIMATION": { ru: "Анимация", en: "Animation", hy: "Անիմացիա" },
  "formatCategory.EVENTS": {
    ru: "Мероприятие / Концерт / Театр",
    en: "Event / Concert / Theatre",
    hy: "Միջոցառում / Համերգ / Թատրոն",
  },
  "formatCategory.SITCOM": { ru: "Ситком", en: "Sitcom", hy: "Սիթքոմ" },
  "formatCategory.PODCAST": { ru: "Подкаст", en: "Podcast", hy: "Փոդքաստ" },
  "formatCategory.REALITY": { ru: "Реалити-шоу", en: "Reality show", hy: "Ռեալիթի շոու" },
  "formatCategory.PROGRAM": { ru: "Передача", en: "Program", hy: "Հաղորդում" },
  "formatCategory.SHORT": { ru: "Короткометражка", en: "Short film", hy: "Կարճամետրաժ ֆիլմ" },
  // Placement subtypes (owner brief 2026-08-10) — the four ways a brand can
  // sit inside a story. Keys match enum PlacementType / PLACEMENT_TYPE_VALUES;
  // the label names the kind, the *Hint line says what the brand actually gets
  // and is shown under the picker in the project form (the names are industry
  // terms a first-time creator has no reason to know).
  "placementType.PRODUCT": { ru: "Продукт в кадре", en: "Product placement", hy: "Ապրանքի տեղաբաշխում" },
  "placementType.LOGO": { ru: "Логотип в титрах", en: "Logo placement", hy: "Լոգոյի տեղաբաշխում" },
  "placementType.VERBAL": { ru: "Упоминание в диалоге", en: "Verbal mention", hy: "Բանավոր հիշատակում" },
  "placementType.NAMING": { ru: "Права на название", en: "Naming rights", hy: "Անվանակոչման իրավունք" },
  // QA-8: "Available on" (project.platforms) mixes brand names (never
  // translate — "Kinodaran", "YouTube") with these three generic category
  // words, which do need a translation. Only these three get a dictionary
  // entry; localize("platformCategory", v) falls back to the raw value for
  // everything else, same contract as genre/formatCategory.
  "platformCategory.TV": { ru: "ТВ", en: "TV", hy: "Հեռուստատեսություն" },
  "platformCategory.Cinema": { ru: "Кинотеатры", en: "Cinema", hy: "Կինոթատրոններ" },
  "platformCategory.Festivals": { ru: "Фестивали", en: "Festivals", hy: "Փառատոներ" },
  "placementTypeHint.PRODUCT": {
    ru: "Товар или бренд виден в кадре — герой им пользуется или носит его.",
    en: "The product or brand is visible on screen — the character uses or wears it.",
    hy: "Ապրանքը/բրենդը տեսողականորեն երևում է կադրում (հերոսը օգտագործում/կրում է)։",
  },
  "placementTypeHint.LOGO": {
    ru: "Логотип показан в титрах или на финальной заставке.",
    en: "The logo appears in the credits or on the end card.",
    hy: "Լոգոն երևում է կրեդիտներում/end-card-ում։",
  },
  "placementTypeHint.VERBAL": {
    ru: "Герой произносит название бренда в диалоге.",
    en: "A character says the brand name in dialogue.",
    hy: "Հերոսը հիշատակում է բրենդի անունը երկխոսության մեջ։",
  },
  "placementTypeHint.NAMING": {
    ru: "Именование всего сериала или сезона — как title sponsorship.",
    en: "Naming of the whole series or season — like a title sponsorship.",
    hy: "Ամբողջ սերիալի/սեզոնի անվանակցում (title sponsorship-ի պես)։",
  },
  "category.Automotive": { ru: "Автомобили", en: "Automotive", hy: "Ավտոմեքենաներ" },
  "category.Beverages": { ru: "Напитки", en: "Beverages", hy: "Ըմպելիքներ" },
  "category.Food & Beverages": { ru: "Еда и напитки", en: "Food & Beverages", hy: "Սնունդ և ըմպելիք" },
  "category.Footwear": { ru: "Обувь", en: "Footwear", hy: "Կոշիկ" },
  "category.Home & Living": { ru: "Дом и быт", en: "Home & Living", hy: "Տուն և կենցաղ" },
  "category.Kids Apparel": { ru: "Детская одежда", en: "Kids Apparel", hy: "Մանկական հագուստ" },
  "category.Media": { ru: "Медиа", en: "Media", hy: "Մեդիա" },
  "category.Sportswear": { ru: "Спортивная одежда", en: "Sportswear", hy: "Սպորտային հագուստ" },
  "category.Technology": { ru: "Технологии", en: "Technology", hy: "Տեխնոլոգիաներ" },
  "category.Travel & Luggage": { ru: "Путешествия и багаж", en: "Travel & Luggage", hy: "Ճամփորդություն և ուղեբեռ" },

  // ── Portfolio case-study metric labels (localizeValue(locale, "metric", key)) ──
  // Keyed by the raw JSON metric key stored in Portfolio.metrics. Unknown keys
  // fall back to formatMetricLabel() in metrics.ts, so future keys still render.
  "metric.views": { ru: "Просмотры", en: "Views", hy: "Դիտումներ" },
  "metric.recall": { ru: "Запоминаемость", en: "Recall", hy: "Հիշվողություն" },
  "metric.ctr": { ru: "CTR", en: "CTR", hy: "CTR" },
  "metric.storeVisits": { ru: "Визиты в магазин", en: "Store Visits", hy: "Այցեր խանութ" },
  "metric.shares": { ru: "Репосты", en: "Shares", hy: "Տարածումներ" },
  "metric.sentiment": { ru: "Тональность", en: "Sentiment", hy: "Տրամադրվածություն" },
  "metric.searchLift": { ru: "Рост поиска", en: "Search Lift", hy: "Որոնման աճ" },
  "metric.recallDurability": { ru: "Устойчивость запоминания", en: "Recall Durability", hy: "Հիշվողության կայունություն" },
  "catalog.budgetRange": { ru: "Диапазон бюджета", en: "Budget Range", hy: "Բյուջեի միջակայք" },
  "catalog.format": { ru: "Формат", en: "Format", hy: "Ձևաչափ" },
  // 5.8: explicit bucket for rows whose formatCategory heuristic found nothing
  // (deriveFormatCategory can legitimately return "") — lets a visitor opt
  // into seeing them instead of the value silently vanishing from every
  // specific-format selection.
  "catalog.formatUnspecified": { ru: "Не указан", en: "Unspecified", hy: "Չնշված" },
  "catalog.platform": { ru: "Платформа", en: "Platform", hy: "Հարթակ" },
  "catalog.placementType": {
    ru: "Тип интеграции",
    en: "Integration kind",
    hy: "Ինտեգրման տեսակ",
  },
  "catalog.clearAll": { ru: "Сбросить всё", en: "Clear All", hy: "Մաքրել բոլորը" },
  "catalog.showResults": { ru: "Показать", en: "Show", hy: "Ցուցադրել" },
  "catalog.searchPlaceholder": {
    ru: "Поиск по жанру, рынку, ключевым словам…",
    en: "Search by genre, market, keyword…",
    hy: "Փնտրել ըստ վերնագրի, ժանրի կամ անվան...",
  },
  // 5.7: the actual sort control wired up in catalog-view.tsx (the three keys
  // above were pre-existing scaffolding that was never connected to a select).
  "catalog.sortLabel": { ru: "Сортировка", en: "Sort", hy: "Դասավորել ըստ" },
  "catalog.sortDefault": { ru: "По умолчанию", en: "Default order", hy: "Կանխադրված" },
  "catalog.sortNewest": { ru: "Сначала новые", en: "Newest first", hy: "Նախ նորերը" },
  "catalog.sortDeadline": { ru: "Дедлайн ближе", en: "Deadline soonest", hy: "Ժամկետը՝ մոտակա" },
  "catalog.sortTitle": { ru: "Название А→Я", en: "Title A→Z", hy: "Անվանում Ա→Ֆ" },
  "catalog.loadMore": { ru: "Показать ещё", en: "Show more", hy: "Ցուցադրել ավելին" },
  "catalog.gridView": { ru: "Вид сеткой", en: "Grid view", hy: "Ցանցի տեսք" },
  "catalog.listView": { ru: "Вид списком", en: "List view", hy: "Ցուցակի տեսք" },
  "catalog.showingProjectsPrefix": { ru: "Показано", en: "Showing", hy: "Ցուցադրված է" },
  // QA-9: three keys instead of one singular/plural switch — ru needs "1
  // проект" / "2 проекта" / "5 проектов", not two forms. See src/lib/plural.ts
  // (pluralForm) for which key a given count picks; en/hy only ever reach
  // .one/.many (CLDR has no "few" for them), .few carries the same text as
  // .many there so the row is never blank if something calls it anyway.
  "catalog.projectCount.one": { ru: "{n} проект", en: "{n} project", hy: "{n} նախագիծ" },
  "catalog.projectCount.few": { ru: "{n} проекта", en: "{n} projects", hy: "{n} նախագիծ" },
  "catalog.projectCount.many": { ru: "{n} проектов", en: "{n} projects", hy: "{n} նախագիծ" },
  // Ad spaces get their own count (2026-08-10, stage B) — the counter line
  // reads "12 projects · 8 ad spaces" instead of one number covering two
  // different kinds of listing.
  "catalog.adSpaceCount.one": { ru: "{n} рекламное место", en: "{n} ad space", hy: "{n} գովազդային տարածք" },
  "catalog.adSpaceCount.few": { ru: "{n} рекламных места", en: "{n} ad spaces", hy: "{n} գովազդային տարածք" },
  "catalog.adSpaceCount.many": { ru: "{n} рекламных мест", en: "{n} ad spaces", hy: "{n} գովազդային տարածք" },
  // The new top facet (2026-08-10) — every channel a project or ad space can
  // belong to, checkboxes over AD_CHANNELS.
  "catalog.channel": { ru: "Канал", en: "Channel", hy: "Ալիք" },
  // The one ad-space-only facet the rail carries (plan B3).
  "catalog.city": { ru: "Город", en: "City", hy: "Քաղաք" },
  "catalog.noResults": {
    ru: "Нет проектов, соответствующих фильтрам.",
    en: "No projects match your filters.",
    hy: "Համապատասխան նախագիծ չի գտնվել։ Փորձեք փոխել ֆիլտրները։",
  },
  "catalog.until": { ru: "До", en: "Until", hy: "Մինչև" },
  // One name for "this deadline never expires" (IA-42), reused everywhere a
  // placement deadline is shown — the catalog card/row, the report page's key
  // facts and deal card, and the brand's favorites compare table. Same
  // "one wording, not three" reasoning as report.offerBarCta.
  "deadline.ongoing": { ru: "Бессрочно", en: "Ongoing", hy: "Ընթացիկ" },

  // ── project card / row ──────────────────────
  /** Inline label on the catalog card, so it carries its own separator — a
   *  colon in ru/en, a but (՝) in hy. Keep the punctuation here: the card used
   *  to add ": " in JSX, which doubled up on the Armenian but. */
  "card.release": { ru: "Выход:", en: "Release:", hy: "Ցուցադրությունը՝" },
  "card.applicationsUntil": { ru: "Заявки до", en: "Applications until", hy: "Հայտեր՝ մինչև" },
  /* IA-50 §4: the same label without the "until", for a project that takes
     applications with no closing date — "Ongoing" printed bare said nothing
     about what was ongoing. Punctuation lives here, as in card.release. */
  "card.applicationsLabel": { ru: "Заявки:", en: "Applications:", hy: "Հայտեր՝" },
  // Owner request 2026-07-28: say on the card how many placement opportunities
  // a project carries, the way the competing marketplaces do.
  // IA-41: the platform chip row (Netflix, cinema, …) had no label — a bare
  // row of pills with nothing saying what they were. Prefixes that row on
  // every card that renders it.
  "card.availableOn": { ru: "Доступен:", en: "Available on:", hy: "Հասանելի՝" },
  // ── Catalog card, 2026-08-05 ──
  // The cheapest offer on the project. A marketplace listing without a price
  // cannot be compared or shortlisted without opening it, which was the single
  // biggest gap on this card.
  // Also rendered by the ad-space card (2026-08-10), not just the project one:
  // keep it a bare preposition. Anything project-specific typed here would
  // show up under a billboard's price too.
  "card.priceFrom": { ru: "от", en: "from", hy: "սկսած" },
  // Under the capacity bar. Says how many are LEFT, not how many are gone —
  // the buyer is deciding whether there is still room for them.
  // Kept short on purpose: it shares a line with the price, and the wordier
  // "осталось {n} из {total}" wrapped onto two lines inside a catalog card.
  "card.slotsLeft": {
    ru: "{n} из {total} свободно",
    en: "{n} of {total} free",
    hy: "{n}/{total} ազատ",
  },
  // The two things a project sells, named on the card (2026-08-05). Before
  // this the card showed a slot counter, a placement counter and one combined
  // "from" price with nothing saying which number belonged to which offer —
  // the slots came from the packages alone while the price was the minimum
  // across both. Each line now carries its own count and its own price.
  "card.offerPlacements": { ru: "Продакт-плейсмент", en: "Product placement", hy: "Փրոդակթ փլեյսմենթ" },
  "card.offerSponsorship": { ru: "Спонсорство", en: "Sponsorship", hy: "Հովանավորություն" },
  "card.offerOptions": { ru: "{n} вариантов", en: "{n} options", hy: "{n} տարբերակ" },
  "card.offerOptionsOne": { ru: "1 вариант", en: "1 option", hy: "1 տարբերակ" },
  // Shown instead when every placement and package on the project is unpriced.
  // Shared with the ad-space card (2026-08-10) — same caveat as card.priceFrom.
  "card.priceOnRequest": { ru: "Цена по запросу", en: "Price on request", hy: "Գինը՝ հարցումով" },
  // Replaces the bare deadline date once the deadline is close: a countdown
  // presses harder than a date the reader has to subtract today from.
  "card.deadlineDaysLeft": { ru: "осталось {n} дн.", en: "{n} days left", hy: "մնաց {n} օր" },
  "card.deadlineLastDay": { ru: "последний день", en: "last day", hy: "վերջին օրը" },
  // The apply button on the card itself. Distinct from btn.viewReport, which
  // is what everyone who cannot apply still sees.
  "card.applyCta": { ru: "Подать заявку", en: "Apply", hy: "Ներկայացնել հայտ" },

  // ── forms (shared) ──────────────────────────
  "form.name": { ru: "Имя", en: "Name", hy: "Անուն" },
  "form.namePlaceholder": { ru: "Ваше имя", en: "Your name", hy: "Ձեր անունը" },
  "form.email": { ru: "Email", en: "Email", hy: "Էլփոստ" },
  "form.company": { ru: "Компания", en: "Company", hy: "Ընկերություն" },
  "form.companyPlaceholder": { ru: "Ваша компания", en: "Your company", hy: "Ձեր ընկերությունը" },
  "form.message": { ru: "Сообщение", en: "Message", hy: "Հաղորդագրություն" },
  "form.send": { ru: "Отправить", en: "Send", hy: "Ուղարկել" },
  // Shown under a mandatory field left empty. Replaces the browser's own
  // `required` bubble, which is rendered in the browser's UI language rather
  // than the site's (2026-08-03).
  "form.required": {
    ru: "Пожалуйста, заполните поле",
    en: "Please fill in this field",
    hy: "Խնդրում ենք լրացնել դաշտը",
  },

  // ── trust section ─────────────────────────────
  "trust.scriptsAnalyzedNumber": { ru: "100 000+", en: "100,000+", hy: "100%" },
  "trust.scriptsAnalyzedTitle": { ru: "сценариев проанализировано", en: "scripts analyzed", hy: "ապահով գործարք" },
  "trust.scriptsAnalyzedCaption": {
    ru: "с полной аналитикой по бренду",
    en: "with comprehensive brand intelligence",
    hy: "Երաշխավորված վճարումներ և իրավական պաշտպանվածություն",
  },
  "trust.countriesNumber": { ru: "100+", en: "100+", hy: "50+" },
  "trust.countriesTitle": { ru: "стран охвачено", en: "countries covered", hy: "վստահելի գործընկերներ" },
  "trust.countriesCaption": {
    ru: "доступно на крупнейших рынках мира",
    en: "available in major markets worldwide",
    hy: "Համագործակցություններ ստուգված մեդիա նախագծերի հեղինակների hետ",
  },

  // ── featured productions ──────────────────────
  "featured.title": { ru: "Избранные проекты", en: "Featured Productions", hy: "Հասանելի նախագծեր" },

  // ── how it works (landing widget) ────────────
  "landingHow.title": { ru: "Как это работает", en: "How It Works", hy: "Ինչպես է աշխատում" },
  "landingHow.subtitle": {
    ru: "Соединяем создателей и бренды. Честные сделки, аутентичный плейсмент.",
    en: "Connect creators and brands. Fair deals, authentic placements.",
    hy: "Երեք պարզ քայլ՝ մեդիա նախագծերի արտադրողների և բրենդների միջև արդար ու թափանցիկ համագործակցության համար։",
  },
  "landingHow.forBrands": { ru: "Для брендов", en: "For Brands", hy: "Բրենդների համար" },
  "landingHow.forCreators": { ru: "Для создателей", en: "For Creators", hy: "Արտադրողների համար" },
  "landingHow.brand1Title": { ru: "Смотрите каталог", en: "Browse Catalog", hy: "Ընտրեք նախագիծը" },
  "landingHow.brand1Caption": {
    ru: "Изучайте доступные фильмы и продакшен-сделки в открытом каталоге.",
    en: "Explore available films and production deals in the open catalog.",
    hy: "Ուսումնասիրեք նախագծերը և ընտրեք Ձեր թիրախային լսարանին համապատասխանողը։",
  },
  "landingHow.brand2Title": { ru: "Проявите интерес", en: "Express Interest", hy: "Կապ հաստատեք" },
  "landingHow.brand2Caption": {
    ru: "Отправьте требования к плейсменту и бюджет создателям, с которыми хотите работать.",
    en: "Submit placement requirements and budget to creators you connect with.",
    hy: "Ներկայացրեք Ձեր բրենդի պահանջները և ստացեք հետադարձ կապ։",
  },
  "landingHow.brand3Title": { ru: "Договоритесь", en: "Match & Negotiate", hy: "Սկսեք համագործակցությունը" },
  "landingHow.brand3Caption": {
    ru: "Сотрудничайте с создателями, чтобы создать идеальный продакт-плейсмент.",
    en: "Collaborate with creators to craft the perfect product placement.",
    hy: "Համաձայնեցրեք մանրամասները, կնքեք պայմանագիրը և սկսեք արդյունավետ համագործակցությունը։",
  },
  "landingHow.film1Title": { ru: "Загрузите сценарий", en: "Upload Script", hy: "Ներկայացրեք նախագիծը" },
  "landingHow.film1Caption": {
    ru: "Поделитесь сценарием с явно отмеченными возможностями для плейсмента.",
    en: "Share your screenplay with placement opportunities clearly marked.",
    hy: "Կիսվեք Ձեր նախագծով՝ ներկայացնելով առանձնահատկություններն ու ինտեգրացիայի տարբերակները։",
  },
  "landingHow.film2Title": { ru: "Получайте предложения", en: "Receive Offers", hy: "Ստացեք առաջարկներ" },
  "landingHow.film2Caption": {
    ru: "Находите бренды, заинтересованные в вашем проекте.",
    en: "Get matched with brands interested in your production.",
    hy: "Ստացեք առաջարկներ Ձեր նախագծով հետաքրքրված ընկերությունների կողմից։",
  },
  "landingHow.film3Title": {
    ru: "Монетизируйте историю",
    en: "Monetize Your Story",
    hy: "Հաստատեք համագործակցություն",
  },
  "landingHow.film3Caption": {
    ru: "Договаривайтесь об условиях и получайте дополнительное финансирование фильма.",
    en: "Negotiate terms and unlock additional funding for your film.",
    hy: "Համաձայնեցրեք պայմաններն ու հաստատեք ձեր համագործակցությունը մեր աջակցությամբ։",
  },
  "landingHow.matchTitle": { ru: "Сделка и совпадение", en: "Matching & Deal", hy: "Փոխշահավետ գործարք" },
  "landingHow.matchCaption": {
    ru: "Завершайте сотрудничество и заключайте соглашения, выгодные всем сторонам.",
    en: "Close collaboration and secure agreements that benefit everyone.",
    hy: "Կնքեք համագործակցություն, որը շահեկան է բոլորի համար։",
  },

  // ── get started ───────────────────────────────
  "getStarted.title": { ru: "Начните", en: "Get Started", hy: "Գրանցվեք հարթակում" },
  "getStarted.forBrandsTitle": { ru: "Для брендов", en: "For Brands", hy: "Բրենդների համար" },
  "getStarted.forBrandsBody": {
    ru: "Изучайте проверенные проекты, посценовые отчёты о плейсменте, платите только по закрытым сделкам.",
    en: "Browse vetted productions, scene-level placement reports, pay only on closed deals.",
    hy: "Ինտեգրեք Ձեր բրենդը լավագույն ֆիլմերում ու շոուներում՝ հեշտ և ապահով։",
  },
  "getStarted.forCreatorsTitle": { ru: "Для создателей", en: "For Creators", hy: "Արտադրողների համար" },
  "getStarted.forCreatorsBody": {
    ru: "Монетизируйте свой проект, сохраняйте творческий контроль, получите бесплатный отчёт о плейсменте.",
    en: "Monetize your production, keep creative control, free placement report.",
    hy: "Ձեր հաջորդ նախագիծը կգտնի իր կատարյալ գործընկերոջը հենց այստեղ։",
  },

  // ── why we built this ─────────────────────────
  "why.title": { ru: "Почему мы это создали", en: "Why We Built This", hy: "Ինչու ենք մենք ստեղծել սա" },
  "why.paragraph1": {
    ru: "Продакт-плейсмент десятилетиями оставался несовершенной системой. Создатели с трудом монетизируют свои истории, а бренды блуждают по непрозрачным сетям, переплачивая за плейсменты, которые могут никогда не выйти на экран. Всё делается вручную, неэффективно и доступно лишь через личные связи.",
    en: "Product placement has been broken for decades. Creators struggle to monetize their stories while brands stumble through opaque networks, paying inflated premiums for placements that may never see the light of day. It's manual, inefficient, and gated behind relationship networks.",
    hy: "Փրոդակթ փլեյսմենթը տասնամյակներ շարունակ մնացել է խափանված համակարգ։ Հեղինակները դժվարանում են մոնետիզացնել իրենց պատմությունները, իսկ բրենդները շրջում են անթափանց ցանցերում՝ վճարելով գերագնահատված գումարներ այն տեղադրումների համար, որոնք գուցե երբեք չհասնեն էկրան։ Ամեն ինչ արվում է ձեռքով, անարդյունավետ և հասանելի է միայն կապերի միջոցով։",
  },
  "why.paragraph2": {
    ru: "Мы создали iGovazd, чтобы это изменить. Делая плейсмент прозрачным, основанным на данных и доступным, мы даём создателям возможность контролировать свою судьбу и помогаем брендам делать более разумный, аутентичный выбор о том, где появляется их продукт.",
    en: "We built iGovazd to change that. By making placement transparent, data-driven, and accessible, we empower creators to control their own destiny and help brands make smarter, more authentic choices about where their products appear.",
    hy: "Մենք ստեղծել ենք iGovazd-ը՝ դա փոխելու համար։ Դարձնելով տեղադրումը թափանցիկ, տվյալահեն և հասանելի, մենք հնարավորություն ենք տալիս հեղինակներին վերահսկել իրենց ճակատագիրը և օգնում ենք բրենդներին ավելի խելացի, ինքնատիպ ընտրություն կատարել այն մասին, թե որտեղ է հայտնվում իրենց ապրանքը։",
  },
  "why.paragraph3": {
    ru: "Наша миссия проста: создать более справедливый рынок, где отличные истории встречаются с отличными брендами, и выигрывают все.",
    en: "Our mission is simple: create a fairer marketplace where great stories meet great brands, and everyone wins.",
    hy: "Մեր առաքելությունը պարզ է. ստեղծել ավելի արդար շուկա, որտեղ հիանալի պատմությունները հանդիպում են հիանալի բրենդների, և բոլորը հաղթում են։",
  },
  "why.ceoRole": { ru: "CEO и сооснователь", en: "CEO & Co-founder", hy: "CEO և համահիմնադիր" },
  "why.ceoBio": {
    ru: "Увлечён демократизацией доступа к финансированию кино и трансформацией того, как бренды связываются с аутентичным сторителлингом.",
    en: "Passionate about democratizing access to film financing and transforming how brands connect with authentic storytelling.",
    hy: "Կրքոտ է կինոյի ֆինանսավորման հասանելիության ժողովրդավարացման և բրենդների՝ ինքնատիպ պատմելու հետ կապվելու եղանակի փոփոխման հարցում։",
  },
  "why.ctoRole": { ru: "CTO и сооснователь", en: "CTO & Co-founder", hy: "CTO և համահիմնադիր" },
  "why.ctoBio": {
    ru: "Опытный инженер, создавший масштабируемые платформы. Верит, что прозрачность на основе данных — ключ к устойчивому творческому партнёрству.",
    en: "Experienced engineer who built scalable platforms. Believes data-driven transparency is key to sustainable creative partnerships.",
    hy: "Փորձառու ինժեներ, ով ստեղծել է մասշտաբավորվող հարթակներ։ Հավատում է, որ տվյալահեն թափանցիկությունը կայուն ստեղծագործական գործընկերության բանալին է։",
  },

  // ── FAQ ────────────────────────────────────────
  "faq.title": { ru: "Часто задаваемые вопросы", en: "Frequently Asked Questions", hy: "Հաճախ տրվող հարցեր" },
  // Six questions, keys q1..q6 with NO gap. The old set ran q1,q3..q7 — the
  // missing q2 is what made the content writer's numbered rows land on the
  // wrong keys when her sheet was applied (2026-07-27).
  //
  // ⚠️ The hy column below is STILL the damaged version of that same mishap and
  // is live on igovazd.am: it asks a different set of questions from ru/en,
  // shifted by one (q3 repeats q2 outright), four answers read "Coming Soon…",
  // and the manual numbering the accordion already provides ("1. Ինչպե՞ս…") was
  // never stripped. All ten broken rows are flagged RED with a note in
  // /admin/i18n — the wording is the content writer's to fix there, not ours
  // (owner decision 2026-08-10), and publishing from that editor needs no
  // deploy. Only q2 is clean.
  "faq.q1.question": {
    ru: "Как формируется цена?",
    en: "How does pricing work?",
    hy: "1. Ինչպե՞ս է աշխատում հարթակը։",
  },
  "faq.q1.answer": {
    ru: "Плейсменты начинаются от $5000. Листинг и просмотр бесплатны — мы берём комиссию только когда сделка действительно закрывается, поэтому бренды и создатели никогда не платят за сорвавшиеся плейсменты.",
    en: "Placements start from $5K. Listing and browsing are free — we only take a fee when a deal actually closes, so brands and creators never pay for placements that fall through.",
    hy: "Coming Soon...",
  },
  "faq.q2.question": {
    ru: "Кто может пользоваться платформой?",
    en: "Who is the platform for?",
    hy: "Ովքե՞ր կարող են օգտվել հարթակից։",
  },
  "faq.q2.answer": {
    ru: "И крупные, средние и малые бренды, и независимые кинопроизводители, продюсерские центры и авторы YouTube- и медиашоу.",
    en: "Brands large, mid-sized and small, as well as independent film producers, production houses, and the authors of YouTube and media shows.",
    hy: "Հարթակը նախատեսված է ինչպես խոշոր, միջին ու փոքր բրենդների, այնպես էլ անկախ կինոարտադրողների, պրոդյուսերական կենտրոնների և YouTube/մեդիա շոուների հեղինակների համար։",
  },
  "faq.q3.question": {
    ru: "Как защищена конфиденциальность сторон?",
    en: "How is party privacy protected?",
    hy: "2. Ովքե՞ր կարող են օգտվել հարթակից։",
  },
  "faq.q3.answer": {
    ru: "Ваши контактные данные не отображаются в публичном каталоге. Личности сторон становятся известны участникам сделки, а первый контакт помогает организовать платформа iGovazd.",
    en: "Your contact details aren't shown in the public catalog. Party identities become known to those involved in a deal, and iGovazd helps arrange the first contact.",
    hy: "Հարթակը նախատեսված է ինչպես խոշոր, միջին ու փոքր բրենդների, այնպես էլ անկախ կինոարտադրողների, պրոդյուսերական կենտրոնների և YouTube/մեդիա շոուների հեղինակների համար։",
  },
  "faq.q4.question": {
    ru: "Как создатели размещают проект?",
    en: "How do creators list a project?",
    hy: "3. Ինչպե՞ս է իրականացվում պայմանագրի կնքումը և վճարումը։",
  },
  "faq.q4.answer": {
    ru: "Создатели загружают сценарий, и наша система автоматически анализирует его, чтобы выявить сцены, готовые к плейсменту. Затем проект появляется в каталоге, доступном брендам для просмотра.",
    en: "Creators upload their screenplay, and our system analyzes it automatically to surface placement-ready scenes. The project then appears in the catalog for brands to discover and review.",
    hy: "Coming Soon...",
  },
  "faq.q5.question": {
    ru: "Какие стадии продакшена представлены?",
    en: "What production stages are listed?",
    hy: "4. Ի՞նչ երաշխիքներ են ստանում բրենդները։",
  },
  "faq.q5.answer": {
    ru: "Вы найдёте проекты на любой стадии — от сценариев, всё ещё находящихся в разработке, до пре-продакшена и финансирования, вплоть до тех, что уже активно снимаются.",
    en: "You'll find projects across every stage — from scripts still in development, to productions in pre-production and financing, through to those already in active filming.",
    hy: "Coming Soon...",
  },
  "faq.q6.question": {
    ru: "Как работает подбор и переговоры?",
    en: "How does matching and negotiation work?",
    hy: "5.  Որքա՞ն միջնորդավճար է վերցնում հարթակը։",
  },
  "faq.q6.answer": {
    ru: "Наш подбор находит подходящие сцены на основе категории и целей вашего бренда. После этого вы можете напрямую написать продакшену и договориться об условиях прямо внутри платформы, без посредников.",
    en: "Our matching surfaces relevant scenes based on your brand's category and goals. From there, you can message the production directly and negotiate terms inside the platform, no middlemen required.",
    hy: "Coming Soon...",
  },

  // ── contact section (landing + page shared bits) ─
  "contact.title": { ru: "Свяжитесь с нами", en: "Get in Touch", hy: "Կապվեք մեզ հետ" },
  "contact.subtitle": {
    ru: "Есть проект или бренд на примете? Напишите нам, и мы скоро ответим.",
    en: "Have a project or a brand in mind? Send us a message and we'll follow up shortly.",
    hy: "Գրեք մեզ, և մեր թիմը կապ կհաստատի Ձեզ հետ՝ քննարկելու համագործակցության մանրամասները։",
  },
  "contact.thanks": {
    ru: "Спасибо — мы скоро с вами свяжемся.",
    en: "Thanks — we'll get back to you shortly.",
    hy: "Շնորհակալություն։ Մենք շուտով կապ կհաստատենք Ձեզ հետ։",
  },
  "contact.messagePlaceholder": {
    ru: "Расскажите о своём проекте или бренде…",
    en: "Tell us about your project or brand…",
    hy: "Պատմեք Ձեր նախագծի կամ բրենդի մասին, կամ պարզապես հարցրեք այն, ինչ հետաքրքրում է Ձեզ։",
  },
  "contact.emailDirectly": {
    ru: "Или напишите нам напрямую:",
    en: "Or email us directly:",
    hy: "Կարող եք նաև գրել մեզ՝ ",
  },

  // ── contact page ──────────────────────────────
  "contactPage.title": { ru: "Свяжитесь с нами", en: "Get in Touch", hy: "Միշտ կապի մեջ" },
  "contactPage.subtitle": {
    ru: "Есть проект или бренд на примете? Давайте обсудим ваши возможности для плейсмента.",
    en: "Have a project or brand in mind? Let's talk about your placement opportunities.",
    hy: "Կապ հաստատեք մեզ հետ հարցերի, առաջարկների կամ համագործակցության համար։",
  },
  "contactPage.methodsTitle": { ru: "Способы связи", en: "Contact Methods", hy: "Ինչպես կապվել մեզ հետ" },
  "contactPage.methodsSubtitle": {
    ru: "Свяжитесь с нами по любому из этих каналов. Обычно мы отвечаем в течение 24 часов.",
    en: "Reach out to us through any of these channels. We typically respond within 24 hours.",
    hy: "Կա՛պ հաստատեք մեզ հետ նշված տարբերակներից ցանկացածով։ Կպատասխանենք Ձեզ առավելագույնը մեկ աշխատանքային օրվա ընթացքում։",
  },
  "contactPage.methodEmail": { ru: "Email", en: "Email", hy: "Էլփոստ" },
  "contactPage.methodPhone": { ru: "Телефон", en: "Phone", hy: "Հեռախոսահամար" },
  "contactPage.methodTelegram": { ru: "Telegram", en: "Telegram", hy: "Telegram" },
  "contactPage.methodWhatsApp": { ru: "WhatsApp", en: "WhatsApp", hy: "WhatsApp" },
  "contactPage.formTitle": { ru: "Отправьте нам сообщение", en: "Send us a Message", hy: "Գրե՛ք մեզ" },
  "contactPage.formSubtitle": {
    ru: "Расскажите о своём бренде и целях плейсмента. Мы рассмотрим и скоро свяжемся с вами.",
    en: "Tell us about your brand and placement goals. We'll review and get back to you shortly.",
    hy: "Պատմեք մեզ Ձեր նախագծի կամ բրենդի մասին։ Որքան մանրամասն նկարագրեք Ձեր նպատակները, այնքան արագ կառաջարկենք լավագույն լուծումը։",
  },
  "contactPage.thanks": {
    ru: "Спасибо — мы скоро с вами свяжемся.",
    en: "Thanks — we'll get back to you shortly.",
    hy: "Շնորհակալություն։ Մենք շուտով կապ կհաստատենք Ձեզ հետ։",
  },
  "contactPage.thanksSubtitle": {
    ru: "Проверьте почту для подтверждения.",
    en: "Check your email for confirmation.",
    hy: "Ստուգեք Ձեր էլփոստը հաստատման համար։",
  },
  "contactPage.projectOptional": { ru: "Проект (необязательно)", en: "Project (Optional)", hy: "Նախագծեր" },
  "contactPage.selectProject": { ru: "Выберите проект…", en: "Select a project...", hy: "Ընտրել" },
  "contactPage.messagePlaceholder": {
    ru: "Расскажите о своём бренде, целях и конкретных проектах или плейсментах, которые вас интересуют…",
    en: "Tell us about your brand, goals, and any specific projects or placements you're interested in…",
    hy: "Պատմեք Ձեր նախագծի կամ բրենդի մասին, կամ պարզապես հարցրեք այն, ինչ հետաքրքրում է։",
  },
  "contactPage.respondNote": {
    ru: "Мы рассмотрим ваше сообщение и ответим на вашу почту в течение 24 часов.",
    en: "We'll review your message and respond to your email within 24 hours.",
    hy: "Սովորաբար պատասխանում ենք մեկ աշխատանքային օրվա ընթացքում։",
  },

  // ── how it works (full page) ──────────────────
  // Eyebrow pill above the heading. /about and /portfolio had one and the other
  // hero pages didn't, so the same band looked like two different components.
  // Not nav.how here — the eyebrow would repeat the heading word for word.
  "hiw.eyebrow": { ru: "Процесс", en: "Process", hy: "Գործընթաց" },
  "hiw.heroTitle": { ru: "Как это работает", en: "How It Works", hy: "Ինչպես է աշխատում" },
  "hiw.heroSubtitle": {
    ru: "iGovazd связывает бренды с создателями через прозрачный, честный процесс. Узнайте, как начать всего за четыре простых шага.",
    en: "iGovazd connects brands with creators through a transparent, fair process. Discover how to get started in just four simple steps.",
    hy: "iGovazd-ը կապում է բրենդներին հեղինակների հետ թափանցիկ, արդար գործընթացի միջոցով։ Իմացեք, թե ինչպես սկսել ընդամենը չորս պարզ քայլով։",
  },
  "hiw.forBrandsTitle": { ru: "Для брендов", en: "For Brands", hy: "Բրենդների համար" },
  "hiw.forBrandsSubtitle": {
    ru: "Находите аутентичные возможности для плейсмента в премиальных фильмах и сериалах.",
    en: "Find authentic placement opportunities in premium film and TV productions.",
    hy: "Գտեք ինքնատիպ տեղադրման հնարավորություններ պրեմիում ֆիլմերում և հեռուստասերիալներում։",
  },
  "hiw.forCreatorsTitle": { ru: "Для создателей", en: "For Creators", hy: "Հեղինակների համար" },
  "hiw.forCreatorsSubtitle": {
    ru: "Откройте возможности финансирования, монетизируя плейсмент в своих проектах.",
    en: "Unlock funding opportunities by monetizing placement in your projects.",
    hy: "Բացահայտեք ֆինանսավորման հնարավորություններ՝ մոնետիզացնելով տեղադրումը ձեր նախագծերում։",
  },
  "hiw.brand1Title": { ru: "Смотрите каталог", en: "Browse Catalog", hy: "Դիտեք կատալոգը" },
  "hiw.brand1Desc": {
    ru: "Изучайте доступные кино- и ТВ-проекты с возможностями для плейсмента в открытом каталоге.",
    en: "Explore available film and TV productions with placement opportunities in the open catalog.",
    hy: "Ուսումնասիրեք տեղադրման հնարավորություններով հասանելի կինո և հեռուստատեսային նախագծերը բաց կատալոգում։",
  },
  "hiw.brand2Title": { ru: "Смотрите посценовый отчёт", en: "View Scene-Level Report", hy: "Դիտեք տեսարան առ տեսարան հաշվետվությունը" },
  "hiw.brand2Desc": {
    ru: "Получите доступ к подробным отчётам о плейсменте по каждому проекту, включая описания сцен и метрики аудитории.",
    en: "Access detailed placement reports for each project, including scene descriptions and audience metrics.",
    hy: "Ստացեք հասանելիություն յուրաքանչյուր նախագծի մանրամասն տեղադրման հաշվետվություններին, ներառյալ տեսարանների նկարագրություններ և լսարանի չափորոշիչներ։",
  },
  "hiw.brand3Title": { ru: "Проявляйте интерес и договаривайтесь", en: "Express Interest & Negotiate", hy: "Ցուցաբերեք հետաքրքրություն և բանակցեք" },
  "hiw.brand3Desc": {
    ru: "Отправляйте требования к плейсменту и данные о бюджете создателям. Сотрудничайте напрямую, чтобы создать аутентичный плейсмент под ваш бренд.",
    en: "Submit placement requirements and budget details to creators. Collaborate directly to craft authentic placements that fit your brand.",
    hy: "Ուղարկեք տեղադրման պահանջներն ու բյուջեի մանրամասները հեղինակներին։ Համագործակցեք ուղղակիորեն՝ ձեր բրենդին համապատասխան ինքնատիպ տեղադրումներ ստեղծելու համար։",
  },
  "hiw.brand4Title": { ru: "Заключайте сделку", en: "Close the Deal", hy: "Կնքեք գործարքը" },
  "hiw.brand4Desc": {
    ru: "Финализируйте соглашения о плейсменте на прозрачных условиях. Комиссия платформы взимается только при закрытии сделки — без предоплаты.",
    en: "Finalize placement agreements with transparent terms. Platform fee only applies when deals close — no upfront costs.",
    hy: "Ավարտեք տեղադրման համաձայնագրերը թափանցիկ պայմաններով։ Հարթակի վճարը կիրառվում է միայն գործարքի կնքման դեպքում՝ առանց նախավճարի։",
  },
  "hiw.film1Title": { ru: "Регистрация как продюсер", en: "Register as Publisher", hy: "Գրանցվեք որպես պրոդյուսեր" },
  "hiw.film1Desc": {
    ru: "Создайте профиль создателя и подтвердите свои данные. Откройте доступ к партнёрству с брендами и возможностям финансирования.",
    en: "Create your creator profile and verify your credentials. Unlock access to brand partnerships and funding opportunities.",
    hy: "Ստեղծեք ձեր հեղինակի պրոֆիլը և հաստատեք ձեր տվյալները։ Բացեք հասանելիություն բրենդային գործընկերությանը և ֆինանսավորման հնարավորություններին։",
  },
  "hiw.film2Title": { ru: "Разместите проект и возможности плейсмента", en: "List Project & Placement Opportunities", hy: "Ավելացրեք նախագիծը և տեղադրման հնարավորությունները" },
  "hiw.film2Desc": {
    ru: "Загрузите сценарий и чётко отметьте возможности для плейсмента. Поделитесь данными о целевой аудитории и творческих требованиях.",
    en: "Upload your screenplay and clearly mark placement opportunities. Share details about target audience and creative requirements.",
    hy: "Վերբեռնեք ձեր սցենարը և հստակ նշեք տեղադրման հնարավորությունները։ Կիսվեք թիրախային լսարանի և ստեղծագործական պահանջների մանրամասներով։",
  },
  "hiw.film3Title": { ru: "Получайте заявки от брендов", en: "Receive Brand Applications", hy: "Ստացեք բրենդների հայտերը" },
  "hiw.film3Desc": {
    ru: "Просматривайте входящие заявки от брендов, заинтересованных в вашем проекте. Изучайте их требования и договаривайтесь об условиях плейсмента.",
    en: "Browse incoming applications from brands interested in your project. Review their requirements and negotiate placement terms.",
    hy: "Դիտեք ձեր նախագծով հետաքրքրված բրենդների ստացված հայտերը։ Վերանայեք նրանց պահանջները և բանակցեք տեղադրման պայմանների շուրջ։",
  },
  "hiw.film4Title": { ru: "Получите финансирование", en: "Get Funded", hy: "Ստացեք ֆինանսավորում" },
  "hiw.film4Desc": {
    ru: "Заключайте сделки и получайте дополнительное финансирование продакшена через партнёрство с брендами. Сохраняйте творческий контроль на всех этапах.",
    en: "Close deals and unlock additional production funding through brand partnerships. Maintain creative control throughout the process.",
    hy: "Կնքեք գործարքներ և ստացեք լրացուցիչ արտադրական ֆինանսավորում բրենդային գործընկերության միջոցով։ Պահպանեք ստեղծագործական վերահսկողությունը ողջ գործընթացում։",
  },
  "hiw.trustTitle": { ru: "Честные сделки. Аутентичный плейсмент.", en: "Fair Deals. Authentic Placements.", hy: "Արդար գործարքներ։ Ինքնատիպ տեղադրումներ։" },
  "hiw.trustBody": {
    ru: "iGovazd построен на прозрачности и доверии. Никаких скрытых комиссий для брендов, творческий контроль для создателей и комиссия платформы — только при закрытии сделок.",
    en: "iGovazd is built on transparency and trust. No hidden fees for brands, creative control for creators, and platform fees only when deals close.",
    hy: "iGovazd-ը կառուցված է թափանցիկության և վստահության վրա։ Ոչ մի թաքնված վճար բրենդների համար, ստեղծագործական վերահսկողություն հեղինակների համար, և հարթակի վճարներ միայն գործարքների կնքման դեպքում։",
  },

  // ── portfolio page ─────────────────────────────
  "portfolio.eyebrow": { ru: "Портфолио", en: "Portfolio", hy: "Պորտֆոլիո" },
  "portfolio.title": { ru: "Кейсы", en: "Case Studies", hy: "Օրինակելի դեպքեր" },
  "portfolio.subtitle": {
    ru: "Реальные бренд-плейсменты, реальные результаты — обзор кампаний, реализованных в нашем каталоге фильмов и сериалов.",
    en: "Real brand placements, real results — a look at campaigns delivered across our film and TV catalog.",
    hy: "Իրական բրենդային տեղադրումներ, իրական արդյունքներ. ակնարկ մեր կինո և հեռուստատեսային կատալոգում իրականացված արշավների մասին։",
  },
  "portfolio.empty": { ru: "Пока нет кейсов — загляните позже.", en: "No case studies yet — check back soon.", hy: "Դեռ դեպքեր չկան․ ստուգեք ավելի ուշ։" },
  "portfolio.ctaTitle": { ru: "Хотите таких же результатов для своего бренда?", en: "Want results like these for your brand?", hy: "Ցանկանու՞մ եք նման արդյունքներ ձեր բրենդի համար" },
  "portfolio.ctaBody": {
    ru: "Изучите активные проекты, которые сейчас принимают заявки на брендированный плейсмент.",
    en: "Explore active productions currently accepting brand placement applications.",
    hy: "Ուսումնասիրեք ակտիվ նախագծերը, որոնք այժմ ընդունում են բրենդային տեղադրման հայտեր։",
  },
  "portfolio.previousCase": { ru: "Предыдущий кейс", en: "Previous case", hy: "Նախորդ դեպքը" },
  "portfolio.nextCase": { ru: "Следующий кейс", en: "Next case", hy: "Հաջորդ դեպքը" },

  // ── partners page ──────────────────────────────
  "partners.subtitle": {
    ru: "Продакшен-студии и дистрибьюторские сети, формирующие каталог iGovazd.",
    en: "Production studios and distribution networks building the iGovazd catalog.",
    hy: "Արտադրական ստուդիաներ և բաշխման ցանցեր, որոնք կառուցում են iGovazd-ի կատալոգը։",
  },
  "partners.fullNetwork": { ru: "Вся сеть", en: "Full Network", hy: "Ամբողջ ցանցը" },
  "partners.ctaTitle": { ru: "Хотите видеть здесь свой бренд?", en: "Want to see your brand here?", hy: "Ցանկանու՞մ եք տեսնել ձեր բրենդն այստեղ" },
  "partners.ctaBody": {
    ru: "Присоединяйтесь к партнёрской сети iGovazd и получите прямой доступ к проверенным кино- и ТВ-проектам.",
    en: "Join the iGovazd partner network and get direct access to vetted film and TV productions.",
    hy: "Միացեք iGovazd-ի գործընկերային ցանցին և ստացեք ուղղակի հասանելիություն ստուգված կինո և հեռուստատեսային նախագծերին։",
  },

  // ── report: hero / key facts / cast ────────────
  "report.back": { ru: "Назад", en: "Back", hy: "Հետ" },
  "report.video": { ru: "Видео", en: "Video", hy: "Տեսանյութ" },
  "report.catalogLabel": { ru: "Каталог", en: "Catalog", hy: "Կատալոգ" },
  "report.share": { ru: "Поделиться", en: "Share", hy: "Կիսվել" },
  // IA-12: window.print() opens the print dialog, not a download — label says
  // "Print" (users can Save as PDF from there). Key name kept for compat.
  "report.downloadPdf": { ru: "Печать", en: "Print", hy: "Տպել" },
  "report.prev": { ru: "Назад", en: "Previous", hy: "Նախորդ" },
  "report.next": { ru: "Вперёд", en: "Next", hy: "Հաջորդ" },
  "report.showMore": { ru: "Ещё", en: "More", hy: "Ավելին" },
  "report.showLess": { ru: "Свернуть", en: "Show less", hy: "Ծալել" },
  "report.linkCopied": { ru: "Ссылка скопирована", en: "Link copied", hy: "Հղումը պատճենվեց" },
  // ── report: press-kit additions (Aram) ──
  "cast.crewHeading": { ru: "Команда", en: "Crew", hy: "Թիմ" },
  "cast.castHeading": { ru: "Актёры", en: "Cast", hy: "Դերասաններ" },
  "keyFacts.cinemas": { ru: "Кинотеатры", en: "Cinemas", hy: "Կինոթատրոններ" },
  "keyFacts.comparableTo": { ru: "Сравнимо с", en: "Comparable to", hy: "Համեմատելի է" },
  // Product placement, shown ABOVE the sponsorship packages on the report:
  // the brand inside the story, with a still of the scene. A placement whose
  // price the creator left empty says "on request" instead of a number.
  "report.placementsTitle": { ru: "Продакт-плейсмент", en: "Product placement", hy: "Փրոդաքթ փլեյսմենթ" },
  "report.placementsSubtitle": {
    ru: "Где бренд появляется в самой истории",
    en: "Where the brand appears inside the story itself",
    hy: "Բրենդի օրգանական ինտեգրում կադրում և պատմության մեջ",
  },
  "report.priceOnRequest": { ru: "Цена по запросу", en: "Price on request", hy: "Գինը՝ հարցումով" },
  "investment.sponsorsTitle": { ru: "Пакеты спонсорства", en: "Sponsorship Packages", hy: "Հովանավորչական փաթեթներ" },
  "investment.sponsorsSubtitle": {
    ru: "Выберите уровень спонсорства проекта",
    en: "Choose a sponsorship level for the project",
    hy: "Համագործակցության տարբերակներ և բրենդինգի հնարավորություններ",
  },
  "report.slotsAvailable": { ru: "мест доступно", en: "slots available", hy: "հասանելի տեղ" },
  "report.exclusive": { ru: "Эксклюзив", en: "Exclusive", hy: "Բացառիկ" },
  // Replaces the "Express interest" button once the placement deadline has
  // passed — the page still reads, the offer just can't be made any more.
  "report.offersClosed": {
    ru: "Приём предложений закрыт",
    en: "Offers closed",
    hy: "Առաջարկների ընդունումը փակ է",
  },
  // The cast section carries crew as well ("Cast & Creators"), so the tab that
  // points at it is "Team" — owner decision 2026-07-29, four tabs.
  // The commercial section (placements + sponsorship) had no tab at all and
  // sat ~3500px down the page. It is the reason a brand is here, so it gets
  // the last tab and is highlighted as the primary one.

  // Sticky bar at the bottom of the report: the offer in one line, always
  // within reach. Social proof stays limited to free slots — view and
  // application counts are deliberately not shown (owner decision).
  "report.offerBarFrom": { ru: "Размещение от {price}", en: "Placements from {price}", hy: "Տեղադրումը՝ {price}-ից" },
  "report.offerBarSlots": {
    ru: "{free} из {total} размещений свободно",
    en: "{free} of {total} placements available",
    hy: "{total}-ից {free} տեղադրում ազատ է",
  },
  // The one name for the action, used by every apply button on the report:
  // the offer cards, the facts block and the sticky bar. Three different
  // wordings for one thing read as three different things, and the card a
  // button sits in already says which offer it belongs to (owner decision
  // 2026-07-29).
  "report.offerBarCta": { ru: "Подать заявку", en: "Apply", hy: "Ներկայացնել հայտ" },
  // Same button on a card the brand has already applied for. An application
  // belongs to one offer since 2026-07-29, so this marks that card alone —
  // its neighbours still say "apply" — and the button stays live, because
  // re-sending with new terms is how a brand revises its own offer.
  "report.offerApplied": { ru: "Заявка отправлена", en: "Application sent", hy: "Հայտն ուղարկված է" },

  // ── Deal card in the hero (owner decision 2026-07-29) ─────────────────────
  // The right column of the hero used to hold the production budget and ~280px
  // of nothing, while the first screen carried no way to act at all: the
  // sticky bar only appears once the overview (1648px tall) is scrolled past.
  // The card puts the whole offer — budget, entry price, free slots, deadline
  // — where the eye already is, and ends in the apply button.
  "report.deal.deadline": {
    ru: "Заявки до {date}",
    en: "Applications until {date}",
    hy: "Հայտերը՝ մինչև {date}",
  },
  // Three keys instead of one plural: ru has three forms for "день" and the
  // count is a live number. "дн." is the same trick format.serialEpisodes
  // uses — an abbreviation agrees with anything.
  "report.deal.daysLeft": { ru: "осталось {n} дн.", en: "{n} days left", hy: "մնաց {n} օր" },
  "report.deal.oneDayLeft": { ru: "остался 1 день", en: "1 day left", hy: "մնաց 1 օր" },
  "report.deal.lastDay": {
    ru: "сегодня последний день",
    en: "last day today",
    hy: "այսօր վերջին օրն է",
  },

  // ── "What a brand sees" checklist (audit B8) ──────────────────────────────
  // Every one of these blocks silently disappears from the public page when
  // it is empty, so a creator who left the placements out sees a page that
  // looks finished and never learns the main thing they are selling isn't on
  // it. The checklist names the blocks and says which ones also block
  // publication.
  "completeness.title": { ru: "Что увидит бренд", en: "What a brand sees", hy: "Ինչ է տեսնում բրենդը" },
  "completeness.hint": {
    ru: "Пустые разделы на странице проекта просто не показываются — бренд не узнает, что они есть.",
    en: "Empty sections are simply not rendered on the project page — a brand never learns they exist.",
    hy: "Դատարկ բաժինները նախագծի էջում պարզապես չեն ցուցադրվում — բրենդը չի իմանա դրանց մասին։",
  },
  "completeness.blocks": {
    ru: "Без этого нельзя опубликовать",
    en: "Required to publish",
    hy: "Առանց սրա հրապարակել հնարավոր չէ",
  },
  "completeness.allFilled": {
    ru: "Все разделы заполнены",
    en: "Every section is filled in",
    hy: "Բոլոր բաժինները լրացված են",
  },
  // Badge in the project lists (admin + creator cabinet).
  "completeness.badge": {
    ru: "Профиль неполный: {n}",
    en: "Incomplete: {n}",
    hy: "Թերի պրոֆիլ՝ {n}",
  },
  "completeness.badgeTitle": {
    ru: "Незаполненных разделов: {n}. Бренды их не видят.",
    en: "{n} sections are empty. Brands don't see them.",
    hy: "{n} բաժին դատարկ է։ Բրենդները դրանք չեն տեսնում։",
  },
  "completeness.item.tagline": { ru: "Логлайн", en: "Logline", hy: "Լոգլայն" },
  "completeness.item.studio": { ru: "Студия", en: "Studio", hy: "Ստուդիա" },
  "completeness.item.runtime": {
    ru: "Хронометраж (серии или фильма)",
    en: "Runtime (episodes or film)",
    hy: "Տևողություն (դրվագների կամ ֆիլմի)",
  },
  "completeness.item.poster": { ru: "Постер", en: "Poster", hy: "Պաստառ" },
  "completeness.item.video": { ru: "Видео или трейлер", en: "Video or trailer", hy: "Վիդեո կամ թրեյլեր" },
  "completeness.item.gallery": { ru: "Галерея кадров", en: "Stills gallery", hy: "Կադրերի պատկերասրահ" },
  "completeness.item.cast": { ru: "Актёры и создатели", en: "Cast & creators", hy: "Դերասաններ և հեղինակներ" },
  "completeness.item.milestones": { ru: "Этапы производства", en: "Production stages", hy: "Արտադրության փուլեր" },
  "completeness.item.placements": { ru: "Продакт-плейсмент", en: "Product placement", hy: "Փրոդակթ փլեյսմենթ" },
  "completeness.item.tiers": { ru: "Пакеты спонсорства", en: "Sponsorship packages", hy: "Հովանավորության փաթեթներ" },
  "completeness.item.references": { ru: "Похожие проекты", en: "Comparable titles", hy: "Համեմատելի նախագծեր" },
  "completeness.item.deadline": { ru: "Дедлайн заявок", en: "Application deadline", hy: "Հայտերի վերջնաժամկետ" },
  "completeness.item.releaseDate": { ru: "Дата премьеры", en: "Release date", hy: "Թողարկման ամսաթիվ" },
  "completeness.item.platforms": { ru: "Площадки показа", en: "Platforms", hy: "Ցուցադրման հարթակներ" },
  "completeness.item.cinemas": { ru: "Кинотеатры", en: "Cinemas", hy: "Կինոթատրոններ" },
  "completeness.item.budget": { ru: "Бюджет производства", en: "Production budget", hy: "Արտադրության բյուջե" },
  "completeness.item.ageRating": { ru: "Возрастной рейтинг", en: "Age rating", hy: "Տարիքային սահմանափակում" },
  // Unlike the others, an empty Format doesn't hide a section — it drops the
  // project out of the catalog's Format filter, so a brand narrowing the list
  // never reaches it at all.
  "completeness.item.formatCategory": { ru: "Формат", en: "Format", hy: "Ձևաչափ" },

  // ── "How it works" — converging flows (audit E1) ──────────────────────────
  // The page used to be two independent columns, so nothing on it showed that
  // the two sides ever meet. This diagram runs both branches inward into one
  // node — the application — and one arrow down from it to the deal.
  "hiw.flowTitle": {
    ru: "Как две стороны встречаются",
    en: "How the two sides meet",
    hy: "Ինչպես են երկու կողմերը հանդիպում",
  },
  "hiw.flowSubtitle": {
    ru: "Бренд идёт с одной стороны, создатель — с другой. Сходятся они на заявке.",
    en: "The brand comes from one side, the creator from the other. They meet at the application.",
    hy: "Բրենդը գալիս է մի կողմից, հեղինակը՝ մյուսից։ Նրանք հանդիպում են հայտի վրա։",
  },
  "hiw.flow.brand": { ru: "Бренд", en: "Brand", hy: "Բրենդ" },
  "hiw.flow.brandDesc": {
    ru: "Ищет, где показать продукт",
    en: "Looking for a place to show its product",
    hy: "Փնտրում է, թե որտեղ ցուցադրի իր ապրանքը",
  },
  "hiw.flow.register": { ru: "Регистрация", en: "Sign-up", hy: "Գրանցում" },
  "hiw.flow.registerDesc": {
    ru: "Профиль бренда, бюджет и категории",
    en: "Brand profile, budget and categories",
    hy: "Բրենդի պրոֆիլ, բյուջե և կատեգորիաներ",
  },
  "hiw.flow.creator": { ru: "Создатель", en: "Creator", hy: "Հեղինակ" },
  "hiw.flow.creatorDesc": {
    ru: "Снимает фильм или сериал",
    en: "Making a film or a series",
    hy: "Նկարահանում է ֆիլմ կամ սերիալ",
  },
  "hiw.flow.project": { ru: "Проект с размещениями", en: "Project with placements", hy: "Նախագիծ՝ տեղադրումներով" },
  "hiw.flow.projectDesc": {
    ru: "Сцены, пакеты и цены",
    en: "Scenes, packages and prices",
    hy: "Տեսարաններ, փաթեթներ և գներ",
  },
  "hiw.flow.hub": { ru: "Заявка и согласование", en: "Application & approval", hy: "Հայտ և համաձայնեցում" },
  "hiw.flow.hubDesc": {
    ru: "Бренд подаёт заявку, создатель отвечает",
    en: "The brand applies, the creator answers",
    hy: "Բրենդը ներկայացնում է հայտ, հեղինակը պատասխանում է",
  },
  "hiw.flow.deal": { ru: "Сделка", en: "Deal", hy: "Գործարք" },
  "hiw.flow.dealDesc": {
    ru: "Условия зафиксированы, размещение в работе",
    en: "Terms agreed, the placement goes into production",
    hy: "Պայմանները ամրագրված են, տեղադրումն ընթացքի մեջ է",
  },

  // Serial / single runtime chip. Was a hardcoded English "11m/12episodes"
  // with no space, printed on the Armenian and Russian pages alike.
  // "эп.", not "серий": the chip prints a bare number, and a Russian plural
  // would have to agree with it ("1 серий", "3 серий" are both wrong). The
  // abbreviation sidesteps the declension and matches what FORMAT_TOKENS
  // already renders for free-text formats ("ep" -> "эп"), so a serial with
  // episode data and one without read the same.
  "format.serialEpisodes": { ru: "{n} эп. × {m} мин", en: "{n} ep × {m} min", hy: "{n} սերիա × {m} րոպե" },
  // IA-50 §7: an episode runtime is now clock time ("1 ժամ 43 րոպե"), built
  // by formatDuration, so the row takes it pre-rendered instead of raw
  // minutes. format.serialEpisodes above is no longer referenced from code —
  // left in place until a dictionary sweep, so an unpublished draft of it
  // isn't destroyed by the deletion.
  "format.serialEpisodesDuration": { ru: "{n} эп. × {duration}", en: "{n} ep × {duration}", hy: "{n} սերիա × {duration}" },
  "format.filmMinutes": { ru: "{m} мин", en: "{m} min", hy: "{m} րոպե" },

  "cast.title": { ru: "Актёры и создатели", en: "Cast & Creators", hy: "Դերասաններ և հեղինակներ" },
  "cast.subtitle": { ru: "Актёры и создатели, задействованные в проекте", en: "Actors and creators attached to this project", hy: "Այս նախագծին կցված դերասաններ և հեղինակներ" },

  "keyFacts.release": { ru: "Выход", en: "Release", hy: "Ցուցադրությունը՝" },
  "keyFacts.platforms": { ru: "Где смотреть", en: "Available on", hy: "Հասանելի է" },
  // The inline icon row that used to sit under the hero image (genre · format ·
  // studio · countries) moved into this card as a labelled group — an icon with
  // a bare value ("Kinodaran") doesn't say what the value IS (owner decision
  // 2026-07-30, NN/g icon-usability). Group headings order the card the way a
  // brand decides: what it is -> who will see it -> when -> what it resembles.
  "keyFacts.genre": { ru: "Жанр", en: "Genre", hy: "Ժանր" },
  "keyFacts.format": { ru: "Формат", en: "Format", hy: "Ձևաչափ" },
  "keyFacts.studio": { ru: "Студия", en: "Studio", hy: "Ստուդիա" },
  "keyFacts.countries": { ru: "Съёмки", en: "Filmed in", hy: "Նկարահանումները" },
  "report.productionBudget": { ru: "Бюджет производства", en: "Production budget", hy: "Արտադրության բյուջե" },

  // ── application / contact form validation (F11/F12) ──
  "formErr.name": { ru: "Введите ваше имя.", en: "Please enter your name.", hy: "Մուտքագրեք ձեր անունը։" },
  "formErr.nameLong": { ru: "Имя слишком длинное.", en: "Name is too long.", hy: "Անունը չափազանց երկար է։" },
  "formErr.email": { ru: "Введите вашу эл. почту.", en: "Please enter your email.", hy: "Մուտքագրեք ձեր էլ. փոստը։" },
  "formErr.emailLong": { ru: "Эл. почта слишком длинная.", en: "Email is too long.", hy: "Էլ. փոստը չափազանց երկար է։" },
  "formErr.emailInvalid": { ru: "Введите корректный адрес эл. почты.", en: "Please enter a valid email address.", hy: "Մուտքագրեք վավեր էլ. փոստի հասցե։" },
  "formErr.message": { ru: "Введите сообщение.", en: "Please enter a message.", hy: "Մուտքագրեք հաղորդագրությունը։" },
  "formErr.messageLong": { ru: "Сообщение слишком длинное.", en: "Message is too long.", hy: "Հաղորդագրությունը չափազանց երկար է։" },
  "formErr.company": { ru: "Введите название.", en: "Please enter a name.", hy: "Մուտքագրեք անվանումը։" },
  "formErr.metricsNotObject": { ru: "Метрики должны быть JSON-объектом.", en: "Metrics must be a JSON object.", hy: "Մետրիկաները պետք է լինեն JSON օբյեկտ։" },
  "formErr.metricsNotJson": { ru: "Метрики: некорректный JSON.", en: "Metrics: invalid JSON.", hy: "Մետրիկաներ՝ անվավեր JSON։" },

  // ── legal pages ────────────────────────────────
  "legal.eyebrow": { ru: "Документы", en: "Legal", hy: "Իրավական փաստաթղթեր" },
  "legal.privacyTitle": { ru: "Политика конфиденциальности", en: "Privacy Policy", hy: "Գաղտնիության քաղաքականություն" },
  "legal.termsTitle": { ru: "Условия использования", en: "Terms of Service", hy: "Ծառայության մատուցման պայմաններ" },
  "legal.updated": { ru: "Обновлено:", en: "Updated:", hy: "Թարմացվել է՝" },
  "legal.backToHome": { ru: "На главную", en: "Back to home", hy: "Վերադառնալ գլխավոր էջ" },
  "legal.effectiveNotice": {
    ru: "Настоящая политика действует с указанной выше даты. Мы оставляем за собой право изменять эти условия в любое время. Продолжение использования означает согласие с изменениями.",
    en: "This policy is effective as of the date listed above. We reserve the right to modify these terms at any time. Continued use constitutes acceptance of changes.",
    hy: "Այս քաղաքականությունը գործում է վերևում նշված ամսաթվից։ Մենք իրավունք ենք վերապահում ցանկացած պահի փոփոխել այս պայմանները։ Շարունակական օգտագործումը նշանակում է փոփոխությունների ընդունում։",
  },

  // ── login / register ───────────────────────────
  "login.title": { ru: "Вход", en: "Sign In", hy: "Մուտք" },
  "login.subtitle": { ru: "Войдите в аккаунт бренда или создателя.", en: "Sign in to your brand or creator account.", hy: "Մուտք գործեք ձեր բրենդի կամ հեղինակի հաշիվ։" },
  "login.emailPlaceholder": { ru: "you@brand.com", en: "you@brand.com", hy: "you@company.com" },
  "login.password": { ru: "Пароль", en: "Password", hy: "Գաղտնաբառ" },
  "login.signIn": { ru: "Войти", en: "Sign In", hy: "Մուտք" },

  "register.title": { ru: "Регистрация", en: "Create Account", hy: "Գրանցում" },
  "register.subtitle": {
    ru: "Создайте аккаунт бренда или создателя — доступ открывается сразу после регистрации.",
    en: "Create a brand or creator account — access opens right after you sign up.",
    hy: "Ստեղծեք հաշիվ որպես Բրենդ կամ Մեդիա արտադրող հարթակի հնարավորություններից օգտվելու համար։",
  },
  "register.fullName": { ru: "Полное имя", en: "Full name", hy: "Անուն" },
  "register.fullNamePlaceholder": { ru: "Иван Иванов", en: "Jane Doe", hy: "Անուն Ազգանուն" },
  "register.workEmail": { ru: "Рабочий email", en: "Work email", hy: "Աշխատանքային էլփոստ" },
  "register.emailPlaceholderBrand": { ru: "you@brand.com", en: "you@brand.com", hy: "you@company.com" },
  "register.emailPlaceholderCreator": { ru: "you@studio.com", en: "you@studio.com", hy: "you@company.com" },
  "register.companyPlaceholder": { ru: "Название компании", en: "Brand Inc.", hy: "Ընկերության անուն" },
  "register.creatorOrg": { ru: "Студия / Псевдоним", en: "Studio / Alias", hy: "Ստուդիայի / Նախագծի անուն" },
  "register.creatorOrgPlaceholder": {
    ru: "Название студии или псевдоним",
    en: "Studio name or alias",
    hy: "Օր.` iGovazd Studio",
  },
  "register.alreadyHaveAccess": { ru: "Уже есть доступ?", en: "Already have access?", hy: "Արդեն ունե՞ք հաշիվ։" },
  "register.signIn": { ru: "Войти", en: "Sign in", hy: "Մուտք գործել" },

  // ── auth: register (brand + creator self-serve) ──
  "register.accountType": { ru: "Тип аккаунта", en: "Account type", hy: "Հաշվի տեսակ" },
  "register.typeBrand": { ru: "Бренд", en: "Brand", hy: "Բրենդ" },
  "register.typeCreator": { ru: "Создатель", en: "Creator", hy: "Արտադրող" },
  "register.typeBrandHint": {
    ru: "Хочу разместить бренд в проектах",
    en: "Place my brand in productions",
    hy: "Ներկայացնել իմ բրենդը նախագծերում։",
  },
  "register.typeCreatorHint": {
    ru: "Монетизирую свой контент плейсментом",
    en: "Monetize my content with placement",
    hy: "Ներկայացնել նախագծեր և գտնել գործընկերներ։",
  },
  // Dual-side accounts (2026-08-11) — this choice only decides where the
  // account lands first; the other side is one click away later, in the
  // profile / header switcher, not a second registration.
  "register.bothSidesLater": {
    ru: "Это выбор стартовой стороны — вторую можно включить позже в профиле.",
    en: "This just picks where you start — turn the other side on later from your profile.",
    hy: "Սա միայն մեկնարկային կողմն է․ երկրորդը հետո կարող եք միացնել պրոֆիլում։",
  },
  "register.password": { ru: "Пароль", en: "Password", hy: "Գաղտնաբառ" },
  "register.passwordPlaceholder": { ru: "Минимум 8 символов", en: "At least 8 characters", hy: "Առնվազն 8 նիշ" },
  "register.submit": { ru: "Зарегистрироваться", en: "Create account", hy: "Գրանցվել" },
  // Reworded 2026-08-11 (dual-side accounts) — used to just say "taken"; now
  // points at the actual fix, which is signing in and turning the other side
  // on from the profile rather than trying a second account. Text stays
  // identical whether the existing row is a member or staff, or this message
  // becomes an oracle for staff emails (see createMember/createGoogleMember —
  // neither branches on that).
  "register.errEmailTaken": {
    ru: "На этот адрес уже есть аккаунт. Войдите — вторую сторону можно включить в профиле.",
    en: "There's already an account for this address. Sign in — you can turn on the other side from your profile.",
    hy: "Այս հասցեին արդեն կա հաշիվ։ Մուտք գործեք․ երկրորդ կողմը կարող եք միացնել պրոֆիլում։",
  },
  "register.errFields": { ru: "Заполните все обязательные поля.", en: "Please fill in all required fields.", hy: "Լրացրեք բոլոր պարտադիր դաշտերը։" },
  "register.errPasswordShort": { ru: "Пароль должен быть не короче 8 символов.", en: "Password must be at least 8 characters.", hy: "Գաղտնաբառը պետք է լինի առնվազն 8 նիշ։" },

  // ── auth: login errors ──
  "login.errInvalid": {
    ru: "Неверный email или пароль.",
    en: "Incorrect email or password.",
    hy: "Սխալ էլփոստ կամ գաղտնաբառ։",
  },
  "login.errPending": { ru: "Аккаунт ожидает одобрения администратора.", en: "Your account is awaiting admin approval.", hy: "Ձեր հաշիվը սպասում է ադմինի հաստատմանը։" },
  "login.errBlocked": { ru: "Аккаунт заблокирован. Свяжитесь с администрацией.", en: "This account is blocked. Contact the administrator.", hy: "Հաշիվը արգելափակված է։ Կապվեք ադմինի հետ։" },
  "login.errRejected": { ru: "Заявка на регистрацию отклонена.", en: "Your registration was rejected.", hy: "Ձեր գրանցման հայտը մերժվել է։" },
  "login.noAccount": { ru: "Нет аккаунта?", en: "No account?", hy: "Չունե՞ք հաշիվ։" },
  "login.registerLink": { ru: "Зарегистрироваться", en: "Register", hy: "Գրանցվել" },
  "login.errGoogle": { ru: "Не удалось войти через Google.", en: "Google sign-in failed.", hy: "Google մուտքը ձախողվեց։" },
  "login.errTooManyAttempts": { ru: "Слишком много попыток. Повторите через несколько минут.", en: "Too many attempts. Try again in a few minutes.", hy: "Չափազանց շատ փորձեր։ Կրկնեք մի քանի րոպեից։" },
  "login.errDeactivated": { ru: "Аккаунт деактивирован. Свяжитесь с администратором.", en: "This account has been deactivated. Contact the administrator.", hy: "Հաշիվն ապաակտիվացված է։ Կապվեք ադմինիստրատորի հետ։" },
  "login.errFillBoth": {
    ru: "Введите email и пароль.",
    en: "Please enter your email and password.",
    hy: "Մուտքագրեք էլփոստը և գաղտնաբառը։",
  },
  "adminLogin.title": { ru: "Вход в админку", en: "Admin sign-in", hy: "Ադմինի մուտք" },
  "adminLogin.subtitle": { ru: "Войдите под аккаунтом администратора или публикатора.", en: "Sign in with your admin or publisher account.", hy: "Մուտք գործեք ադմինի կամ հրապարակողի հաշվով։" },
  "auth.rememberMe": { ru: "Запомнить меня", en: "Remember me", hy: "Հիշել ինձ" },
  "auth.signingIn": { ru: "Вход…", en: "Signing in…", hy: "Մուտք…" },

  // ── auth: Google OAuth ──
  "auth.googleContinue": { ru: "Продолжить через Google", en: "Continue with Google", hy: "Շարունակել Google-ով" },
  "auth.or": { ru: "или", en: "or", hy: "կամ" },
  "auth.redirecting": { ru: "Готово, перенаправляем…", en: "All set, redirecting…", hy: "Պատրաստ է, ուղղորդում ենք…" },
  "auth.passwordShow": { ru: "Показать пароль", en: "Show password", hy: "Ցույց տալ գաղտնաբառը" },
  "auth.passwordHide": { ru: "Скрыть пароль", en: "Hide password", hy: "Թաքցնել գաղտնաբառը" },

  // ── forgot / reset password ──────────────────
  "auth.forgotLink": { ru: "Забыли пароль?", en: "Forgot password?", hy: "Մոռացե՞լ եք գաղտնաբառը" },
  "auth.forgotTitle": { ru: "Восстановление пароля", en: "Reset your password", hy: "Գաղտնաբառի վերականգնում" },
  "auth.forgotSubtitle": {
    ru: "Укажите email — пришлём ссылку для сброса пароля.",
    en: "Enter your email and we'll send you a password reset link.",
    hy: "Նշեք ձեր էլփոստը՝ գաղտնաբառը վերականգնելու հղում կստանաք։",
  },
  "auth.forgotSubmit": { ru: "Отправить ссылку", en: "Send reset link", hy: "Ուղարկել հղումը" },
  "auth.forgotSent": {
    ru: "Если такой аккаунт существует, письмо со ссылкой уже отправлено. Проверьте почту.",
    en: "If an account exists for that email, we've sent a reset link. Check your inbox.",
    hy: "Եթե այդպիսի հաշիվ գոյություն ունի, մենք ուղարկել ենք հղում։ Ստուգեք ձեր փոստը։",
  },
  "auth.resetTitle": { ru: "Новый пароль", en: "Set a new password", hy: "Նոր գաղտնաբառ" },
  "auth.resetSubmit": { ru: "Сохранить пароль", en: "Save password", hy: "Պահպանել գաղտնաբառը" },
  "auth.resetNewPassword": { ru: "Новый пароль", en: "New password", hy: "Նոր գաղտնաբառ" },
  "auth.resetConfirmPassword": { ru: "Повторите пароль", en: "Confirm password", hy: "Կրկնեք գաղտնաբառը" },
  "auth.resetMismatch": { ru: "Пароли не совпадают.", en: "Passwords don't match.", hy: "Գաղտնաբառերը չեն համընկնում։" },
  "auth.resetWeak": { ru: "Пароль должен быть не короче 8 символов.", en: "Password must be at least 8 characters.", hy: "Գաղտնաբառը պետք է լինի առնվազն 8 նիշ։" },
  "auth.resetInvalid": { ru: "Ссылка недействительна или уже использована.", en: "This link is invalid or has already been used.", hy: "Հղումն անվավեր է կամ արդեն օգտագործված է։" },
  "auth.resetExpired": { ru: "Срок действия ссылки истёк. Запросите новую.", en: "This link has expired. Please request a new one.", hy: "Հղումի ժամկետը լրացել է։ Հայցեք նոր հղում։" },
  "auth.resetInvalidLink": { ru: "Ссылка недействительна.", en: "This link is invalid.", hy: "Հղումն անվավեր է։" },
  "register.completeTitle": { ru: "Завершите профиль", en: "Complete your profile", hy: "Լրացրեք ձեր պրոֆիլը" },
  "register.completeBody": {
    ru: "Выберите тип аккаунта, чтобы завершить регистрацию через Google.",
    en: "Choose your account type to finish signing up with Google.",
    hy: "Ընտրեք հաշվի տեսակը՝ Google-ով գրանցումն ավարտելու համար։",
  },

  // ── member cabinet (/account) ──
  "account.title": { ru: "Кабинет", en: "Dashboard", hy: "Անձնական էջ" },
  "account.welcome": { ru: "Здравствуйте, {name}", en: "Welcome, {name}", hy: "Բարև, {name}" },
  "account.profile": { ru: "Профиль", en: "Profile", hy: "Պրոֆիլ" },
  "account.profile.subtitle": {
    ru: "Управляйте своим профилем создателя",
    en: "Manage your creator profile",
    hy: "Կառավարեք ձեր հեղինակի պրոֆիլը",
  },
  "account.profile.avatar": { ru: "Аватар", en: "Avatar", hy: "Ավատար" },
  "account.profile.avatarHint": {
    ru: "Изображение профиля. Также используется как логотип при генерации постера.",
    en: "Your profile picture. Also used as the logo when generating a poster.",
    hy: "Ձեր պրոֆիլի նկարը։ Օգտագործվում է նաև որպես լոգո՝ պաստառ ստեղծելիս։",
  },
  "account.profile.nameRequired": {
    ru: "Укажите имя",
    en: "Name is required",
    hy: "Անունը պարտադիր է",
  },
  "account.profile.phone": { ru: "Телефон", en: "Phone", hy: "Հեռախոս" },
  "account.profile.website": {
    ru: "Сайт / портфолио",
    en: "Website / portfolio",
    hy: "Կայք / պորտֆոլիո",
  },
  "account.profile.stats": { ru: "Статистика", en: "Overview", hy: "Ընդհանուր" },
  "account.profile.memberSince": { ru: "На платформе с", en: "Member since", hy: "Անդամ է" },
  "account.profile.projectsTotal": { ru: "Проектов", en: "Projects", hy: "Նախագծեր" },
  "account.profile.projectsApproved": { ru: "Одобрено", en: "Approved", hy: "Հաստատված" },
  "account.roleBrand": { ru: "Бренд", en: "Brand", hy: "Բրենդ" },
  "account.roleCreator": { ru: "Создатель", en: "Creator", hy: "Հեղինակ" },
  "account.statusApproved": { ru: "Одобрен", en: "Approved", hy: "Հաստատված" },
  "account.logout": { ru: "Выйти", en: "Log out", hy: "Դուրս գալ" },

  // ── shared UI controls (multi-select / uploaders) ──
  "ui.addOption": { ru: "Добавить", en: "Add", hy: "Ավելացնել" },
  "ui.remove": { ru: "Удалить", en: "Remove", hy: "Հեռացնել" },
  "ui.close": { ru: "Закрыть", en: "Close", hy: "Փակել" },


  // ── creator: "My projects" list + submission form (#16) ──
  "account.myProjects": { ru: "Мои проекты", en: "My projects", hy: "Իմ նախագծերը" },
  "account.myProjectsSubtitle": {
    ru: "Здесь собраны все проекты, которые вы подали, и статус их модерации.",
    en: "All the projects you've submitted, and their moderation status.",
    hy: "Ձեր ներկայացրած բոլոր նախագծերն ու դրանց մոդերացիայի կարգավիճակը։",
  },
  "account.submitProject": { ru: "Подать проект", en: "Submit project", hy: "Ներկայացնել նախագիծ" },
  "account.submitProjectSubtitle": {
    ru: "Заполните данные проекта и отправьте его на модерацию.",
    en: "Fill in the project details and send it for moderation.",
    hy: "Լրացրեք նախագծի տվյալները և ուղարկեք մոդերացիայի։",
  },
  "account.submitFirstProject": {
    ru: "Подать первый проект",
    en: "Submit your first project",
    hy: "Ներկայացնել առաջին նախագիծը",
  },
  "account.noProjects": {
    ru: "У вас пока нет проектов.",
    en: "You don't have any projects yet.",
    hy: "Դուք դեռ նախագիծ չունեք։",
  },
  "account.projectsCount": {
    ru: "Проектов: {count}",
    en: "{count} project(s)",
    hy: "Նախագծեր՝ {count}",
  },
  "account.status.draft": { ru: "Черновик", en: "Draft", hy: "Սևագիր" },
  "account.status.pending": { ru: "На модерации", en: "Pending review", hy: "Մոդերացիայի փուլում" },
  "account.status.approved": { ru: "Одобрен", en: "Approved", hy: "Հաստատված" },
  "account.status.rejected": { ru: "Отклонён", en: "Rejected", hy: "Մերժված" },
  // Not a moderation status — the placement deadline simply passed, so the
  // listing left the catalog. Shown alongside the moderation pill.
  "account.status.archived": { ru: "В архиве", en: "Archived", hy: "Արխիվում" },
  "account.rejectionReason": { ru: "Причина отказа:", en: "Reason for rejection:", hy: "Մերժման պատճառը․" },
  // Per-listing numbers for the creator (audit 4.8).
  "account.stats.views": { ru: "Просмотры", en: "Views", hy: "Դիտումներ" },
  "account.stats.favorites": { ru: "В избранном", en: "Shortlisted", hy: "Ընտրյալում" },
  "account.stats.applications": { ru: "Заявки", en: "Applications", hy: "Հայտեր" },
  // ── creator: edit + resubmit own project (audit 2.4 / owner decision C.6) ──
  "account.editProject": { ru: "Редактировать проект", en: "Edit project", hy: "Խմբագրել նախագիծը" },
  /* Replaces "Edit project" on a published card — the form opens read-only. */
  "account.viewProject": { ru: "Посмотреть проект", en: "View project", hy: "Դիտել նախագիծը" },
  "account.editsViaEditors": {
    ru: "правки — через редакцию",
    en: "edits go through the editors",
    hy: "փոփոխությունները՝ խմբագրության միջոցով",
  },
  "account.editProjectSubtitle": {
    ru: "Изменения снова отправят проект на модерацию.",
    en: "Saving changes sends the project back for moderation.",
    hy: "Փոփոխությունները նախագիծը կրկին կուղարկեն մոդերացիայի։",
  },
  // ── Applications inbox (audit wave 2) ──
  /* "Applications" was the wrong word: an application is something you file
     hoping to be accepted, but here the brand arrives with money and names a
     package. It also collided with the other two things called "заявка" in
     the panel — project submissions in Moderation, and account approvals.
     Renamed to Brand offers (owner decision 2026-07-26). */
  "interests.title": { ru: "Предложения брендов", en: "Brand offers", hy: "Բրենդների առաջարկներ" },
  "interests.subtitle": {
    ru: "Предложения брендов по вашим проектам: пакет, условия и ваш ответ.",
    en: "Brand offers on your projects: package, terms and your answer.",
    hy: "Բրենդների առաջարկները ձեր նախագծերի վերաբերյալ՝ փաթեթ, պայմաններ և ձեր պատասխանը։",
  },
  /* The admin panel already says whose offers these are (it lists every one on
     the platform), so the "Brand" prefix is noise there — owner decision
     2026-08-05. The member-side title keeps it. */
  "interests.titleAdmin": { ru: "Предложения", en: "Offers", hy: "Առաջարկներ" },
  "interests.subtitleAdmin": {
    ru: "Все предложения брендов на площадке.",
    en: "Every brand offer on the platform.",
    hy: "Հարթակի բոլոր բրենդային առաջարկները։",
  },
  "interests.empty": { ru: "Предложений пока нет.", en: "No offers yet.", hy: "Առաջարկներ դեռ չկան։" },
  "interests.from": { ru: "От кого", en: "From", hy: "Ումից" },
  "interests.contact": { ru: "Контакт", en: "Contact", hy: "Կոնտակտ" },
  "interests.package": { ru: "Пакет размещения", en: "Placement package", hy: "Տեղադրման փաթեթ" },
  "interests.noPackage": { ru: "Пакет не указан", en: "No package specified", hy: "Փաթեթը նշված չէ" },
  "interests.message": { ru: "Сообщение", en: "Message", hy: "Հաղորդագրություն" },
  "interests.brandBudget": { ru: "Бюджет бренда", en: "Brand budget", hy: "Բրենդի բյուջեն" },
  "interests.product": { ru: "Что размещаем", en: "What is being placed", hy: "Ի՞նչ ենք տեղադրում" },
  "interests.brandBudgetUnset": { ru: "Не указан", en: "Not specified", hy: "Նշված չէ" },
  "interests.brandCategories": { ru: "Категории бренда", en: "Brand categories", hy: "Բրենդի կատեգորիաները" },
  "interests.history": { ru: "История обращений", en: "History", hy: "Դիմումների պատմություն" },
  "interests.accept": { ru: "Принять", en: "Accept", hy: "Ընդունել" },
  "interests.decline": { ru: "Отклонить", en: "Decline", hy: "Մերժել" },
  "interests.answerPrompt": {
    ru: "Ответ бренду (необязательно) — он его увидит:",
    en: "Your answer to the brand (optional) — they will see it:",
    hy: "Ձեր պատասխանը բրենդին (ոչ պարտադիր) — նա կտեսնի այն․",
  },
  "interests.answered": { ru: "Ваш ответ", en: "Your answer", hy: "Ձեր պատասխանը" },
  // Same field seen from the buyer's side — there it's the seller's answer.
  "interests.answerFromSeller": { ru: "Ответ площадки", en: "Reply from the seller", hy: "Հարթակի պատասխանը" },
  "interests.status.SENT": { ru: "Ожидает ответа", en: "Awaiting answer", hy: "Սպասում է պատասխանի" },
  "interests.status.MUTUAL": { ru: "Принята", en: "Accepted", hy: "Ընդունված" },
  "interests.status.DECLINED": { ru: "Отклонена", en: "Declined", hy: "Մերժված" },
  "interests.errNotAllowed": {
    ru: "Недостаточно прав для этого действия.",
    en: "You don't have permission for this action.",
    hy: "Այս գործողության համար իրավունքները բավարար չեն։",
  },
  "interests.ownerDecides": {
    ru: "Ответ на заявку даёт владелец проекта.",
    en: "The project's owner answers this application.",
    hy: "Հայտին պատասխանում է նախագծի սեփականատերը։",
  },
  "interests.errOwnerOnly": {
    ru: "Ответить на предложение может только владелец проекта.",
    en: "Only the project's owner can answer this offer.",
    hy: "Առաջարկին կարող է պատասխանել միայն նախագծի սեփականատերը։",
  },
  "interests.errNotFound": { ru: "Предложение не найдено.", en: "Offer not found.", hy: "Առաջարկը չի գտնվել։" },
  "interests.errNoSlots": {
    ru: "В этом пакете не осталось свободных слотов.",
    en: "This package has no free slots left.",
    hy: "Այս փաթեթում ազատ տեղեր չեն մնացել։",
  },
  "interests.eventApplication": { ru: "Предложение бренда", en: "Brand offer", hy: "Բրենդի առաջարկ" },
  "interests.confirmAccept": { ru: "Принять предложение?", en: "Accept this offer?", hy: "Ընդունե՞լ առաջարկը" },
  "interests.confirmDecline": { ru: "Отклонить предложение?", en: "Decline this offer?", hy: "Մերժե՞լ առաջարկը" },
  "interests.notePlaceholder": {
    ru: "Бренд увидит это сообщение",
    en: "The brand will see this message",
    hy: "Բրենդը կտեսնի այս հաղորդագրությունը",
  },
  "interests.cancel": { ru: "Отмена", en: "Cancel", hy: "Չեղարկել" },
  "interests.eventResponse": { ru: "Ответ", en: "Answer", hy: "Պատասխան" },
  // Which of the two an application names (2026-07-29) — Interest can carry a
  // placementId OR a tierId, never neither's label at once; wording matches
  // report.placementsTitle / apply.tierLabel so the same offer reads the same
  // everywhere.
  "interests.packagePlacement": { ru: "Продакт-плейсмент", en: "Product placement", hy: "Փրոդակթ փլեյսմենթ" },
  "interests.packageSponsorship": { ru: "Спонсорский пакет", en: "Sponsorship package", hy: "Հովանավորության փաթեթ" },

  // ── creator: submission form fields ──
  "account.form.submit": { ru: "Отправить на модерацию", en: "Submit for review", hy: "Ուղարկել մոդերացիայի" },
  /* The link above the form. It is a PATH, not an action: it goes to the
     cabinet dashboard, which is why it no longer says "Cancel" — that word
     sat here and on the bar button at the same time, and on a form that
     autosaves a draft it cancelled nothing (owner report 2026-08-11).
     account.form.cancel is left in place unused rather than deleted: dropping
     a key can silently discard a translator's pending draft for it. */
  "account.form.backToCabinet": {
    ru: "В кабинет",
    en: "Back to cabinet",
    hy: "Դեպի անձնական էջ",
  },
  "account.form.cancel": { ru: "Отмена", en: "Cancel", hy: "Չեղարկել" },
  /* Shown on the creator's edit page once the project is APPROVED: it is live
     in the catalog, so further edits go through staff (2026-08-07). */
  "account.form.approvedLocked": {
    ru: "Проект опубликован, поэтому правки вносит редакция.",
    en: "This project is published, so edits are made by the editors.",
    hy: "Նախագիծը հրապարակված է, ուստի փոփոխությունները կատարում է խմբագրությունը։",
  },
  "account.form.approvedLockedCta": {
    ru: "Написать нам",
    en: "Contact us",
    hy: "Գրել մեզ",
  },
  "account.form.errApproved": {
    ru: "Проект уже опубликован — правки вносит редакция.",
    en: "This project is already published — edits are made by the editors.",
    hy: "Նախագիծն արդեն հրապարակված է — փոփոխությունները կատարում է խմբագրությունը։",
  },
  "account.form.errRequired": {
    ru: "Заполните название, синопсис и минимум один жанр.",
    en: "Fill in the title, synopsis, and at least one genre.",
    hy: "Լրացրեք անվանումը, սինոպսիսը և առնվազն մեկ ժանր։",
  },
  "account.form.errCode": {
    ru: "Не удалось сгенерировать уникальный код проекта — попробуйте ещё раз.",
    en: "Could not generate a unique project code — please retry.",
    hy: "Չհաջողվեց ստեղծել նախագծի եզակի կոդ. խնդրում ենք կրկին փորձել։",
  },
  "account.form.errPosterPrompt": {
    ru: "Введите описание для постера.",
    en: "Prompt is required.",
    hy: "Անհրաժեշտ է նկարագրություն։",
  },
  "account.form.errPosterFailed": {
    ru: "Не удалось сгенерировать постер. Попробуйте позже.",
    en: "Poster generation failed. Please try again later.",
    hy: "Չհաջողվեց ստեղծել պաստառը։ Փորձեք ավելի ուշ։",
  },
  "account.form.errPosterLimit": {
    ru: "Достигнут дневной лимит генераций. Попробуйте завтра.",
    en: "Daily generation limit reached. Please try again tomorrow.",
    hy: "Օրական սահմանաչափը սպառված է։ Փորձեք վաղը։",
  },
  // ── Publish-time requirements (owner decision 2026-07-26) ──
  // A missing required field blocks publication, never the save — see
  // publishBlockers() in admin/(panel)/projects/form-shared.ts.
  "publish.blocked": {
    ru: "Проект нельзя опубликовать, пока не заполнено:",
    en: "This project can't be published until you fill in:",
    hy: "Նախագիծը հնարավոր չէ հրապարակել, քանի դեռ լրացված չէ․",
  },
  "publish.blockedHint": {
    ru: "Снимите галочку «Активен», чтобы сохранить как черновик.",
    en: "Untick “Active” to save it as a draft instead.",
    hy: "Հանեք «Ակտիվ» նշումը՝ որպես սևագիր պահելու համար։",
  },
  "publish.blockedSubmit": {
    ru: "Проект нельзя отправить на модерацию, пока не заполнено:",
    en: "This project can't be submitted for review until you fill in:",
    hy: "Նախագիծը հնարավոր չէ ուղարկել մոդերացիայի, քանի դեռ լրացված չէ․",
  },
  "publish.blockedApprove": {
    ru: "Проект нельзя опубликовать — создатель не заполнил:",
    en: "This project can't be published — the creator hasn't filled in:",
    hy: "Նախագիծը հնարավոր չէ հրապարակել — ստեղծողը չի լրացրել․",
  },
  "publish.missing.studio": { ru: "Студия", en: "Studio", hy: "Ստուդիա" },
  // publish.missing.releaseDate was removed 2026-08-01 (IA-42) — release date
  // is no longer a publish requirement (it must stay optional and support an
  // imprecise year/month-only value).
  "publish.missing.tagline": {
    ru: "Короткое описание (логлайн)",
    en: "Short description (logline)",
    hy: "Կարճ նկարագրություն (լոգլայն)",
  },
  "publish.missing.duration": { ru: "Длительность", en: "Duration", hy: "Տևողություն" },
  "publish.missing.episodes": {
    ru: "Количество серий и хронометраж серии",
    en: "Episode count and minutes per episode",
    hy: "Սերիաների քանակը և սերիայի տևողությունը",
  },
  "publish.missing.tiers": {
    ru: "Хотя бы один спонсорский пакет",
    en: "At least one sponsorship package",
    hy: "Առնվազն մեկ հովանավորության փաթեթ",
  },
  "publish.missing.tierBenefits": {
    ru: "Описание (что входит) у каждого спонсорского пакета",
    en: "A description of what's included for every sponsorship package",
    hy: "Յուրաքանչյուր փաթեթի նկարագրությունը (ինչ է ներառված)",
  },
  "account.form.errTitleRequired": {
    ru: "Введите название хотя бы на одном языке.",
    en: "Enter a title in at least one language.",
    hy: "Մուտքագրեք վերնագիրը գոնե մեկ լեզվով։",
  },
  "account.form.errGenreRequired": {
    ru: "Укажите хотя бы один жанр.",
    en: "Genre is required.",
    hy: "Անհրաժեշտ է նշել առնվազն մեկ ժանր։",
  },
  "account.form.errSynopsisRequired": {
    ru: "Введите синопсис хотя бы на одном языке.",
    en: "Enter a synopsis in at least one language.",
    hy: "Մուտքագրեք սինոպսիսը գոնե մեկ լեզվով։",
  },
  // Release date shape/range checks (IA-42 review finding, 2026-08-02) — a
  // <input type="month"> that degraded to free text (desktop Firefox/Safari
  // don't implement it), or a crafted request, could otherwise reach the DB
  // unchecked. See validateReleaseDateValue in form-shared.ts.
  "account.form.errReleaseDateShape": {
    ru: "Дата релиза не соответствует выбранной точности (точная дата / месяц и год / год).",
    en: "Release date doesn't match the selected precision (exact date / month & year / year).",
    hy: "Թողարկման ամսաթիվը չի համապատասխանում ընտրված ճշգրտությանը (ճշգրիտ ամսաթիվ / ամիս և տարի / տարի)։",
  },
  "account.form.errReleaseDateRange": {
    ru: "Год релиза должен быть между {min} и {max}.",
    en: "Release year must be between {min} and {max}.",
    hy: "Թողարկման տարին պետք է լինի {min}-ի և {max}-ի միջև։",
  },

  // ── creator: project submission form — full ProjectForm chrome (#15) ──
  // Only consulted when ProjectForm renders with mode="creator"; in admin
  // mode the form's own `t` is pinned to "en", so these en values below must
  // stay byte-identical to the strings the admin form used to hardcode.
  "projectForm.draftFound": {
    ru: "У вас есть несохранённый черновик с прошлого раза.",
    en: "You have an unsaved draft from a previous session.",
    hy: "Դուք ունեք չպահպանված սևագիր նախորդ անգամից։",
  },
  "projectForm.restoreDraft": { ru: "Восстановить черновик", en: "Restore draft", hy: "Վերականգնել սևագիրը" },
  "projectForm.discardDraft": { ru: "Отклонить", en: "Discard", hy: "Մերժել" },
  // Sticky Save bar's dirty-state dot (admin redesign, phase 2).
  // Leave-guard dialog: shown when a nav link is clicked with unsaved edits.
  "projectForm.leaveTitle": {
    ru: "Изменения не сохранены",
    en: "You have unsaved changes",
    hy: "Փոփոխությունները պահպանված չեն",
  },
  "projectForm.leaveMessage": {
    ru: "Если уйти сейчас, правки будут потеряны.",
    en: "If you leave now, your edits will be lost.",
    hy: "Եթե հիմա հեռանաք, խմբագրումները կկորչեն։",
  },
  "projectForm.leaveSave": { ru: "Сохранить и выйти", en: "Save and leave", hy: "Պահպանել և դուրս գալ" },
  "projectForm.leaveDiscard": { ru: "Выйти без сохранения", en: "Leave without saving", hy: "Դուրս գալ առանց պահպանելու" },
  "projectForm.leaveStay": { ru: "Остаться", en: "Stay on this page", hy: "Մնալ այս էջում" },
  "projectForm.unsavedChanges": {
    ru: "Есть несохранённые изменения",
    en: "Unsaved changes",
    hy: "Կան չպահպանված փոփոխություններ",
  },
  "projectForm.saved": { ru: "Сохранено", en: "Saved", hy: "Պահպանված է" },
  // Screen-reader name of the jump-to-section strip in the sticky bar.
  "projectForm.sectionNav": {
    ru: "Разделы формы",
    en: "Form sections",
    hy: "Ձևի բաժինները",
  },
  "projectForm.section.general": { ru: "Общее", en: "General", hy: "Ընդհանուր" },
  // ── About block (#11) ──
  "projectForm.section.about": { ru: "О проекте", en: "About", hy: "Նախագծի մասին" },
  "projectForm.about.title": { ru: "Название", en: "Title", hy: "Վերնագիր" },
  // Example title, not a real project — the field's own placeholder used to
  // just repeat the label ("Title"), which reads as blank at a glance (owner
  // screenshot, #20 placeholder audit).
  "projectForm.about.titlePlaceholder": {
    ru: "Тайна старого моста",
    en: "The Old Bridge Mystery",
    hy: "Հին կամրջի առեղծվածը",
  },
  "projectForm.about.description": { ru: "Описание", en: "Description", hy: "Սինոփսիս/Նկարագրություն" },
  "projectForm.about.descriptionPlaceholder": {
    ru: "Опишите проект…",
    en: "Describe the project…",
    hy: "Նկարագրեք նախագիծը…",
  },
  "projectForm.about.richHint": {
    ru: "Разметка: **жирный**, *курсив*, [текст](https://ссылка), переносы строк.",
    en: "Formatting: **bold**, *italic*, [text](https://link), line breaks.",
    hy: "Ձևաչափում՝ **թավ**, *շեղ*, [տեքստ](https://հղում), նոր տողեր։",
  },
  "projectForm.about.shortDescription": { ru: "Краткое описание", en: "Short description", hy: "Կարճ նկարագրություն" },
  "projectForm.about.shortDescriptionPlaceholder": {
    ru: "Слоган в одну строку",
    en: "One-line logline / slogan",
    hy: "Մեկ տողանոց կարգախոս",
  },
  "projectForm.about.charsLeft": { ru: "символов осталось", en: "characters left", hy: "նիշ մնաց" },
  // ── Video (#10) ──
  "projectForm.field.videoEmbed": {
    ru: "Ссылка на видео (YouTube / Vimeo)",
    en: "Video link (YouTube / Vimeo)",
    hy: "Վիդեոյի հղում (YouTube / Vimeo)",
  },
  "projectForm.videoEmbedPlaceholder": {
    ru: "https://youtube.com/watch?v=… / https://vimeo.com/…",
    en: "https://youtube.com/watch?v=… / https://vimeo.com/…",
    hy: "https://youtube.com/watch?v=… / https://vimeo.com/…",
  },
  "projectForm.field.videoFile": { ru: "Видеофайл (MP4)", en: "Video file (MP4)", hy: "Վիդեոֆայլ (MP4)" },
  "projectForm.video.tabEmbed": { ru: "Ссылка (Embed)", en: "Video link", hy: "Հղում (Embed)" },
  "projectForm.video.tabUpload": { ru: "Загрузить MP4", en: "Upload MP4", hy: "Վերբեռնել MP4" },
  // Admin redesign phase 1: renamed from "Press-kit details" — this section
  // is now just poster/gallery/video (Comparable titles moved out to its own
  // "Reference Projects" section).
  // Holds the poster, the gallery, the video AND the presentation deck, so
  // "Design" sent anyone hunting for the PDF upload straight past it — the
  // owner reported not being able to find that field at all on 2026-08-05.
  // The section id has always been `sec-media`; the label now agrees with it.
  "projectForm.section.pressKit": { ru: "Медиа", en: "Media", hy: "Մեդիա" },
  "projectForm.section.castCrew": { ru: "Актёры и съёмочная группа", en: "Cast & crew", hy: "Դերասաններ և թիմ" },
  // Two different things, and the form used to call the sponsorship one
  // "Placement(s)" (owner correction 2026-07-28). Sponsorship sells the logo:
  // promo materials, credits, premiere invitations. A placement puts the brand
  // inside the story itself, and lives in its own section above sponsors.
  "projectForm.section.sponsorshipTiers": { ru: "Спонсоры", en: "Sponsors", hy: "Հովանավորներ" },
  "projectForm.section.placements": { ru: "Продакт-плейсмент", en: "Placements", hy: "Փլեյսմենթներ" },
  "projectForm.section.visibility": { ru: "Видимость", en: "Visibility", hy: "Տեսանելիություն" },
  // IA-44 (2026-08-05): every project starts with the standard three positions,
  // and an existing project can be topped up with whatever it is missing.
  "projectForm.offers.addDefaultSet": {
    ru: "Добавить стандартный набор",
    en: "Add the standard set",
    hy: "Ավելացնել ստանդարտ հավաքածուն",
  },
  // IA-44 §1 (2026-08-05): an optional sales deck brands can download.
  "projectForm.presentation": { ru: "Презентация (PDF)", en: "Presentation (PDF)", hy: "Պրեզենտացիա (PDF)" },
  "projectForm.presentationHint": {
    ru: "Необязательно. PDF до 20 МБ — бренд сможет скачать его со страницы проекта.",
    en: "Optional. A PDF up to 20 MB — brands can download it from the project page.",
    hy: "Ըստ ցանկության։ PDF՝ մինչև 20 ՄԲ. բրենդը կարող է ներբեռնել այն նախագծի էջից։",
  },
  "report.downloadPresentation": {
    ru: "Скачать презентацию",
    en: "Download presentation",
    hy: "Ներբեռնել պրեզենտացիան",
  },
  // New sections (admin redesign phase 1): Production Info holds
  // status/timeline/where-it-plays fields moved out of the old Status&release
  // and Placement cards; Reference Projects is the "Comparable titles" field,
  // pulled out of Design into its own section.
  "projectForm.section.production": { ru: "Производство", en: "Production Info", hy: "Արտադրություն" },
  "projectForm.section.references": { ru: "Похожие проекты", en: "Reference Projects", hy: "Նմանատիպ նախագծեր" },
  "projectForm.field.genre": { ru: "Жанр *", en: "Genre *", hy: "Ժանր *" },
  "projectForm.genresPlaceholder": { ru: "Выберите жанры…", en: "Select genres…", hy: "Ընտրեք ժանրերը…" },
  "projectForm.uploadPoster": { ru: "Загрузить постер", en: "Upload poster", hy: "Վերբեռնել պաստառը" },
  "projectForm.or": { ru: "или", en: "or", hy: "կամ" },
  "projectForm.uploadGalleryImages": { ru: "Загрузить изображения галереи", en: "Upload gallery images", hy: "Վերբեռնել պատկերասրահի նկարները" },
  // Design section cards (owner request 2026-07-30 — "разделы не отличаются"):
  // poster/gallery/video each got a heading (bigger than a normal field
  // label) plus one line saying where the asset is actually seen, so the
  // three upload zones stop reading as duplicates of each other.
  "projectForm.media.posterHeading": { ru: "Постер", en: "Poster", hy: "Պաստառ" },
  "projectForm.media.posterHint": {
    ru: "Главное изображение — показывается в каталоге (16:9).",
    en: "The main image — shown in the catalog (16:9).",
    hy: "Հիմնական պատկերը՝ ցուցադրվում է կատալոգում (16:9)։",
  },
  "projectForm.media.galleryHeading": { ru: "Галерея / кадры", en: "Gallery / stills", hy: "Պատկերասրահ / կադրեր" },
  "projectForm.media.galleryHint": {
    ru: "До 5 штук — показываются лентой на странице проекта.",
    en: "Up to 5 — shown as a strip on the project page.",
    hy: "Մինչև 5 հատ՝ ցուցադրվում է շերտով նախագծի էջում։",
  },
  "projectForm.media.videoHeading": { ru: "Видео", en: "Video", hy: "Տեսանյութ" },
  "projectForm.media.videoHint": {
    ru: "Трейлер — ссылка или файл MP4.",
    en: "Trailer — a link or an MP4 file.",
    hy: "Թրեյլեր՝ հղում կամ MP4 ֆայլ։",
  },
  // Distinct from the generic "btn.browse" (shared with profile photo /
  // offer image / reference thumbnail pickers elsewhere): here it specifically
  // opens the shared media LIBRARY to reuse an already-uploaded file, as
  // opposed to the drop zone right above it, which uploads a NEW one — the
  // two were being read as duplicate controls (owner report 2026-07-30).
  "projectForm.media.browseLibrary": { ru: "Из медиатеки", en: "From media library", hy: "Մեդիագրադարանից" },
  // Renamed from "Kind" (admin redesign phase 1) — the Format Category
  // dropdown that used to own this label was removed, so "Format" is free.
  // "Type" is Single vs Series — it decides which runtime fields the form
  // shows. It used to be labelled "Format", which collided with the real
  // Format field below (the one the catalog filters by) and made the admin
  // look like it only offered two formats.
  "projectForm.field.kind": { ru: "Тип", en: "Type", hy: "Տեսակ" },
  "projectForm.field.formatCategory": { ru: "Формат", en: "Format", hy: "Ձևաչափ" },
  "projectForm.field.formatCategoryNotSet": { ru: "Не указан", en: "Not set", hy: "Նշված չէ" },
  "projectForm.kindFilm": { ru: "Одиночный", en: "Single", hy: "Առանձին" },
  "projectForm.kindSerial": { ru: "Сериал", en: "Series", hy: "Շարք" },
  "projectForm.field.episodes": { ru: "Кол-во серий *", en: "Episodes *", hy: "Սերիաների քանակ *" },
  "projectForm.field.episodeMinutes": { ru: "Хронометраж серии (мин) *", en: "Minutes per episode *", hy: "Սերիայի տևողությունը (րոպե) *" },
  // Ф2: FILM-only counterpart of episodes/episodeMinutes — same slot, Single only.
  "projectForm.field.durationMinutes": { ru: "Длительность (мин) *", en: "Duration (min) *", hy: "Տևողություն (րոպե) *" },
  // Box office (gross receipts) was removed on 2026-07-27 — the figure is not
  // part of what a brand buys. Production budget is what the CSV schema calls
  // "Budget" and stays.
  "projectForm.field.productionBudget": {
    ru: "Бюджет производства (драм, необязательно)",
    en: "Production budget (AMD, optional)",
    hy: "Արտադրության բյուջե (դրամ, ոչ պարտադիր)",
  },
  "projectForm.field.studio": {
    ru: "Название студии",
    en: "Studio name",
    hy: "Ստուդիայի անվանումը",
  },
  "projectForm.studioPlaceholder": {
    ru: "Kinodaran, Sharm…",
    en: "Kinodaran, Sharm…",
    hy: "Kinodaran, Sharm…",
  },
  // "Production stage" (projectForm.field.status / .help.status) and its option
  // labels were removed from both editors on 2026-07-26; the Project.status
  // column itself (and the report.status.*/catalog.status keys that showed it
  // to visitors) was dropped entirely on 2026-07-31 (owner decision) — the
  // production-stage concept is gone from the product, not just the editors.
  "projectForm.help.placementDeadline": {
    ru: "Последняя дата, когда бренд может подать заявку на размещение — после неё монтаж закрыт.",
    en: "Last date a brand can apply for a placement — after this the shoot / edit is locked.",
    hy: "Վերջին ամսաթիվը, երբ բրենդը կարող է դիմել տեղադրման համար — դրանից հետո մոնտաժը փակ է։",
  },
  "projectForm.help.availableOn": {
    ru: "Стриминги / онлайн-площадки, где идёт фильм. Показывается брендам и работает в фильтре каталога.",
    en: "Streaming / online platforms where the film is watchable. Shown to brands and used by the catalog filter.",
    hy: "Սթրիմինգ / առցանց հարթակներ, որտեղ ֆիլմը հասանելի է։ Ցուցադրվում է բրենդներին և օգտագործվում կատալոգի զտիչում։",
  },
  "projectForm.field.availableOn": { ru: "Где смотреть", en: "Available on", hy: "Հասանելի է" },
  "projectForm.availableOnPlaceholder": { ru: "Kinodaran, YouTube, TV…", en: "Kinodaran, YouTube, TV…", hy: "Kinodaran, YouTube, TV…" },
  "projectForm.field.countries": {
    ru: "Страны происхождения контента",
    en: "Content Original Countries",
    hy: "Բովանդակության ծագման երկրները",
  },
  "projectForm.countriesPlaceholder": {
    ru: "Выберите страны…",
    en: "Pick countries…",
    hy: "Ընտրեք երկրները…",
  },
  "projectForm.field.applicationDeadline": { ru: "Дедлайн размещения", en: "Placement deadline", hy: "Տեղադրման վերջնաժամկետ" },
  // Ongoing (IA-42, 2026-08-01): an open-ended call for offers, no concrete
  // date — for the projects that simply never close (a season pass, an
  // always-open catalog title). Checking it hides the date input entirely,
  // same pattern as the video source tabs above.
  "projectForm.field.deadlineOngoing": {
    ru: "Бессрочно (без конкретной даты)",
    en: "Ongoing (no fixed date)",
    hy: "Ընթացիկ (առանց կոնկրետ ամսաթվի)",
  },
  "projectForm.field.releaseDate": { ru: "Дата релиза", en: "Release date", hy: "Թողարկման ամսաթիվ" },
  // Precision picker (IA-42): the editor may not know — or the site may not
  // publicize — the exact release day, only the year or the month it falls
  // in. Whichever is picked decides which input shows and how the date
  // renders everywhere else; the site never invents the missing part.
  "projectForm.releasePrecision.day": { ru: "Точная дата", en: "Exact date", hy: "Ճշգրիտ ամսաթիվ" },
  "projectForm.releasePrecision.month": { ru: "Месяц и год", en: "Month & year", hy: "Ամիս և տարի" },
  "projectForm.releasePrecision.year": { ru: "Только год", en: "Year only", hy: "Միայն տարի" },
  "projectForm.releaseYearPlaceholder": { ru: "2027", en: "2027", hy: "2027" },
  // projectForm.field.streamingSource / .streamingSourcePlaceholder removed
  // 2026-08-04 together with the Project.streamingSource column. The field was
  // merged into "Available on" (platforms) back in #29 and the keys had been
  // orphaned since; leaving them in only gives the translator dead strings to
  // maintain in three languages. The StreamingSource dictionary table itself
  // is untouched — it still feeds the platforms picker.
  "projectForm.field.ageRating": { ru: "Возрастной рейтинг (значок на постере)", en: "Age rating (poster badge)", hy: "Տարիքային սահմանափակում (նշան պաստառի վրա)" },
  // The empty option used to render as a bare "—" (a <select> can't take a
  // placeholder) — indistinguishable from a rendering glitch (#20 placeholder
  // audit). Spelled out instead; the stored value stays "" either way.
  "projectForm.field.ageRatingNotSet": { ru: "Не указан", en: "Not set", hy: "Նշված չէ" },
  "projectForm.field.tagline": {
    ru: "Слоган (одна строка, показывается в шапке)",
    en: "Tagline / logline (one line, shown in the hero)",
    hy: "Լոգլայն/Կարգախոս",
  },
  "projectForm.taglinePlaceholder": {
    ru: "Звезда рождается — и у славы есть цена.",
    en: "A star is born — and fame has a price.",
    hy: "Աստղը ծնվում է, և փառքն ունի իր գինը։",
  },
  // Ф2: repeatable Reference Projects editor (replaces the single
  // comma-separated input above, which is now unused).
  "projectForm.field.referenceName": { ru: "Название", en: "Title", hy: "Վերնագիր" },
  // Same example used by the retired comma-separated field above
  // (referencesPlaceholder) — a recognizable title, not a restatement of the
  // "Title" label (#20 placeholder audit).
  "projectForm.field.referenceNamePlaceholder": { ru: "Богемская рапсодия", en: "Bohemian Rhapsody", hy: "Bohemian Rhapsody" },
  "projectForm.field.referenceUrl": { ru: "Ссылка / URL изображения", en: "Link/image URL", hy: "Հղում / նկարի URL" },
  "projectForm.field.referenceUrlPlaceholder": {
    ru: "https://imdb.com/title/…",
    en: "https://imdb.com/title/…",
    hy: "https://imdb.com/title/…",
  },
  // A past project can also carry an uploaded still or clip, not just a link
  // (the customer's CSV schema allowed either; only the link half existed).
  "projectForm.field.referenceMedia": { ru: "Фото / видео", en: "Photo / video", hy: "Լուսանկար / տեսանյութ" },
  "projectForm.addReference": { ru: "Добавить проект", en: "Add reference", hy: "Ավելացնել նախագիծ" },
  "projectForm.referencesEmpty": {
    ru: "Пока нет похожих проектов.",
    en: "No reference projects yet.",
    hy: "Դեռ նմանատիպ նախագծեր չկան։",
  },
  // Ф4/#27: repeatable Production Timeline editor (per-project horizontal
  // timeline on the report page). Labels are free-text Armenian.
  "projectForm.section.milestones": { ru: "Ход производства", en: "Production Timeline", hy: "Փրոդուկցիայի ընթաց" },
  "projectForm.milestones.stage": { ru: "этап", en: "stage", hy: "փուլ" },
  "projectForm.milestones.stages": { ru: "этап(ов)", en: "stages", hy: "փուլ" },
  "projectForm.milestones.addStage": { ru: "Добавить этап", en: "Add stage", hy: "Ավելացնել փուլ" },
  "projectForm.milestones.empty": {
    ru: "Пока нет этапов производства.",
    en: "No production stages yet.",
    hy: "Դեռ փուլեր չկան։",
  },
  "projectForm.milestones.label": { ru: "Этап", en: "Stage", hy: "Փուլ" },
  "projectForm.milestones.labelPlaceholder": { ru: "Препродакшн", en: "Pre-production", hy: "Պրեպրոդակշն" },
  "projectForm.milestones.date": { ru: "Дата", en: "Date", hy: "Ամսաթիվ" },
  "projectForm.milestones.note": { ru: "Заметка", en: "Note", hy: "Նշում" },
  "projectForm.milestones.notePlaceholder": { ru: "Съёмки в Ереване", en: "Filming in Yerevan", hy: "Նկարահանումներ Երևանում" },
  "projectForm.milestones.current": { ru: "Текущий", en: "Current", hy: "Ընթացիկ" },
  "report.milestones.title": { ru: "Ход производства", en: "Production Timeline", hy: "Փրոդուկցիայի ընթաց" },
  "report.milestones.done": { ru: "Завершено", en: "Done", hy: "Ավարտված" },
  "report.milestones.currentStage": { ru: "Текущий этап", en: "Current stage", hy: "Ընթացիկ փուլ" },
  "report.milestones.upcoming": { ru: "Впереди", en: "Upcoming", hy: "Առջևում" },
  "projectForm.field.cinemas": { ru: "Показ в кинотеатрах", en: "Cinema release", hy: "Կինոթատրոնային ցուցադրում" },
  "projectForm.cinemasPlaceholder": {
    ru: "Cinema Star, Moscow Cinema, Kino Park",
    en: "Cinema Star, Moscow Cinema, Kino Park",
    hy: "Cinema Star, Moscow Cinema, Kino Park",
  },
  "projectForm.activeCheckbox": { ru: "Активен (показывать в каталоге)", en: "Active (show in catalog)", hy: "Ակտիվ է (ցուցադրել կատալոգում)" },
  /* The bar button — what happens to the WORK, as opposed to
     account.form.backToCabinet above the form, which is where you go. Two
     wordings because the form only drafts while creating: on an edit page
     scheduleSaveDraft() returns early, so promising a saved draft there
     would be false. projectForm.cancel stays defined for the ad-space form,
     which has no draft at all. */
  "projectForm.saveDraftAndLeave": {
    ru: "Сохранить черновик и выйти",
    en: "Save draft and leave",
    hy: "Պահել սևագիրը և դուրս գալ",
  },
  "projectForm.leave": { ru: "Выйти", en: "Leave", hy: "Դուրս գալ" },
  "projectForm.cancel": { ru: "Отмена", en: "Cancel", hy: "Չեղարկել" },
  "projectForm.remove": { ru: "Удалить", en: "Remove", hy: "Հեռացնել" },
  "projectForm.cast.member": { ru: "участник", en: "member", hy: "անդամ" },
  "projectForm.cast.members": { ru: "участника", en: "members", hy: "անդամ" },
  "projectForm.cast.addMember": { ru: "Добавить участника", en: "Add member", hy: "Ավելացնել անդամ" },
  "projectForm.cast.empty": { ru: "Пока нет актёров / съёмочной группы.", en: "No cast / crew yet.", hy: "Դեռ դերասաններ / թիմ չկան։" },
  "projectForm.cast.notInDirectory": {
    ru: "Нет в справочнике — выберите из списка, иначе не сохранится.",
    en: "Not in the directory — pick from the list or it won't be saved.",
    hy: "Չկա տեղեկատուում — ընտրեք ցանկից, այլապես չի պահպանվի։",
  },
  /* The creator-side counterpart of notInDirectory above. Same situation, the
     opposite outcome: staff cast is pick-only and an unmatched row is dropped,
     while a creator's unmatched row is saved with the project and simply stays
     local to it (2026-08-07). */
  "projectForm.cast.customPerson": {
    ru: "Нет в справочнике — сохраним как есть, в вашем проекте.",
    en: "Not in the directory — saved as typed, within your project.",
    hy: "Չկա տեղեկատուում — կպահվի ինչպես կա՝ ձեր նախագծում։",
  },
  "projectForm.cast.directoryOwned": {
    ru: "Имя и фото ведёт редакция",
    en: "Name and photo are maintained by the editors",
    hy: "Անունը և լուսանկարը վարում է խմբագրությունը",
  },
  "projectForm.cast.unlinkPerson": {
    ru: "Отвязать",
    en: "Unlink",
    hy: "Անջատել",
  },
  "projectForm.cast.name": { ru: "Имя", en: "Name", hy: "Անուն" },
  "projectForm.cast.namePlaceholder": { ru: "Найдите или введите новое имя…", en: "Search or type a new name…", hy: "Փնտրեք կամ մուտքագրեք նոր անուն…" },
  "projectForm.cast.role": { ru: "Роль", en: "Role", hy: "Դեր" },
  "projectForm.cast.photo": { ru: "Фото", en: "Photo", hy: "Լուսանկար" },
  "projectForm.cast.replacePhoto": { ru: "Заменить фото", en: "Replace photo", hy: "Փոխարինել լուսանկարը" },
  "projectForm.cast.uploadPhoto": { ru: "Загрузить фото", en: "Upload photo", hy: "Վերբեռնել լուսանկարը" },
  "projectForm.tiers.tier": { ru: "пакет", en: "package", hy: "փաթեթ" },
  "projectForm.tiers.tiers": { ru: "пакета", en: "packages", hy: "փաթեթ" },
  "projectForm.tiers.addTier": { ru: "Добавить пакет", en: "Add package", hy: "Ավելացնել փաթեթ" },
  "projectForm.tiers.empty": { ru: "Пока нет спонсорских пакетов.", en: "No sponsorship packages yet.", hy: "Դեռ հովանավորության փաթեթներ չկան։" },
  "projectForm.tiers.namePlaceholder": { ru: "Официальный спонсор", en: "Official Sponsor", hy: "Պաշտոնական հովանավոր" },
  "projectForm.tiers.price": { ru: "Цена (AMD)", en: "Price (AMD)", hy: "Գին (AMD)" },
  "projectForm.tiers.exclusive": { ru: "Эксклюзив", en: "Exclusive", hy: "Բացառիկ" },
  "projectForm.tiers.exclusiveHint": {
    ru: "Эксклюзивный плейсмент — всегда один слот",
    en: "An exclusive placement is always a single slot",
    hy: "Բացառիկ փլեյսմենթը միշտ մեկ տեղ է",
  },
  "projectForm.tiers.templates": {
    ru: "Готовые пакеты",
    en: "Ready-made packages",
    hy: "Պատրաստի փաթեթներ",
  },
  "projectForm.tiers.copySuffix": { ru: "копия", en: "copy", hy: "կրկնօրինակ" },
  "projectForm.tiers.benefits": { ru: "Преимущества (по одному в строке)", en: "Benefits (one per line)", hy: "Առավելություններ (մեկը՝ մեկ տողում)" },
  // ── product placement (the brand inside the story) ──
  "projectForm.placements.one": { ru: "плейсмент", en: "placement", hy: "փլեյսմենթ" },
  "projectForm.placements.many": { ru: "плейсмента", en: "placements", hy: "փլեյսմենթ" },
  "projectForm.placements.add": { ru: "Добавить плейсмент", en: "Add placement", hy: "Ավելացնել փլեյսմենթ" },
  "projectForm.placements.empty": {
    ru: "Пока нет возможностей для плейсмента.",
    en: "No placement opportunities yet.",
    hy: "Դեռ փլեյսմենթի հնարավորություններ չկան։",
  },
  "projectForm.placements.titlePlaceholder": {
    ru: "Интеграция в сюжет",
    en: "Integration into the story",
    hy: "Ինտեգրում սյուժեի մեջ",
  },
  "projectForm.placements.description": {
    ru: "Что получает бренд (по одному в строке)",
    en: "What the brand gets (one per line)",
    hy: "Ինչ է ստանում բրենդը (մեկը՝ մեկ տողում)",
  },
  "projectForm.placements.image": { ru: "Кадр", en: "Still", hy: "Կադր" },
  // Optional: an offer with no kind picked is still a valid, sellable
  // placement — the storefront just shows no kind chip for it.
  "projectForm.placements.type": {
    ru: "Тип интеграции",
    en: "Integration kind",
    hy: "Ինտեգրման տեսակը",
  },
  "projectForm.placements.typeNotSet": { ru: "Не указан", en: "Not set", hy: "Նշված չէ" },
  // Empty price is not zero — it means the creator hasn't priced this
  // integration, and the storefront says "on request" instead of a number.
  "projectForm.placements.price": { ru: "Цена (AMD)", en: "Price (AMD)", hy: "Գին (AMD)" },
  "projectForm.placements.priceOnRequest": { ru: "По запросу", en: "On request", hy: "Հարցումով" },
  "projectForm.placements.slots": { ru: "Доступно", en: "Available", hy: "Հասանելի" },
  "projectForm.placements.totalSlots": { ru: "Всего", en: "Total", hy: "Ընդամենը" },
  "projectForm.placements.duplicate": { ru: "Дублировать", en: "Duplicate", hy: "Կրկնօրինակել" },
  "projectForm.placements.copySuffix": { ru: "копия", en: "copy", hy: "կրկնօրինակ" },
  "projectForm.placements.remove": { ru: "Удалить", en: "Remove", hy: "Հեռացնել" },

  // ── the offer card editor, shared by placements and sponsorship packages ──
  // Both sections used to be spreadsheet rows; they are now one card per offer,
  // laid out like the card a brand sees on the report page.
  "projectForm.offer.expand": { ru: "Развернуть", en: "Expand", hy: "Բացել" },
  "projectForm.offer.collapse": { ru: "Свернуть", en: "Collapse", hy: "Ծալել" },
  "projectForm.offer.untitled": { ru: "Без названия", en: "Untitled", hy: "Առանց անվան" },
  "projectForm.offer.preview": { ru: "Как на сайте", en: "Site preview", hy: "Ինչպես կայքում" },
  "projectForm.offer.previewHint": {
    ru: "Так эти карточки увидит бренд на странице проекта.",
    en: "This is how a brand sees these cards on the project page.",
    hy: "Այսպես է բրենդը տեսնում այս քարտերը նախագծի էջում։",
  },
  "projectForm.offer.deleteTitle": { ru: "Удалить «{name}»?", en: "Delete “{name}”?", hy: "Ջնջե՞լ «{name}»-ը" },
  "projectForm.offer.deleteMessage": {
    ru: "Заполненные поля и загруженный кадр будут потеряны. Отменить нельзя.",
    en: "The filled fields and the uploaded still will be lost. This cannot be undone.",
    hy: "Լրացված դաշտերը և վերբեռնված կադրը կկորչեն։ Հետարկել հնարավոր չէ։",
  },
  // Price is a two-state field, not an empty box: "on request" is a deliberate
  // offer, and it used to be indistinguishable from a price nobody typed yet.
  "projectForm.offer.priceFixed": { ru: "Указать цену", en: "Set a price", hy: "Նշել գինը" },
  "projectForm.offer.addBullet": { ru: "Добавить пункт", en: "Add item", hy: "Ավելացնել կետ" },
  "projectForm.offer.bulletPlaceholder": {
    ru: "Что получает бренд",
    en: "What the brand gets",
    hy: "Ինչ է ստանում բրենդը",
  },
  "projectForm.offer.bulletEmpty": {
    ru: "Ни одного пункта — бренд не увидит, что входит в предложение.",
    en: "No items yet — the brand can't see what the offer includes.",
    hy: "Դեռ կետեր չկան․ բրենդը չի տեսնի, թե ինչ է ներառում առաջարկը։",
  },
  "projectForm.offer.removeBullet": { ru: "Удалить пункт", en: "Remove item", hy: "Հեռացնել կետը" },
  "projectForm.offer.moveUp": { ru: "Выше", en: "Move up", hy: "Վերև" },
  "projectForm.offer.moveDown": { ru: "Ниже", en: "Move down", hy: "Ներքև" },
  "projectForm.offer.imageHint": {
    ru: "16:9 · рекомендуем 1600×900",
    en: "16:9 · 1600×900 recommended",
    hy: "16:9 · խորհուրդ է տրվում 1600×900",
  },
  "projectForm.offer.noImage": {
    ru: "Без кадра карточка на сайте выглядит пустой",
    en: "Without a still the card on the site looks empty",
    hy: "Առանց կադրի քարտը կայքում դատարկ է թվում",
  },
  "projectForm.offer.crop.title": { ru: "Кадрирование 16:9", en: "Crop to 16:9", hy: "Կադրում 16:9" },
  "projectForm.offer.crop.zoom": { ru: "Масштаб", en: "Zoom", hy: "Մասշտաբ" },
  "projectForm.offer.crop.apply": { ru: "Применить", en: "Apply", hy: "Կիրառել" },
  "projectForm.offer.crop.cancel": { ru: "Отмена", en: "Cancel", hy: "Չեղարկել" },
  "projectForm.offer.crop.hint": {
    ru: "Тяните картинку, колесо — масштаб. В рамку попадёт то, что увидит бренд.",
    en: "Drag the image, scroll to zoom. What's inside the frame is what the brand sees.",
    hy: "Քաշեք նկարը, պտտեք՝ մասշտաբի համար։ Շրջանակի ներսինը տեսնում է բրենդը։",
  },
  "projectForm.tiers.image": { ru: "Кадр пакета", en: "Package still", hy: "Փաթեթի կադր" },


  // ── admin: member registrations ──
  "admin.registrations.colName": { ru: "Имя", en: "Name", hy: "Անուն" },
  "admin.registrations.colEmail": { ru: "Email", en: "Email", hy: "Էլփոստ" },
  "admin.registrations.colRole": { ru: "Роль", en: "Role", hy: "Դեր" },
  // Dual-side accounts (2026-08-11) — the Role column now shows toggleable
  // Creator/Brand badges plus this caption naming how the account originally
  // signed up (role itself no longer says what the member can do).
  "admin.registrations.registeredAs": {
    ru: "Зарегистрирован как",
    en: "Registered as",
    hy: "Գրանցվել է որպես",
  },
  "admin.registrations.colCompany": { ru: "Компания", en: "Company", hy: "Ընկերություն" },
  "admin.registrations.colStatus": { ru: "Статус", en: "Status", hy: "Կարգավիճակ" },
  "admin.registrations.colDate": { ru: "Дата", en: "Date", hy: "Ամսաթիվ" },
  "admin.registrations.approve": { ru: "Одобрить", en: "Approve", hy: "Հաստատել" },
  "admin.registrations.reject": { ru: "Отклонить", en: "Reject", hy: "Մերժել" },
  "admin.registrations.block": { ru: "Заблокировать", en: "Block", hy: "Արգելափակել" },
  "admin.registrations.unblock": { ru: "Разблокировать", en: "Unblock", hy: "Ապաարգելափակել" },
  "admin.registrations.empty": { ru: "Пока нет регистраций.", en: "No registrations yet.", hy: "Դեռ գրանցումներ չկան։" },
  "admin.registrations.statusPending": { ru: "Ожидает", en: "Pending", hy: "Սպասում է" },
  "admin.registrations.statusApproved": { ru: "Одобрен", en: "Approved", hy: "Հաստատված" },
  "admin.registrations.statusRejected": { ru: "Отклонён", en: "Rejected", hy: "Մերժված" },
  "admin.registrations.statusBlocked": { ru: "Заблокирован", en: "Blocked", hy: "Արգելափակված" },

  // ── admin: dashboard (audit 7 — moderator queue card) ──
  "admin.dashboard.moderationQueue": { ru: "Очередь модерации", en: "Moderation queue", hy: "Մոդերացիայի հերթ" },
  "admin.dashboard.pendingReview": { ru: "проектов ожидают проверки", en: "projects pending review", hy: "նախագծեր սպասում են ստուգման" },

  // ── BRAND cabinet (#23, /account/brand/**) ──
  // (sidebar nav Dashboard/Log Out/Browse Projects reuse existing base keys —
  // account.title, account.logout, nav.browseProjects)
  "account.brand.navInterests": { ru: "Мои предложения", en: "My offers", hy: "Իմ առաջարկները" },
  "account.brand.navFavorites": { ru: "Избранное", en: "Favorites", hy: "Նախընտրելի նախագծեր" },
  "account.brand.navProfile": { ru: "Мой профиль", en: "My Profile", hy: "Պրոֆիլի կարգավորումներ" },
  "account.brand.navNotifications": { ru: "Уведомления", en: "Notifications", hy: "Ծանուցումներ" },

  // ── notifications (#25 / V9) — copy rendered from Notification.type+data in
  // the viewer's locale; {brand}/{project}/{creator} are raw data placeholders ──
  "notif.title": { ru: "Уведомления", en: "Notifications", hy: "Ծանուցումներ" },
  "notif.empty": { ru: "Пока нет уведомлений.", en: "No notifications yet.", hy: "Դեռ ծանուցումներ չկան։" },
  "notif.markAllRead": { ru: "Отметить все прочитанными", en: "Mark all as read", hy: "Նշել բոլորը որպես կարդացված" },
  "notif.new": { ru: "Новое", en: "New", hy: "Նոր" },
  "notif.subtitle": { ru: "Все события по вашим проектам и интересам.", en: "Everything happening on your projects and interests.", hy: "Ձեր նախագծերի և հետաքրքրությունների բոլոր իրադարձությունները։" },
  "notif.interest.title": { ru: "Новый интерес", en: "New interest", hy: "Նոր հետաքրքրություն" },
  "notif.interest.body": { ru: "{brand} проявил интерес к проекту «{project}».", en: "{brand} expressed interest in “{project}”.", hy: "{brand}-ը հետաքրքրվեց «{project}» նախագծով։" },
  "notif.submitted.title": { ru: "Новый проект на модерацию", en: "New project for moderation", hy: "Նոր նախագիծ մոդերացիայի համար" },
  "notif.submitted.body": { ru: "{creator} отправил проект «{project}» на проверку.", en: "{creator} submitted “{project}” for review.", hy: "{creator}-ը «{project}» նախագիծն ուղարկեց ստուգման։" },
  "notif.approved.title": { ru: "Проект одобрен", en: "Project approved", hy: "Նախագիծը հաստատված է" },
  "notif.approved.body": { ru: "Проект «{project}» одобрен и опубликован.", en: "“{project}” was approved and published.", hy: "«{project}» նախագիծը հաստատվեց և հրապարակվեց։" },
  "notif.rejected.title": { ru: "Проект отклонён", en: "Project rejected", hy: "Նախագիծը մերժված է" },
  "notif.rejected.body": { ru: "Проект «{project}» отклонён модератором.", en: "“{project}” was rejected by a moderator.", hy: "«{project}» նախագիծը մերժվեց մոդերատորի կողմից։" },
  "notif.rejected.reasonPrefix": { ru: "Причина:", en: "Reason:", hy: "Պատճառը․" },
  // Рекламные места проходят ту же очередь модерации, что и проекты — свои
  // тексты, потому что «проект» в них было бы неправдой (этап 3).
  "notif.spaceSubmitted.title": { ru: "Новое рекламное место", en: "New ad space", hy: "Նոր գովազդային տարածք" },
  "notif.spaceSubmitted.body": {
    ru: "{creator} отправил место «{space}» на проверку.",
    en: "{creator} submitted the space “{space}” for review.",
    hy: "{creator}-ը ուղարկել է «{space}» տարածքը ստուգման։",
  },
  "notif.spaceApproved.title": { ru: "Место одобрено", en: "Ad space approved", hy: "Տարածքը հաստատվեց" },
  "notif.spaceApproved.body": {
    ru: "Место «{space}» опубликовано на сайте.",
    en: "The space “{space}” is now published.",
    hy: "«{space}» տարածքը հրապարակվել է կայքում։",
  },
  "notif.spaceRejected.title": { ru: "Место отклонено", en: "Ad space rejected", hy: "Տարածքը մերժվեց" },
  "notif.spaceRejected.body": {
    ru: "Место «{space}» отправлено на доработку.",
    en: "The space “{space}” was sent back for changes.",
    hy: "«{space}» տարածքը վերադարձվել է լրամշակման։",
  },
  // Favorites / Application feature (2026-07-19)
  "notif.interestApproved.title": { ru: "Заявка одобрена", en: "Application approved", hy: "Հայտը հաստատվեց" },
  "notif.interestApproved.body": { ru: "Ваше предложение по проекту «{project}» принято.", en: "Your offer for “{project}” was accepted.", hy: "«{project}» նախագծի համար ձեր առաջարկն ընդունվեց։" },
  "notif.interestDeclined.title": { ru: "Предложение отклонено", en: "Offer declined", hy: "Առաջարկը մերժվեց" },
  "notif.interestDeclined.body": { ru: "Ваше предложение по проекту «{project}» отклонено.", en: "Your offer for “{project}” was declined.", hy: "«{project}» նախագծի համար ձեր առաջարկը մերժվեց։" },
  "favorite.addAria": { ru: "Добавить в избранное", en: "Add to favorites", hy: "Ավելացնել ընտրյալում" },
  "favorite.removeAria": { ru: "Убрать из избранного", en: "Remove from favorites", hy: "Հեռացնել ընտրյալից" },
  // QA-4: the disabled heart on a visitor's own listing used to keep
  // favorite.addAria, so a screen reader announced an action that could
  // never work on that card.
  "favorite.ownAria": { ru: "Это ваш проект — добавить в избранное нельзя", en: "This is your own project — can't be favorited", hy: "Սա ձեր նախագիծն է՝ ընտրյալում ավելացնել հնարավոր չէ" },
  "apply.title": { ru: "Отправить предложение", en: "Send an offer", hy: "Ուղարկել առաջարկ" },
  "apply.messageLabel": { ru: "Сообщение (необязательно)", en: "Message (optional)", hy: "Հաղորդագրություն (ըստ ցանկության)" },
  "apply.messagePlaceholder": { ru: "Расскажите о вашем интересе к размещению…", en: "Tell us about your placement interest…", hy: "Պատմեք ձեր տեղադրման հետաքրքրության մասին…" },
  // ── Media picker (audit 4.5: the dialog was English-only for members) ──
  "media.chooseImage": { ru: "Выберите изображение", en: "Choose image", hy: "Ընտրեք պատկերը" },
  "media.chooseVideo": { ru: "Выберите видео", en: "Choose video", hy: "Ընտրեք տեսանյութը" },
  "media.chooseFile": { ru: "Выберите файл", en: "Choose file", hy: "Ընտրեք ֆայլը" },
  // Caption inside the image field's drop zone (2026-07-28) — until then the
  // only way to add a file was to open the picker dialog first.
  "media.dropHere": {
    ru: "Перетащите файлы или нажмите, чтобы выбрать",
    en: "Drag and drop or click to upload",
    hy: "Քաշեք ֆայլերը կամ սեղմեք՝ ընտրելու համար",
  },
  "media.dropTitleMany": { ru: "Загрузить файлы", en: "Upload files", hy: "Վերբեռնել ֆայլեր" },
  "media.dropTitleOne": { ru: "Загрузить файл", en: "Upload a file", hy: "Վերբեռնել ֆայլ" },
  // Singular twin of media.dropHere, for the fields that hold exactly one file
  // (project trailer, partner logo, portfolio image).
  "media.dropHereOne": {
    ru: "Перетащите файл или нажмите, чтобы выбрать",
    en: "Drag and drop or click to upload",
    hy: "Քաշեք ֆայլը կամ սեղմեք՝ ընտրելու համար",
  },
  "media.errTooLargeShort": {
    ru: "Файл слишком большой",
    en: "File is too large",
    hy: "Ֆայլը չափազանց մեծ է",
  },
  // Names the zone instead of describing the action: two adjacent "Upload a
  // file" rectangles (poster and gallery) gave no clue which was which.
  "media.dropTitlePoster": { ru: "Загрузить постер", en: "Upload a poster", hy: "Վերբեռնել պաստառ" },
  // Filled state: the file itself becomes the drop zone, these label its overlay.
  "media.replace": { ru: "Заменить", en: "Replace", hy: "Փոխարինել" },
  "media.dropToReplace": {
    ru: "Отпустите, чтобы заменить",
    en: "Drop to replace",
    hy: "Բաց թողեք՝ փոխարինելու համար",
  },
  // Crop step for the square profile pictures (avatar, brand logo). The offer
  // card has its own 16:9 copy under projectForm.offer.crop.* — the ratio is
  // named in the title, so the two can't share one string.
  "media.crop.title": { ru: "Кадрирование фото", en: "Crop the picture", hy: "Նկարի կադրում" },
  "media.crop.zoom": { ru: "Масштаб", en: "Zoom", hy: "Մասշտաբ" },
  "media.crop.apply": { ru: "Применить", en: "Apply", hy: "Կիրառել" },
  "media.crop.cancel": { ru: "Отмена", en: "Cancel", hy: "Չեղարկել" },
  "media.crop.hint": {
    ru: "Тяните картинку, колесо — масштаб. В круг попадёт то, что внутри рамки.",
    en: "Drag the image, scroll to zoom. What's inside the frame is what others see.",
    hy: "Քաշեք նկարը, պտտեք՝ մասշտաբի համար։ Շրջանակի ներսինը տեսնում են մյուսները։",
  },
  "media.addImage": { ru: "Добавить", en: "Add", hy: "Ավելացնել" },
  "media.close": { ru: "Закрыть", en: "Close", hy: "Փակել" },
  "media.all": { ru: "Все", en: "All", hy: "Բոլորը" },
  "media.download": { ru: "Скачать", en: "Download", hy: "Ներբեռնել" },
  "media.loadError": { ru: "Не удалось загрузить медиатеку.", en: "Couldn't load the library.", hy: "Չհաջողվեց բեռնել գրադարանը։" },
  "media.emptyImages": {
    ru: "Изображений пока нет — перетащите файл выше или нажмите на зону загрузки.",
    en: "No images yet — drag a file above, or click the drop zone.",
    hy: "Պատկերներ դեռ չկան — քաշեք ֆայլը վերևում կամ սեղմեք բեռնման տիրույթի վրա։",
  },
  "media.emptyVideos": {
    ru: "Видео пока нет — перетащите файл выше или нажмите на зону загрузки.",
    en: "No videos yet — drag a file above, or click the drop zone.",
    hy: "Տեսանյութեր դեռ չկան — քաշեք ֆայլը վերևում կամ սեղմեք բեռնման տիրույթի վրա։",
  },
  "media.errTooLarge": {
    ru: "«{name}» весит {size} МБ — лимит {limit} МБ.",
    en: "“{name}” is {size} MB — the limit is {limit} MB.",
    hy: "«{name}»-ը {size} ՄԲ է — սահմանաչափը {limit} ՄԲ է։",
  },
  "media.errUploadFailed": {
    ru: "Загрузка не удалась — «{name}» ({size} МБ) отклонён сервером. Попробуйте файл меньше.",
    en: "Upload failed — “{name}” ({size} MB) was rejected by the server. Try a smaller file.",
    hy: "Վերբեռնումը ձախողվեց — «{name}» ({size} ՄԲ) մերժվել է սերվերի կողմից։ Փորձեք ավելի փոքր ֆայլ։",
  },
  "media.errNoFile": { ru: "Файл не выбран.", en: "No file provided.", hy: "Ֆայլ ընտրված չէ։" },
  "media.errTooLargeServer": {
    ru: "Файл слишком большой (максимум {limit} МБ).",
    en: "File too large (max {limit} MB).",
    hy: "Ֆայլը շատ մեծ է (առավելագույնը {limit} ՄԲ)։",
  },
  "media.errUnsupportedVideo": {
    ru: "Неподдерживаемый тип — используйте MP4 или WebM.",
    en: "Unsupported type — use MP4 or WebM.",
    hy: "Չաջակցվող տեսակ — օգտագործեք MP4 կամ WebM։",
  },
  "media.errUnsupportedDoc": {
    ru: "Неподдерживаемый тип — используйте PDF.",
    en: "Unsupported type — use PDF.",
    hy: "Չաջակցվող տեսակ — օգտագործեք PDF։",
  },
  "media.errUnsupportedImage": {
    ru: "Неподдерживаемый тип — используйте JPG, PNG, WebP, GIF или AVIF.",
    en: "Unsupported type — use JPG, PNG, WebP, GIF or AVIF.",
    hy: "Չաջակցվող տեսակ — օգտագործեք JPG, PNG, WebP, GIF կամ AVIF։",
  },
  // One application per brand per project (Interest is unique on that pair), so
  // sending a second one REPLACES the first — including its answer and any slot
  // it had reserved. Harmless while the page had a single apply button; since
  // every offer card got its own (2026-07-29) clicking a second card is the
  // natural gesture, so the popup has to say what it is about to do.
  // Shown only when the offer currently picked already carries an application
  // of this brand's. Since 2026-07-29 an application belongs to ONE offer, so
  // choosing a different placement or package sends a second application and
  // leaves the first alone — the warning follows the picker rather than the
  // project, and says so.
  "apply.replaceWarning": {
    ru: "На это предложение у вас уже есть заявка. Отправка обновит её — ответ создателя не сохранится. Чтобы подать ещё одну заявку, выберите другое предложение.",
    en: "You already have an application for this offer. Sending will update it — the creator's answer will not be kept. To send a separate application, pick a different offer.",
    hy: "Այս առաջարկի համար դուք արդեն ունեք հայտ։ Ուղարկելը կթարմացնի այն — հեղինակի պատասխանը չի պահպանվի։ Առանձին հայտ ներկայացնելու համար ընտրեք այլ առաջարկ։",
  },
  "apply.tierNone": { ru: "Не выбран — обсудим", en: "Not selected — let's discuss", hy: "Ընտրված չէ — կքննարկենք" },
  "apply.tierSoldOut": { ru: "мест нет", en: "no slots left", hy: "տեղեր չկան" },
  // The picker covers BOTH offers since 2026-07-29 — it used to list
  // sponsorship packages only, so a brand that came for an in-story placement
  // had to describe it in prose and the seller had to guess the price.
  "apply.offerLabel": { ru: "На что подаёте заявку", en: "What you are applying for", hy: "Ինչի՞ համար եք դիմում" },
  "apply.offerGroupPlacements": { ru: "Продакт-плейсмент", en: "Product placement", hy: "Փրոդակթ փլեյսմենթ" },
  "apply.offerGroupTiers": { ru: "Спонсорские пакеты", en: "Sponsorship packages", hy: "Հովանավորության փաթեթներ" },
  // Prices in the popup are quoted in the deal currency (AMD). The visitor's
  // own currency is shown as an aside, marked as a rate that moves, so nobody
  // reads "€5 988" as the sum being agreed.
  "apply.approxRate": { ru: "≈ {x} по курсу на сегодня", en: "≈ {x} at today's rate", hy: "≈ {x}՝ այսօրվա փոխարժեքով" },
  // Required since 2026-07-29 (it was the optional one, with the free-text
  // message mandatory — inverted: without the product the seller cannot tell
  // what the offer is even about).
  "apply.productLabel": { ru: "Что размещаем", en: "What is being placed", hy: "Ի՞նչ ենք տեղադրում" },
  "apply.productPlaceholder": { ru: "Товар, услуга или бренд для размещения", en: "Product, service or brand to place", hy: "Ապրանք, ծառայություն կամ բրենդ տեղադրման համար" },
  "apply.messageTooShort": { ru: "Необязательно, но если пишете — минимум {n} символов", en: "Optional, but once you start writing, use at least {n} characters", hy: "Ըստ ցանկության է, բայց եթե գրում եք՝ նվազագույնը {n} նիշ" },
  "apply.productRequiredHint": {
    ru: "Обязательное поле — без этого продавец не поймёт, что вы хотите разместить",
    en: "Required — without this the seller has no idea what you want to place",
    hy: "Պարտադիր դաշտ է․ առանց դրա վաճառողը չի հասկանա, թե ինչ եք ուզում տեղադրել",
  },
  "apply.phoneLabel": { ru: "Телефон", en: "Phone", hy: "Հեռախոս" },
  "apply.phoneInvalid": { ru: "Укажите номер с кодом страны, например +374 XX XXX XXX", en: "Enter the number with its country code, for example +374 XX XXX XXX", hy: "Նշեք համարը երկրի կոդով, օրինակ՝ +374 XX XXX XXX" },
  "apply.submit": { ru: "Отправить предложение", en: "Send offer", hy: "Ուղարկել առաջարկը" },
  "apply.cancel": { ru: "Отмена", en: "Cancel", hy: "Չեղարկել" },
  "apply.success": { ru: "Предложение отправлено", en: "Offer sent", hy: "Առաջարկն ուղարկվեց" },
  // Who answers, and where. Without this the brand waits for the project's
  // creator — who has not been part of this chain since 2026-08-07: an
  // application is worked end to end by the iGovazd team (/admin/interests).
  "apply.successWho": {
    ru: "Заявку принимает команда iGovazd. Ответ придёт в ваш кабинет и на эл. почту.",
    en: "Your application goes to the iGovazd team. The answer will arrive in your account and by email.",
    hy: "Հայտն ընդունում է iGovazd-ի թիմը։ Պատասխանը կստանաք ձեր հաշվում և էլ. փոստով։",
  },
  "apply.error": { ru: "Не удалось отправить предложение. Попробуйте ещё раз.", en: "Could not send the offer. Please try again.", hy: "Չհաջողվեց ուղարկել առաջարկը։ Փորձեք նորից։" },
  "notif.generic.title": { ru: "Уведомление", en: "Notification", hy: "Ծանուցում" },
  "notif.broadcast.title": { ru: "Объявление", en: "Announcement", hy: "Հայտարարություն" },
  "push.title": { ru: "Уведомления", en: "Notifications", hy: "Ծանուցումներ" },
  "push.subtitle": {
    ru: "Получайте push, даже когда сайт закрыт",
    en: "Get push even when the site is closed",
    hy: "Ստացեք push նույնիսկ փակ կայքի դեպքում",
  },
  "push.enable": { ru: "Включить", en: "Enable", hy: "Միացնել" },
  "push.blockedTitle": { ru: "Уведомления заблокированы", en: "Notifications are blocked", hy: "Ծանուցումներն արգելափակված են" },
  "push.blockedBody": {
    ru: "Разрешите уведомления для сайта в настройках браузера — иначе вы не узнаете о новых предложениях.",
    en: "Allow notifications for this site in your browser settings — otherwise you won't hear about new offers.",
    hy: "Թույլատրեք ծանուցումները այս կայքի համար բրաուզերի կարգավորումներում, այլապես չեք իմանա նոր առաջարկների մասին։",
  },

  // ── dashboard ──
  "account.brand.welcomeBack": { ru: "С возвращением, {name}", en: "Welcome back, {name}", hy: "Բարի վերադարձ, {name}" },
  "account.brand.activeInterests": { ru: "Активные интересы", en: "Active Interests", hy: "Ընթացիկ հայտեր" },
  "account.brand.noInterestsTitle": { ru: "Пока нет интересов", en: "No interests yet", hy: "Ակտիվ հայտեր դեռ չկան" },
  "account.brand.noInterestsDashboardBody": {
    ru: "Вы ещё не проявили интерес ни к одному проекту. Просмотрите каталог, чтобы найти возможности.",
    en: "You haven't expressed interest in any projects yet. Browse the catalog to find opportunities.",
    hy: "Դիտարկե՛ք հասանելի նախագծերը և ուղարկե՛ք ձեր առաջին առաջարկը։",
  },
  "account.brand.recommended": { ru: "Рекомендовано для вас", en: "Recommended for You", hy: "Առաջարկվող նախագծեր" },
  "account.brand.recommendedBasedOn": {
    ru: "На основе вашего профиля: {categories}",
    en: "Based on your profile: {categories}",
    hy: "Ըստ ձեր պրոֆիլի՝ {categories}",
  },
  "account.brand.recommendedEmpty": {
    ru: "Заполните профиль бренда, чтобы получать персональные рекомендации.",
    en: "Complete your brand profile to get personalized recommendations.",
    hy: "Ամբողջացրեք Ձեր պրոֆիլը անհատականացված առաջարկներ ստանալու համար։",
  },
  "account.brand.recentlyAdded": { ru: "Недавно добавленные", en: "Recently Added", hy: "Վերջերս ավելացված" },

  // ── my interests ──
  "account.brand.interestsSubtitle": {
    ru: "Проекты, которым вы отправили предложение",
    en: "Projects you have sent an offer to",
    hy: "Ձեր ուղարկած բոլոր առաջարկները մեկ տեղում",
  },
  "account.brand.noInterestsPageBody": {
    ru: "Просмотрите каталог и отправьте предложение проектам, подходящим вашему бренду.",
    en: "Browse the catalog and send an offer to projects that match your brand.",
    hy: "Դիտեք կատալոգը և առաջարկ ուղարկեք ձեր բրենդին համապատասխան նախագծերին։",
  },
  "account.brand.interestStatusSent": { ru: "Отправлено", en: "Sent", hy: "Ուղարկված" },
  // Was "Взаимный интерес" / "Mutual interest" — the name the status carried
  // while MUTUAL meant "the creator expressed interest back". Nobody expresses
  // anything back: staff accept or decline the application (respondToInterest),
  // so the pill now says what actually happened.
  "account.brand.interestStatusMutual": { ru: "Заявка принята", en: "Accepted", hy: "Հայտն ընդունված է" },
  "account.brand.interestStatusDeclined": { ru: "Отклонено", en: "Declined", hy: "Մերժված" },
  "account.brand.interestedOn": { ru: "Интерес проявлен {date}", en: "Interest expressed {date}", hy: "Հետաքրքրությունը հայտնվել է {date}" },

  // ── favorites (#22) ──
  "account.brand.favoritesSubtitle": {
    ru: "Проекты, которые вы сохранили",
    en: "Projects you saved",
    hy: "Ձեր պահպանած մեդիա նախագծերը",
  },
  "account.brand.noFavoritesTitle": { ru: "Пока нет избранного", en: "No favorites yet", hy: "Ցանկը դատարկ է" },
  "account.brand.noFavoritesBody": {
    ru: "Нажмите на сердечко на проекте, чтобы сохранить его сюда.",
    en: "Tap the heart on a project to save it here.",
    hy: "Սեղմեք սրտիկի պատկերակին նախագիծը ցանկում ավելացնելու համար։",
  },
  "account.brand.favoritedOn": { ru: "Сохранено {date}", en: "Saved on {date}", hy: "Պահված է {date}" },

  // ── browse ──
  "account.brand.expressInterestError": {
    ru: "Что-то пошло не так — попробуйте ещё раз.",
    en: "Something went wrong — please try again.",
    hy: "Ինչ-որ բան այն չէ․ փորձեք կրկին։",
  },
  "account.brand.applyNotAvailable": {
    ru: "Этот проект сейчас недоступен для заявок.",
    en: "This project is not open for applications right now.",
    hy: "Այս նախագիծը այս պահին հայտեր չի ընդունում։",
  },
  // Dual-side accounts (2026-08-11) — a member who also sells cannot apply to
  // their own listing. Kept separate from applyNotAvailable: that one means
  // "not for sale", this one means "it's yours".
  "account.brand.selfApplyError": {
    ru: "Нельзя подать заявку на собственный проект.",
    en: "You can't apply to your own project.",
    hy: "Հնարավոր չէ հայտ ուղարկել սեփական նախագծին։",
  },
  "account.brand.applyPhoneRequired": {
    ru: "Укажите телефон с кодом страны, например +374 XX XXX XXX.",
    en: "Enter a phone number with its country code, for example +374 XX XXX XXX.",
    hy: "Նշեք հեռախոսահամարը երկրի կոդով, օրինակ՝ +374 XX XXX XXX։",
  },
  "account.brand.applyTooShort": {
    ru: "Опишите запрос подробнее — минимум 20 символов.",
    en: "Please describe your request in more detail — at least 20 characters.",
    hy: "Նկարագրեք հարցումն ավելի մանրամասն՝ նվազագույնը 20 նիշ։",
  },
  "account.brand.applyProductRequired": {
    ru: "Укажите, что размещаем — товар, услугу или бренд.",
    en: "Say what is being placed — the product, service or brand.",
    hy: "Նշեք, թե ինչ ենք տեղադրում՝ ապրանք, ծառայություն կամ բրենդ։",
  },

  // ── browse filters (4.4) ──
  "account.brand.slotsAvailableOnly": {
    ru: "Только со свободными местами",
    en: "Only with open slots",
    hy: "Միայն ազատ տեղերով",
  },
  "account.brand.filtersToggle": { ru: "Фильтры", en: "Filters", hy: "Ֆիլտրներ" },
  // Unused in code, kept deliberately: the translator has an unpublished draft
  // on it, and deleting the key drops that row out of /admin/i18n silently.
  "account.brand.filtersClose": { ru: "Свернуть фильтры", en: "Hide filters", hy: "Փակել ֆիլտրները" },

  // ── favorites comparison (4.7) ──
  "account.brand.sortLabel": { ru: "Сортировка", en: "Sort by", hy: "Դասավորել" },
  "account.brand.sortAdded": { ru: "Дата добавления", en: "Date added", hy: "Ավելացման ամսաթիվ" },
  "account.brand.sortPriceAsc": { ru: "Цена: сначала дешевле", en: "Price: low to high", hy: "Գին՝ նախ ցածրը" },
  "account.brand.sortDeadline": { ru: "Ближайший дедлайн", en: "Deadline soonest", hy: "Ամենամոտ վերջնաժամկետ" },
  "account.brand.compareTitle": { ru: "Сравнение проектов", en: "Compare projects", hy: "Համեմատել նախագծերը" },
  "account.brand.compareProject": { ru: "Проект", en: "Project", hy: "Նախագիծ" },
  "account.brand.comparePriceFrom": { ru: "Цена от", en: "Price from", hy: "Գինը՝ սկսած" },
  "account.brand.compareSlots": { ru: "Свободные места", en: "Open slots", hy: "Ազատ տեղեր" },
  "account.brand.compareDeadline": { ru: "Дедлайн заявок", en: "Application deadline", hy: "Հայտերի վերջնաժամկետ" },
  "account.brand.compareFormat": { ru: "Формат", en: "Format", hy: "Ձևաչափ" },
  "account.brand.compareNoValue": { ru: "—", en: "—", hy: "—" },

  // ── my profile ──
  "account.brand.profileSubtitle": { ru: "Управляйте профилем бренда", en: "Manage your brand profile", hy: "Կառավարեք ձեր բրենդի պրոֆիլը" },
  "account.brand.accountSection": { ru: "Аккаунт", en: "Account", hy: "Մուտքի տվյալներ" },
  "account.brand.emailReadonlyNote": {
    ru: "Ваш логин — изменить нельзя",
    en: "Your login email — cannot be changed",
    hy: "Ձեր մուտքի էլփոստը չի կարող փոփոխվել։",
  },
  "account.brand.companyDetails": { ru: "Данные компании", en: "Company Details", hy: "Ընկերության տվյալներ" },
  // The brand's picture (2026-08-05). Called a logo, not an avatar: on this
  // side of the cabinet the account is a company, and the creator's own field
  // keeps the "avatar" wording for a person.
  "account.brand.logo": { ru: "Логотип", en: "Logo", hy: "Լոգոն" },
  "account.brand.logoHint": {
    ru: "Квадратное изображение, его увидят создатели рядом с вашей заявкой.",
    en: "A square image — creators see it next to your application.",
    hy: "Քառակուսի պատկեր՝ հեղինակները այն կտեսնեն ձեր հայտի կողքին։",
  },
  "account.brand.website": { ru: "Веб-сайт", en: "Website", hy: "Վեբկայք" },
  "account.brand.websitePlaceholder": { ru: "https://…", en: "https://…", hy: "https://…" },
  "account.brand.websiteInvalid": {
    ru: "Проверьте адрес сайта — должна получиться ссылка на http:// или https://.",
    en: "Check the website address — it must resolve to an http:// or https:// link.",
    hy: "Ստուգեք կայքի հասցեն․ այն պետք է լինի http:// կամ https:// հղում։",
  },
  "account.brand.saveChanges": { ru: "Сохранить изменения", en: "Save Changes", hy: "Պահպանել փոփոխությունները" },
  "account.brand.saved": { ru: "Сохранено", en: "Saved", hy: "Պահպանված է" },
  "account.brand.brandProfileSection": { ru: "Профиль бренда", en: "Brand Profile", hy: "Նախընտրություններ" },
  "account.brand.categories": { ru: "Категории", en: "Categories", hy: "Գործունեության ոլորտ" },
  "account.brand.categoriesHint": {
    ru: "Выберите категории, соответствующие вашему бренду.",
    en: "Tap to add categories that match your brand.",
    hy: "Նշեք Ձեզ համապատասխան ոլորտները անհատականացված առաջարկների համար։",
  },
  "account.brand.budgetSelectPlaceholder": { ru: "Выберите диапазон", en: "Select a range", hy: "Ընտրել միջակայք" },
  "account.brand.yourDataSection": { ru: "Ваши данные", en: "Your data", hy: "Ձեր տվյալները" },
  "account.brand.yourDataBody": {
    ru: "Скачайте JSON-выгрузку вашего профиля и проявленных интересов.",
    en: "Download a JSON export of your brand profile and expressed interests.",
    hy: "Ներբեռնեք ձեր պրոֆիլի և հայտնված հետաքրքրությունների JSON արտահանումը։",
  },
  "account.brand.downloadData": { ru: "Скачать мои данные (JSON)", en: "Download my data (JSON)", hy: "Ներբեռնել իմ տվյալները (JSON)" },
  // ── live publish-gap highlighting in the project form ──────────────────
  "publish.gapNote": {
    ru: "Без этого проект не отправится на модерацию.",
    en: "The project can't be submitted for review without this.",
    hy: "Առանց սրա նախագիծը չի ուղարկվի մոդերացիայի։",
  },
  "publish.missing.poster": { ru: "Постер", en: "Poster", hy: "Պաստառ" },
  "publish.missing.placements": {
    ru: "Хотя бы один продакт-плейсмент",
    en: "At least one product placement",
    hy: "Առնվազն մեկ փրոդակթ փլեյսմենթ",
  },
  "publish.missing.formatCategory": { ru: "Формат", en: "Format", hy: "Ձևաչափ" },
  "publish.missing.deadline": {
    ru: "Дедлайн заявок или отметка «Приём открыт постоянно»",
    en: "An application deadline, or the Ongoing flag",
    hy: "Հայտերի վերջնաժամկետ կամ «Մշտապես բաց է» նշումը",
  },
  "completeness.item.translations": {
    ru: "Переводы на все языки (hy/ru/en)",
    en: "Translations in every language (hy/ru/en)",
    hy: "Թարգմանություններ բոլոր լեզուներով (hy/ru/en)",
  },
  "completeness.item.castPhotos": {
    ru: "Фото актёров и создателей",
    en: "Cast & crew photos",
    hy: "Դերասանների և հեղինակների լուսանկարներ",
  },
  "completeness.item.countries": { ru: "Страны", en: "Countries", hy: "Երկրներ" },
  "completeness.item.placementPricing": {
    ru: "Цены на продакт-плейсмент",
    en: "Product placement pricing",
    hy: "Փրոդակթ փլեյսմենթի գներ",
  },
  // ── /for-creators guide page ──────────────────────────────────────────
  // Label for every link that points AT the guide (how-it-works, the cabinet,
  // the submit form header) — one key so the entry points can't drift apart.
  "forCreators.entryLink": {
    ru: "Что нужно подготовить",
    en: "What you'll need to prepare",
    hy: "Ինչ է պետք նախապատրաստել",
  },
  "forCreators.field.milestones.desc": {
    ru: "Этапы производства — препродакшн, съёмки, монтаж, релиз. Отметьте, на каком этапе проект сейчас: бренду важно понимать, успевает ли он войти в съёмки. Показывается на странице проекта полосой этапов.",
    en: "Production stages — pre-production, shooting, post, release. Mark which one you are on now: a brand needs to know whether it can still get into the shoot. Shown on the project page as a timeline.",
    hy: "Արտադրության փուլերը՝ նախապատրաստում, նկարահանումներ, մոնտաժ, թողարկում։ Նշեք, թե որ փուլում է նախագիծը հիմա. բրենդի համար կարևոր է հասկանալ՝ կհասցնի՞ մտնել նկարահանումներ։ Ցուցադրվում է նախագծի էջում որպես փուլերի շերտ։",
  },
  "forCreators.field.milestones.example": {
    ru: "Съёмки — март 2026, идёт сейчас",
    en: "Shooting — March 2026, in progress",
    hy: "Նկարահանումներ — մարտ 2026, ընթացքի մեջ է",
  },
  "forCreators.hero.eyebrow": { ru: "Создателям", en: "For Creators", hy: "Հեղինակների համար" },
  "forCreators.hero.title": { ru: "Что мы ждём от вашего проекта", en: "What we need from your project", hy: "Ինչ ենք ակնկալում ձեր նախագծից" },
  "forCreators.hero.subtitle": {
    ru: "Полный список данных для витрины, требования к медиа и порядок модерации — до того как вы начнёте заполнять форму.",
    en: "The full list of storefront data, media requirements and the moderation process — before you open the submission form.",
    hy: "Ցուցափեղկի տվյալների ամբողջական ցանկը, մեդիայի պահանջները և մոդերացիայի կարգը՝ նախքան հայտի ձևը լրացնելը։",
  },
  "forCreators.hero.ctaSubmit": { ru: "Подать проект", en: "Submit a project", hy: "Ներկայացնել նախագիծ" },
  "forCreators.hero.ctaPrepare": { ru: "Что нужно подготовить", en: "What to prepare", hy: "Ինչ պետք է պատրաստել" },

  "forCreators.legend.title": { ru: "Три уровня обязательности", en: "Three levels of requirement", hy: "Պարտադրության երեք մակարդակ" },
  "forCreators.legend.subtitle": {
    ru: "Каждое поле в чек-листе ниже помечено одним из трёх уровней — вот что они значат.",
    en: "Every field in the checklist below carries one of these three labels — here's what each one means.",
    hy: "Ստորև՝ ստուգաթերթի յուրաքանչյուր դաշտ նշված է այս երեք մակարդակներից մեկով, ահա թե ինչ են դրանք նշանակում։",
  },

  "forCreators.tier.required.label": { ru: "Обязательно", en: "Required", hy: "Պարտադիր" },
  "forCreators.tier.required.desc": {
    ru: "Без этого поля проект вообще не сохранится — форма откажется его принять.",
    en: "Without this field the project can't even be saved — the form refuses to accept it.",
    hy: "Առանց այս դաշտի նախագիծը չի պահպանվի ընդհանրապես, ձևը կմերժի այն ընդունել։",
  },
  "forCreators.tier.publish.label": { ru: "Нужно для публикации", en: "Required to publish", hy: "Անհրաժեշտ է հրապարակման համար" },
  "forCreators.tier.publish.desc": {
    ru: "Проект сохранится и без этого поля, но не уйдёт на модерацию и не появится в каталоге, пока оно пустое.",
    en: "The project saves fine without this field, but it won't go to moderation or appear in the catalog until it's filled in.",
    hy: "Նախագիծը կպահպանվի առանց այս դաշտի, բայց չի ուղարկվի մոդերացիայի և չի հայտնվի կատալոգում, քանի դեռ այն դատարկ է։",
  },
  "forCreators.tier.optional.label": { ru: "Желательно", en: "Recommended", hy: "Ցանկալի է" },

  "forCreators.steps.title": { ru: "Что подготовить", en: "What to prepare", hy: "Ինչ պատրաստել" },
  "forCreators.steps.subtitle": {
    ru: "Пять шагов от текстов о проекте до того, что вы продаёте бренду. Разверните любой пункт, чтобы увидеть требования и пример.",
    en: "Five steps, from the project's texts to what you're selling a brand. Open any row to see the requirements and an example.",
    hy: "Հինգ քայլ՝ նախագծի տեքստերից մինչև այն, ինչ վաճառում եք բրենդին։ Բացեք ցանկացած կետ՝ պահանջներն ու օրինակը տեսնելու համար։",
  },
  "forCreators.expandAll": { ru: "Развернуть всё", en: "Expand all", hy: "Տեսնել մանրամասն" },
  "forCreators.collapseAll": { ru: "Свернуть всё", en: "Collapse all", hy: "Փակել" },
  "forCreators.exampleLabel": { ru: "Например", en: "Example", hy: "Օրինակ" },

  "forCreators.step.texts.title": { ru: "Тексты о проекте", en: "Texts about the project", hy: "Հիմնական" },
  "forCreators.step.texts.subtitle": {
    ru: "Название, синопсис, логлайн и жанры — на любом из трёх языков, остальные можно добавить позже.",
    en: "Title, synopsis, logline and genres — in any one of the three languages; the rest can be added later.",
    hy: "Վերնագիր, սինոպսիս, կարգախոս և ժանրեր՝ երեք լեզուներից որևէ մեկով, մնացածը կարող եք ավելացնել ավելի ուշ։",
  },
  "forCreators.step.pressKit.title": { ru: "Пресс-кит", en: "Press kit", hy: "Մամուլի հավաքածու" },
  "forCreators.step.pressKit.subtitle": {
    ru: "Постер, галерея кадров и видео — то, что бренд видит первым.",
    en: "Poster, stills gallery and video — the first things a brand sees.",
    hy: "Պաստառ, կադրերի պատկերասրահ և վիդեո՝ այն, ինչ բրենդն առաջինն է տեսնում։",
  },
  "forCreators.step.cast.title": { ru: "Каст и команда", en: "Cast & crew", hy: "Դերասաններ և թիմ" },
  "forCreators.step.cast.subtitle": {
    ru: "Кто снимается и кто снимает — с фото и ролями.",
    en: "Who's on screen and who's behind the camera — with photos and roles.",
    hy: "Ով է նկարահանվում և ով է նկարահանում՝ լուսանկարներով և դերերով։",
  },
  "forCreators.step.production.title": { ru: "Данные о производстве", en: "Production details", hy: "Արտադրության տվյալներ" },
  "forCreators.step.production.subtitle": {
    ru: "Формат, хронометраж, студия, релиз и всё, что описывает проект как продукт.",
    en: "Format, runtime, studio, release and everything that describes the project as a product.",
    hy: "Ձևաչափ, տևողություն, ստուդիա, թողարկում և այն ամենը, ինչ նկարագրում է նախագիծը որպես արտադրանք։",
  },
  "forCreators.step.offer.title": { ru: "Что вы продаёте бренду", en: "What you're selling a brand", hy: "Ինչ եք վաճառում բրենդին" },
  "forCreators.step.offer.subtitle": {
    ru: "Пакеты спонсорства, продакт-плейсменты и референсы — витрина вашего предложения.",
    en: "Sponsorship packages, product placements and references — the storefront of your offer.",
    hy: "Հովանավորության փաթեթներ, փրոդակթ փլեյսմենթներ և նմանատիպ նախագծեր՝ ձեր առաջարկի ցուցափեղկը։",
  },

  "forCreators.field.video.label": { ru: "Видео", en: "Video", hy: "Վիդեո" },
  "forCreators.field.runtime.label": { ru: "Хронометраж", en: "Runtime", hy: "Տևողություն" },

  "forCreators.field.title.desc": {
    ru: "До 191 символа. Заполните хотя бы на одном языке — армянском, русском или английском; остальные можно дописать позже.",
    en: "Up to 191 characters. Fill in at least one of the three languages (Armenian, Russian or English) — the rest can wait.",
    hy: "Առավելագույնը՝ 50 նիշ։",
  },
  "forCreators.field.synopsis.desc": {
    ru: "Длина не ограничена. Поддерживает простую разметку: **жирный**, *курсив*, [текст](ссылка) и переносы строк.",
    en: "No length limit. Supports simple formatting: **bold**, *italic*, [text](link) and line breaks.",
    hy: "Սիմվոլների քանակը սահմանափակված չէ։",
  },
  "forCreators.field.logline.desc": {
    ru: "Одна фраза, строго до 140 символов — показывается в шапке страницы проекта.",
    en: "One sentence, strictly under 140 characters — shown in the project page's hero.",
    hy: "Առավելագույնը` 140 նիշ։",
  },
  "forCreators.field.genres.desc": {
    ru: "Выбирается только из готового списка жанров — добавить свой вариант нельзя.",
    en: "Picked from the fixed genre list only — you can't add a custom one.",
    hy: "Նշեք ժանր(եր)ը հնարավորինս համապատասխան առաջարկներ ստանալու համար։",
  },
  "forCreators.field.poster.desc": {
    ru: "Соотношение 16:9, рекомендуем 1600×900, до 8 МБ, JPG/PNG/WebP/GIF/AVIF. Вертикальный постер будет обрезан по центру до 16:9 — заранее подготовьте горизонтальный кадр.",
    en: "16:9 aspect ratio, 1600×900 recommended, up to 8 MB, JPG/PNG/WebP/GIF/AVIF. A portrait poster gets centre-cropped to 16:9 — prepare a landscape frame ahead of time.",
    hy: "16:9 հարաբերակցություն, խորհուրդ է տրվում 1600×900, մինչև 8 ՄԲ, JPG/PNG/WebP/GIF/AVIF։ Ուղղաձիգ պաստառը կենտրոնից կկտրվի մինչև 16:9 — նախապես պատրաստեք հորիզոնական կադր։",
  },
  "forCreators.field.gallery.desc": {
    ru: "Те же лимиты, что у постера. Можно загрузить несколько кадров — они показываются лентой на странице проекта.",
    en: "Same limits as the poster. You can upload several stills — they're shown as a strip on the project page.",
    hy: "Նույն սահմանափակումները, ինչ պաստառինը։ Կարող եք վերբեռնել մի քանի կադր, որոնք ցուցադրվում են նախագծի էջում շարքով։",
  },
  "forCreators.field.video.desc": {
    ru: "Заполняется одно из двух: ссылка на YouTube или Vimeo (до 191 символа), либо файл MP4/WebM до 50 МБ. Заполнили одно — вторая вкладка обнуляется.",
    en: "Fill in exactly one of the two: a YouTube or Vimeo link (up to 191 characters), or an MP4/WebM file up to 50 MB. Filling one clears the other tab.",
    hy: "Լրացվում է երկուսից միայն մեկը՝ YouTube կամ Vimeo հղում (մինչև 191 նիշ), կամ MP4/WebM ֆայլ մինչև 50 ՄԲ։ Մեկը լրացնելիս մյուս ներդիրը մաքրվում է։",
  },
  "forCreators.field.castPhoto.desc": {
    ru: "Квадратное фото 800×800, обрезка по центру, до 8 МБ.",
    en: "A square 800×800 photo, centre-cropped, up to 8 MB.",
    hy: "Քառակուսի լուսանկար 800×800, կենտրոնից կտրված, մինչև 8 ՄԲ։",
  },
  "forCreators.field.castName.desc": {
    ru: "Без имени строка не сохранится. Поиск идёт по общему справочнику людей — можно вписать и нового человека.",
    en: "A row without a name won't save. Search runs against the shared people directory — you can also type in a new person.",
    hy: "Առանց անվան տողը չի պահպանվի։ Փնտրումը կատարվում է մարդկանց ընդհանուր տեղեկագրով, կարող եք մուտքագրել նաև նոր անձի անուն։",
  },
  "forCreators.field.castRoles.desc": {
    ru: "Мультивыбор из 18 значений. Первая выбранная роль определяет, попадёт человек в «Каст» или в «Команду».",
    en: "Multi-select from 18 values. The first role you pick decides whether the person lands in Cast or in Crew.",
    hy: "Բազմակի ընտրություն՝ 18 արժեքից։ Ընտրված առաջին դերը որոշում է՝ մարդը կհայտնվի «Դերասաններ», թե «Թիմ» բաժնում։",
  },
  "forCreators.field.kind.desc": {
    ru: "Фильм или сериал — от выбора зависит, какие поля хронометража появятся ниже.",
    en: "Film or series — this decides which runtime fields appear below.",
    hy: "Ֆիլմ կամ սերիալ, ընտրությունից է կախված, թե ստորև ինչ տևողության դաշտեր կհայտնվեն։",
  },
  "forCreators.field.runtime.desc": {
    ru: "Для сериала — количество серий и минут в серии; для фильма — общая длительность в минутах.",
    en: "For a series — the number of episodes and minutes per episode; for a film — total runtime in minutes.",
    hy: "Սերիալի համար՝ սերիաների քանակը և րոպեները մեկ սերիայում, ֆիլմի համար՝ ընդհանուր տևողությունը րոպեներով։",
  },
  "forCreators.field.studio.desc": {
    ru: "Название продакшн-студии или компании, выпускающей проект.",
    en: "The name of the production studio or company behind the project.",
    hy: "Նախագիծը թողարկող պրոդակշն ստուդիայի կամ ընկերության անվանումը։",
  },
  "forCreators.field.formatCategory.desc": {
    ru: "Категория для фильтра «Формат» в каталоге. Пусто — проект просто не попадёт в этот фильтр.",
    en: "The bucket used by the catalog's Format filter. Left empty, the project simply won't show up in that filter.",
    hy: "Կատալոգի «Ձևաչափ» զտիչի կատեգորիան։ Եթե դատարկ է, նախագիծը պարզապես չի հայտնվի այդ զտիչում։",
  },
  "forCreators.field.countries.desc": {
    ru: "Страны происхождения контента. Можно выбрать из списка или вписать свою страну.",
    en: "The content's countries of origin. Pick from the list or type your own.",
    hy: "Բովանդակության ծագման երկրները։ Կարող եք ընտրել ցանկից կամ մուտքագրել ձերը։",
  },
  "forCreators.field.ageRating.desc": {
    ru: "Возрастной значок на постере: от 0+ до 18+.",
    en: "The age badge shown on the poster: 0+ through 18+.",
    hy: "Պաստառի վրայի տարիքային նշանը՝ 0+-ից մինչև 18+։",
  },
  "forCreators.field.budget.desc": {
    ru: "Бюджет производства в драмах — необязательное поле.",
    en: "The production budget in AMD — an optional field.",
    hy: "Արտադրության բյուջեն դրամով, ոչ պարտադիր դաշտ։",
  },
  "forCreators.field.releaseDate.desc": {
    ru: "Точность на выбор: точная дата, месяц и год, или только год — сайт никогда не показывает то, что вы не указали.",
    en: "Pick the precision: an exact date, month and year, or year only — the site never shows more than you gave it.",
    hy: "Ընտրեք ճշգրտությունը՝ ճշգրիտ ամսաթիվ, ամիս և տարի, կամ միայն տարի, կայքը երբեք ցույց չի տալիս այն, ինչ չեք նշել։",
  },
  "forCreators.field.deadline.desc": {
    ru: "Либо конкретная дата, до которой бренд может подать заявку, либо флаг «принимаем постоянно» — одно из двух нужно указать явно.",
    en: "Either a concrete date brands can apply until, or the “accepting continuously” flag — one of the two must be set explicitly.",
    hy: "Կամ կոնկրետ ամսաթիվ, մինչև որը բրենդը կարող է դիմել, կամ «ընդունում ենք մշտապես» դրոշը, երկուսից մեկը պետք է հստակորեն նշվի։",
  },
  "forCreators.field.platforms.desc": {
    ru: "Стриминги или онлайн-площадки, где идёт проект. Показывается брендам и работает в фильтре каталога.",
    en: "Streaming or online platforms where the project is watchable. Shown to brands and used by the catalog filter.",
    hy: "Սթրիմինգներ կամ առցանց հարթակներ, որտեղ հասանելի է նախագիծը։ Ցուցադրվում է բրենդներին և աշխատում է կատալոգի զտիչում։",
  },
  "forCreators.field.cinemas.desc": {
    ru: "Кинотеатры, где идёт или шёл показ, если он есть.",
    en: "Cinemas the project screens or screened in, if any.",
    hy: "Կինոթատրոնները, որտեղ ցուցադրվում է կամ ցուցադրվել է նախագիծը, եթե այդպիսիք կան։",
  },
  "forCreators.field.tiers.desc": {
    ru: "Минимум один пакет с названием и списком бенефитов (по пункту на строку). Можно указать цену в AMD, картинку, число слотов и флаг «эксклюзив» (принудительно 1 слот).",
    en: "At least one package with a name and a list of benefits (one per line). You can add a price in AMD, an image, a slot count and an “exclusive” flag (forces the slot count to 1).",
    hy: "Առնվազն մեկ փաթեթ՝ անվանումով և առավելությունների ցանկով (մեկը՝ մեկ տողում)։ Կարող եք նշել գին AMD-ով, նկար, տեղերի քանակ և «էքսկլյուզիվ» դրոշ (հարկադրաբար՝ 1 տեղ)։",
  },
  "forCreators.field.placements.desc": {
    ru: "Это и есть витрина товара: название, описание списком, картинка, слоты. Цена в AMD или пусто — тогда на сайте будет «по запросу».",
    en: "This is the actual product showcase: a name, a bulleted description, an image, slots. Price in AMD, or leave it empty for “on request” on the site.",
    hy: "Սա հենց ապրանքի ցուցափեղկն է՝ անվանում, ցանկով նկարագրություն, նկար, տեղեր։ Գին AMD-ով, կամ դատարկ թողեք, կայքում կցուցադրվի «հարցումով»։",
  },
  "forCreators.field.references.desc": {
    ru: "Похожие прошлые проекты — название, ссылка, изображение или клип.",
    en: "Comparable past projects — a name, a link, an image or a clip.",
    hy: "Նմանատիպ նախկին նախագծեր՝ անվանում, հղում, նկար կամ տեսահոլովակ։",
  },

  "forCreators.fileReq.title": { ru: "Требования к файлам", en: "File requirements", hy: "Տեխնիկական չափորոշիչներ" },
  "forCreators.fileReq.subtitle": {
    ru: "Сводная таблица лимитов по каждому типу медиа.",
    en: "A quick reference table of the limits for each media type.",
    hy: "Մեդիա ֆայլերի և ձևաչափերի տեխնիկական պահանջներն ու սահմանափակումները։",
  },
  "forCreators.fileReq.col.type": { ru: "Тип", en: "Type", hy: "Տեսակ" },
  "forCreators.fileReq.col.ratio": { ru: "Соотношение", en: "Aspect ratio", hy: "Հարաբերակցություն" },
  "forCreators.fileReq.col.maxSize": { ru: "Макс. размер", en: "Max size", hy: "Առավելագույն չափ" },
  "forCreators.fileReq.col.formats": { ru: "Форматы", en: "Formats", hy: "Ֆորմատներ" },
  "forCreators.fileReq.col.consequence": { ru: "Что произойдёт", en: "What happens", hy: "Ինչ կլինի" },
  "forCreators.fileReq.poster.consequence": {
    ru: "Вертикальный кадр обрезается по центру до 16:9.",
    en: "A portrait frame gets centre-cropped to 16:9.",
    hy: "Ուղղաձիգ կադրը կենտրոնից կկտրվի մինչև 16:9։",
  },
  "forCreators.fileReq.gallery.consequence": {
    ru: "Каждый кадр показывается как есть, без принудительной обрезки.",
    en: "Each still is shown as-is, with no forced cropping.",
    hy: "Յուրաքանչյուր կադր ցուցադրվում է առանց հարկադիր կտրման։",
  },
  "forCreators.fileReq.castPhoto.consequence": {
    ru: "Кадр обрезается по центру до квадрата.",
    en: "The frame is centre-cropped to a square.",
    hy: "Կադրը կենտրոնից կկտրվի մինչև քառակուսի։",
  },
  "forCreators.fileReq.videoFile.consequence": {
    ru: "Файл больше лимита не загрузится — сожмите его заранее.",
    en: "A file over the limit won't upload — compress it beforehand.",
    hy: "Սահմանից մեծ ֆայլը չի վերբեռնվի, նախապես սեղմեք այն։",
  },
  "forCreators.fileReq.videoLink.note": {
    ru: "Ссылка на YouTube или Vimeo — до 191 символа, без ограничений по размеру файла.",
    en: "A YouTube or Vimeo link — up to 191 characters, no file-size limit.",
    hy: "YouTube կամ Vimeo հղում՝ մինչև 191 նիշ, առանց ֆայլի չափի սահմանափակման։",
  },

  "forCreators.example.title": { ru: "Пример заполненного проекта", en: "Example of a filled-in project", hy: "Ամբողջությամբ լրացված նախագծի օրինակ" },
  "forCreators.example.subtitle": {
    ru: "Так выглядит проект, где заполнено всё — от постера до пакетов спонсорства.",
    en: "This is what a project looks like when everything is filled in — from the poster to the sponsorship packages.",
    hy: "Այսպես է երևում նախագիծը, երբ ամեն ինչ լրացված է՝ պաստառից մինչև հովանավորության փաթեթներ։",
  },
  "forCreators.example.cta": { ru: "Смотреть проект", en: "View the project", hy: "Դիտել նախագիծը" },

  "forCreators.moderation.title": { ru: "Что дальше: модерация", en: "What's next: moderation", hy: "Հաջորդը՝ մոդերացիա" },
  "forCreators.moderation.subtitle": {
    ru: "После отправки проект проходит проверку модератора — обычно до двух рабочих дней.",
    en: "After submission the project goes through a moderator's review — usually within two business days.",
    hy: "Ուղարկելուց հետո նախագիծը անցնում է մոդերատորի ստուգում՝ սովորաբար մինչև երկու աշխատանքային օրում։",
  },
  "forCreators.moderation.step1.title": { ru: "Вы отправляете", en: "You submit", hy: "Դուք ուղարկում եք" },
  "forCreators.moderation.step1.desc": {
    ru: "Все обязательные для публикации поля заполнены — форма пропускает проект дальше.",
    en: "Every field required to publish is filled in — the form lets the project through.",
    hy: "Հրապարակման համար պարտադիր բոլոր դաշտերը լրացված են, ձևը թույլ է տալիս նախագծին անցնել հետագա։",
  },
  "forCreators.moderation.step2.title": { ru: "Модератор проверяет", en: "A moderator reviews it", hy: "Մոդերատորը ստուգում է" },
  "forCreators.moderation.step2.desc": {
    ru: "Проверяются данные, медиа и корректность заявленных условий размещения.",
    en: "The data, media and the terms of the placement offer are checked for accuracy.",
    hy: "Ստուգվում են տվյալները, մեդիան և տեղադրման հայտարարված պայմանների ճշտությունը։",
  },
  "forCreators.moderation.step3.title": { ru: "Решение", en: "The decision", hy: "Որոշում" },
  "forCreators.moderation.step3.desc": {
    ru: "Одобрено — проект публикуется в каталоге. Возвращено — вы получаете список причин и правите.",
    en: "Approved — the project goes live in the catalog. Sent back — you get a list of reasons and fix them.",
    hy: "Հաստատված է՝ նախագիծը հրապարակվում է կատալոգում։ Վերադարձված է՝ ստանում եք պատճառների ցանկը և ուղղում եք։",
  },
  "forCreators.moderation.step4.title": { ru: "Проект в каталоге", en: "Live in the catalog", hy: "Կատալոգում է" },
  "forCreators.moderation.step4.desc": {
    ru: "Бренды видят проект и могут подавать заявки на пакеты и плейсменты.",
    en: "Brands can now see the project and apply for packages and placements.",
    hy: "Բրենդները տեսնում են նախագիծը և կարող են դիմել փաթեթների ու փլեյսմենթների համար։",
  },
  "forCreators.moderation.reasons.title": { ru: "Частые причины возврата", en: "Common reasons for a return", hy: "Վերադարձի հաճախակի պատճառներ" },
  "forCreators.moderation.reasons.item1": {
    ru: "Нет ни одного пакета спонсорства с названием и бенефитами.",
    en: "No sponsorship package with a name and a benefits list.",
    hy: "Անվանումով ու առավելություններով հովանավորության ոչ մի փաթեթ չկա։",
  },
  "forCreators.moderation.reasons.item2": {
    ru: "Не указаны студия или хронометраж.",
    en: "Studio or runtime is missing.",
    hy: "Չի նշված ստուդիան կամ տևողությունը։",
  },
  "forCreators.moderation.reasons.item3": {
    ru: "Логлайн длиннее 140 символов или отсутствует.",
    en: "The logline is missing or longer than 140 characters.",
    hy: "Կարգախոսը բացակայում է կամ գերազանցում է 140 նիշը։",
  },
  "forCreators.moderation.reasons.item4": {
    ru: "Постер вертикальный и плохо смотрится после обрезки до 16:9.",
    en: "The poster is portrait and looks wrong after the 16:9 crop.",
    hy: "Պաստառը ուղղաձիգ է և վատ տեսք ունի 16:9-ի կտրումից հետո։",
  },
  "forCreators.moderation.editWarning": {
    ru: "Важно: любое изменение уже опубликованного проекта возвращает его на повторную модерацию и снимает с витрины до одобрения.",
    en: "Important: editing an already-published project sends it back for another review and pulls it off the storefront until it's approved again.",
    hy: "Կարևոր է․ արդեն հրապարակված նախագծի ցանկացած փոփոխություն այն կրկին ուղարկում է մոդերացիայի և հանում ցուցափեղկից՝ մինչև նոր հաստատումը։",
  },

  "forCreators.finalCta.title": { ru: "Готовы начать?", en: "Ready to start?", hy: "Պատրա՞ստ եք սկսելու" },
  "forCreators.finalCta.subtitle": {
    // No "takes about 15 minutes" promise here: the form is ~30 fields plus
    // poster, gallery, video and cast photos, and the honest answer depends
    // entirely on whether the materials already exist. Only the moderation
    // turnaround (two working days) is a commitment we actually made.
    ru: "Соберите материалы по чек-листу выше — и подавайте проект.",
    en: "Gather the materials from the checklist above, then submit your project.",
    hy: "Հավաքեք վերևի ստուգաթերթի նյութերը և ներկայացրեք ձեր նախագիծը։",
  },
  "forCreators.finalCta.button": { ru: "Подать проект", en: "Submit a project", hy: "Ներկայացնել նախագիծ" },

  // ── /ads — advertising channels (stage 2, docs/plan-multichannel-ads.md) ──
  // Chrome shared by the overview and all nine channel pages.
  "ads.hero.eyebrow": { ru: "Рекламные каналы", en: "Advertising channels", hy: "Գովազդային ալիքներ" },
  "ads.hero.title": {
    ru: "Вся реклама Армении — на одной площадке",
    en: "Every advertising channel in one place",
    hy: "Բոլոր գովազդային ալիքները՝ մեկ հարթակում",
  },
  "ads.hero.subtitle": {
    ru: "Продакт-плейсмент в кино, спонсорство событий, ТВ и радио, наружная и цифровая реклама. Выберите канал и посмотрите, что доступно к покупке.",
    en: "Product placement in film, event sponsorship, TV and radio, outdoor and digital. Pick a channel and see what is available to buy.",
    hy: "Փրոդաքթ փլեյսմենթ կինոյում, միջոցառումների հովանավորություն, հեռուստատեսություն և ռադիո, բացօթյա և թվային գովազդ։ Ընտրեք ալիքը և տեսեք, թե ինչ է հասանելի գնման համար։",
  },
  "ads.hero.ctaBrowse": { ru: "Смотреть проекты", en: "Browse projects", hy: "Տեսնել նախագծերը" },
  "ads.hero.ctaContact": { ru: "Связаться с нами", en: "Contact us", hy: "Կապվել մեզ հետ" },
  "ads.groupsTitle": { ru: "Каналы по группам", en: "Channels by group", hy: "Ալիքները՝ ըստ խմբերի" },
  "ads.groupsSubtitle": {
    ru: "Девять каналов в пяти группах. У каждого — своя страница с описанием и доступным инвентарём.",
    en: "Nine channels in five groups. Each has its own page with a description and the inventory on offer.",
    hy: "Ինը ալիք՝ հինգ խմբում։ Յուրաքանչյուրն ունի իր էջը՝ նկարագրությամբ և հասանելի գույքագրմամբ։",
  },
  "ads.channelCta": { ru: "Подробнее о канале", en: "About this channel", hy: "Ալիքի մասին" },
  // The catalog is now the actual shopping list (2026-08-10, stage B), and
  // this channel's own inventory grid became a 6-item teaser that ends here
  // with the channel pre-selected. Also the last row of the header's ads
  // dropdown. The /ads overview tiles do NOT use this — they still lead into
  // the channel's explanatory page, which is the only way into that copy.
  "ads.viewAllInCatalog": {
    ru: "Смотреть в каталоге",
    en: "View in catalog",
    hy: "Տեսնել կատալոգում",
  },
  "ads.backToAll": { ru: "Все каналы", en: "All channels", hy: "Բոլոր ալիքները" },
  "ads.about.title": { ru: "Что это", en: "What this is", hy: "Ի՞նչ է սա" },
  "ads.buy.title": { ru: "Что можно купить", en: "What you can buy", hy: "Ի՞նչ կարելի է գնել" },
  "ads.inventory.title": { ru: "Доступный инвентарь", en: "Available inventory", hy: "Հասանելի գույքագրում" },
  "ads.inventory.projectsSubtitle": {
    ru: "Проекты, в которых этот канал открыт для брендов прямо сейчас.",
    en: "Projects where this channel is open to brands right now.",
    hy: "Նախագծեր, որտեղ այս ալիքը հենց հիմա բաց է բրենդների համար։",
  },
  "ads.inventory.noProjects": {
    ru: "Сейчас по этому каналу нет открытых предложений. Напишите нам — подберём проект под задачу.",
    en: "No open offers on this channel right now. Write to us and we will find a fit for your brief.",
    hy: "Այս ալիքով այս պահին բաց առաջարկներ չկան։ Գրեք մեզ, և մենք կգտնենք ձեր խնդրին համապատասխան տարբերակը։",
  },
  "ads.inventory.soonTitle": { ru: "Инвентарь появится позже", en: "Inventory is coming later", hy: "Գույքագրումը կհայտնվի ավելի ուշ" },
  "ads.inventory.soonBody": {
    ru: "Мы собираем площадки этого канала. Оставьте заявку — свяжемся, как только они появятся, или подберём вариант вручную.",
    en: "We are still gathering the spaces for this channel. Get in touch and we will reach out as soon as they go live, or put together an offer by hand.",
    hy: "Մենք դեռ հավաքում ենք այս ալիքի տարածքները։ Կապվեք մեզ հետ, և մենք կտեղեկացնենք, հենց դրանք հայտնվեն, կամ առաջարկը կկազմենք ձեռքով։",
  },
  "ads.cta.title": { ru: "Не нашли нужный канал?", en: "Didn't find the channel you need?", hy: "Չգտա՞ք ձեզ անհրաժեշտ ալիքը" },
  "ads.cta.subtitle": {
    ru: "Расскажите о задаче — соберём медиаплан из нескольких каналов.",
    en: "Tell us about your brief and we will put together a media plan across several channels.",
    hy: "Պատմեք ձեր խնդրի մասին, և մենք կկազմենք մեդիապլան մի քանի ալիքից։",
  },
  "ads.cta.button": { ru: "Написать нам", en: "Get in touch", hy: "Գրել մեզ" },

  // ── The public ad-space card, /ads/<channel>/<code> (stage 3) ──
  // The showcase grid on a channel page and the card behind it. Prices, "from"
  // and "on request" reuse the catalog card's own keys — same words, same
  // widget — so only what is specific to an ad space lives here.
  "adSpacePublic.inventorySubtitle": {
    ru: "Рекламные места этого канала, открытые для брендов прямо сейчас.",
    en: "The spaces on this channel that are open to brands right now.",
    hy: "Այս ալիքի տարածքները, որոնք հենց հիմա բաց են բրենդների համար։",
  },
  "adSpacePublic.offersCount": { ru: "{n} предложений", en: "{n} offers", hy: "{n} առաջարկ" },
  "adSpacePublic.offersCountOne": { ru: "1 предложение", en: "1 offer", hy: "1 առաջարկ" },
  "adSpacePublic.cardCta": { ru: "Подробнее о месте", en: "About this space", hy: "Տարածքի մասին" },
  // Facts. Each label sits above its own value on the card — the figure alone
  // says nothing ("12 000" of what, per what?).
  "adSpacePublic.location": { ru: "Локация", en: "Location", hy: "Տեղակայում" },
  "adSpacePublic.size": { ru: "Размер / формат", en: "Size / format", hy: "Չափը / ձևաչափը" },
  "adSpacePublic.sides": { ru: "Сторон", en: "Sides", hy: "Կողմեր" },
  "adSpacePublic.reach": { ru: "Охват в день", en: "Reach per day", hy: "Օրական հասանելիություն" },
  "adSpacePublic.availability": { ru: "Период доступности", en: "Available", hy: "Հասանելիության ժամկետը" },
  "adSpacePublic.availableFrom": { ru: "с {date}", en: "from {date}", hy: "{date}-ից" },
  "adSpacePublic.availableTo": { ru: "до {date}", en: "until {date}", hy: "մինչև {date}" },
  "adSpacePublic.availableRange": { ru: "{from} — {to}", en: "{from} — {to}", hy: "{from} — {to}" },
  "adSpacePublic.priceFrom": { ru: "Размещение от {price}", en: "Placements from {price}", hy: "Տեղադրումը՝ {price}-ից" },
  "adSpacePublic.backToChannel": {
    ru: "Все места канала",
    en: "All spaces on this channel",
    hy: "Ալիքի բոլոր տարածքները",
  },
  "adSpacePublic.descriptionTitle": { ru: "Описание", en: "About this space", hy: "Նկարագրություն" },
  "adSpacePublic.offersTitle": { ru: "Предложения", en: "Offers", hy: "Առաջարկներ" },
  "adSpacePublic.offersSubtitle": {
    ru: "Что можно купить на этом месте и на какой срок.",
    en: "What you can buy on this space, and for how long.",
    hy: "Ի՞նչ կարելի է գնել այս տարածքում և ինչ ժամկետով։",
  },
  "adSpacePublic.noOffers": {
    ru: "Предложения по этому месту пока не опубликованы. Напишите нам — рассчитаем стоимость под вашу задачу.",
    en: "No offers have been published for this space yet. Write to us and we will quote it for your brief.",
    hy: "Այս տարածքի համար առաջարկներ դեռ հրապարակված չեն։ Գրեք մեզ, և մենք արժեքը կհաշվարկենք ձեր խնդրի համար։",
  },
  "adSpacePublic.slots": {
    ru: "{free} из {total} свободно",
    en: "{free} of {total} available",
    hy: "{total}-ից {free}-ն ազատ է",
  },
  // Applications on ad spaces are stage 4; until then every CTA here is the
  // contact form, not a button that would go nowhere.
  "adSpacePublic.contactCta": { ru: "Узнать об этом месте", en: "Ask about this space", hy: "Հարցնել այս տարածքի մասին" },

  // Channel groups (the second badge on the Placement card is adGroup.SPONSORSHIP).
  "adGroup.CONTENT": { ru: "Интеграция в контент", en: "Content integration", hy: "Ինտեգրում բովանդակության մեջ" },
  "adGroup.SPONSORSHIP": { ru: "Спонсорство", en: "Sponsorship", hy: "Հովանավորություն" },
  "adGroup.MEDIA": { ru: "Медиа", en: "Media", hy: "Մեդիա" },
  "adGroup.DIGITAL": { ru: "Диджитал", en: "Digital", hy: "Թվային" },
  "adGroup.OUTDOOR": { ru: "Наружная реклама", en: "Outdoor", hy: "Բացօթյա գովազդ" },

  // ── the nine channels (see src/lib/ad-channels.ts for the key contract) ──
  "adChannel.PLACEMENT": { ru: "Продакт-плейсмент", en: "Product placement", hy: "Փրոդաքթ փլեյսմենթ" },
  "adChannel.PLACEMENT.desc": {
    ru: "Бренд внутри истории: в кадре, в титрах или в реплике героя.",
    en: "The brand inside the story — in frame, in the credits or in a character's line.",
    hy: "Բրենդը՝ պատմության ներսում՝ կադրում, տիտրերում կամ հերոսի խոսքում։",
  },
  "adChannel.PLACEMENT.about": {
    ru: "Продукт живёт в сюжете, а не в рекламной паузе: зритель видит его в руках любимого героя и не может перемотать. Формат работает и на узнаваемость, и на доверие — бренд получает контекст, который невозможно купить баннером.",
    en: "The product lives in the plot rather than in an ad break: the audience sees it in the hands of a character they already trust, and cannot skip it. The format builds both awareness and credibility — a context no banner can buy.",
    hy: "Ապրանքն ապրում է սյուժեի ներսում, ոչ թե գովազդային ընդմիջմանը․ հանդիսատեսը տեսնում է այն սիրելի հերոսի ձեռքում և չի կարող բաց թողնել։ Ձևաչափն աշխատում է և՛ ճանաչելիության, և՛ վստահության վրա՝ բրենդը ստանում է համատեքստ, որը բաններով հնարավոր չէ գնել։",
  },
  "adChannel.PLACEMENT.buy1": {
    ru: "Появление продукта в кадре — герой пользуется им или носит его",
    en: "The product on screen — a character uses it or wears it",
    hy: "Ապրանքի հայտնվելը կադրում՝ հերոսն օգտագործում կամ կրում է այն",
  },
  "adChannel.PLACEMENT.buy2": {
    ru: "Логотип в титрах или на конечной карточке",
    en: "The logo in the credits or on the end card",
    hy: "Լոգոն տիտրերում կամ ավարտական քարտում",
  },
  "adChannel.PLACEMENT.buy3": {
    ru: "Упоминание бренда в диалоге и нейминг сезона целиком",
    en: "A verbal mention in dialogue, or naming rights to a whole season",
    hy: "Բրենդի հիշատակումը երկխոսության մեջ և ամբողջ սեզոնի անվանակոչում",
  },

  "adChannel.EVENTS": { ru: "Спонсорство событий", en: "Event sponsorship", hy: "Միջոցառումների հովանավորություն" },
  "adChannel.EVENTS.desc": {
    ru: "Бренд рядом с премьерой, съёмками или живым событием проекта.",
    en: "The brand alongside a premiere, a shoot or a live project event.",
    hy: "Բրենդը՝ պրեմիերայի, նկարահանումների կամ նախագծի կենդանի միջոցառման կողքին։",
  },
  "adChannel.EVENTS.about": {
    ru: "Спонсорский пакет — это присутствие бренда вокруг проекта: премьера, пресс-показ, съёмочная площадка, публикации команды. Бренд получает не один кадр, а весь шлейф внимания к проекту.",
    en: "A sponsorship package is the brand's presence around the project: the premiere, the press screening, the set, the team's own publications. The brand gets the whole trail of attention, not a single frame.",
    hy: "Հովանավորական փաթեթը բրենդի ներկայությունն է նախագծի շուրջ՝ պրեմիերա, մամուլի ցուցադրություն, նկարահանման հրապարակ, թիմի հրապարակումներ։ Բրենդը ստանում է ոչ թե մեկ կադր, այլ նախագծի ողջ ուշադրության հետքը։",
  },
  "adChannel.EVENTS.buy1": {
    ru: "Титульное спонсорство проекта или отдельного события",
    en: "Title sponsorship of a project or of a single event",
    hy: "Նախագծի կամ առանձին միջոցառման տիտղոսային հովանավորություն",
  },
  "adChannel.EVENTS.buy2": {
    ru: "Логотип на площадке, в пресс-материалах и на пресс-волле",
    en: "The logo on site, in press materials and on the press wall",
    hy: "Լոգոն վայրում, մամուլի նյութերում և մամուլի պատին",
  },
  "adChannel.EVENTS.buy3": {
    ru: "Совместные публикации команды проекта и доступ к премьере",
    en: "Joint publications from the project team and access to the premiere",
    hy: "Նախագծի թիմի համատեղ հրապարակումներ և մուտք պրեմիերա",
  },

  "adChannel.VIDEO": { ru: "Видеореклама", en: "Video ads", hy: "Վիդեոգովազդ" },
  "adChannel.VIDEO.desc": {
    ru: "Ролик перед контентом, внутри него или после — на видеоплощадках.",
    en: "A spot before, inside or after the content on video platforms.",
    hy: "Հոլովակ բովանդակությունից առաջ, ներսում կամ հետո՝ վիդեոհարթակներում։",
  },
  "adChannel.VIDEO.about": {
    ru: "Классический видеоформат: pre-roll, mid-roll и post-roll на YouTube и других видеоплощадках, где смотрят армянский контент. Точный охват, понятная стоимость контакта и полная статистика показов.",
    en: "The classic video format: pre-roll, mid-roll and post-roll on YouTube and the other platforms where Armenian content is watched. Precise reach, a clear cost per contact and full impression stats.",
    hy: "Դասական վիդեոձևաչափ՝ pre-roll, mid-roll և post-roll YouTube-ում և այլ հարթակներում, որտեղ դիտում են հայկական բովանդակությունը։ Ճշգրիտ հասանելիություն, հասկանալի կոնտակտի արժեք և ցուցադրումների ամբողջական վիճակագրություն։",
  },
  "adChannel.VIDEO.buy1": { ru: "Pre-roll и mid-roll в популярных проектах", en: "Pre-roll and mid-roll in popular projects", hy: "Pre-roll և mid-roll հայտնի նախագծերում" },
  "adChannel.VIDEO.buy2": { ru: "Брендированные заставки и конечные карточки", en: "Branded bumpers and end cards", hy: "Բրենդավորված պաստառներ և ավարտական քարտեր" },
  "adChannel.VIDEO.buy3": { ru: "Пакеты показов с гарантированным охватом", en: "Impression packages with guaranteed reach", hy: "Ցուցադրումների փաթեթներ՝ երաշխավորված հասանելիությամբ" },

  "adChannel.RADIO": { ru: "Радиореклама", en: "Radio ads", hy: "Ռադիոգովազդ" },
  "adChannel.RADIO.desc": {
    ru: "Аудиоролики и упоминания в эфире армянских радиостанций.",
    en: "Audio spots and on-air mentions on Armenian radio stations.",
    hy: "Աուդիոհոլովակներ և հիշատակումներ հայկական ռադիոկայանների եթերում։",
  },
  "adChannel.RADIO.about": {
    ru: "Радио остаётся каналом ежедневного контакта: дорога на работу, такси, магазин. Короткий ролик в правильном временном слоте даёт частоту, которой трудно добиться в digital за те же деньги.",
    en: "Radio is still a daily-contact channel: the commute, the taxi, the shop. A short spot in the right time slot buys a frequency that is hard to match in digital for the same money.",
    hy: "Ռադիոն մնում է ամենօրյա շփման ալիք՝ ճանապարհ դեպի աշխատանք, տաքսի, խանութ։ Կարճ հոլովակը ճիշտ ժամային հատվածում տալիս է հաճախականություն, որին դժվար է հասնել թվային ալիքներում նույն գումարով։",
  },
  "adChannel.RADIO.buy1": { ru: "Аудиоролик 15–30 секунд в выбранных слотах", en: "A 15–30 second audio spot in the slots you pick", hy: "15–30 վայրկյան աուդիոհոլովակ ընտրված հատվածներում" },
  "adChannel.RADIO.buy2": { ru: "Спонсорство рубрики или программы", en: "Sponsorship of a segment or a show", hy: "Խորագրի կամ հաղորդման հովանավորություն" },
  "adChannel.RADIO.buy3": { ru: "Живое упоминание ведущим", en: "A live mention by the host", hy: "Հաղորդավարի կենդանի հիշատակում" },

  "adChannel.TV": { ru: "Телереклама", en: "TV ads", hy: "Հեռուստագովազդ" },
  "adChannel.TV.desc": {
    ru: "Рекламные блоки, спонсорство программ и бегущая строка на ТВ.",
    en: "Ad breaks, programme sponsorship and on-screen tickers on TV.",
    hy: "Գովազդային բլոկներ, հաղորդումների հովանավորություն և վազող տող հեռուստաեթերում։",
  },
  "adChannel.TV.about": {
    ru: "Телевидение по-прежнему даёт самый широкий разовый охват в Армении. Формат подходит бренду, которому нужно быстро стать известным всей стране, а не только городской аудитории.",
    en: "Television still delivers the widest single-shot reach in Armenia. It suits a brand that needs to become known nationwide fast, not just to a city audience.",
    hy: "Հեռուստատեսությունը դեռ ապահովում է ամենալայն միանվագ հասանելիությունը Հայաստանում։ Ձևաչափը հարմար է բրենդին, որին պետք է արագ ճանաչելի դառնալ ողջ երկրում, ոչ միայն քաղաքային լսարանում։",
  },
  "adChannel.TV.buy1": { ru: "Ролик в рекламном блоке выбранного канала", en: "A spot in the ad break of the channel you pick", hy: "Հոլովակ ընտրված հեռուստաալիքի գովազդային բլոկում" },
  "adChannel.TV.buy2": { ru: "Спонсорство передачи с заставкой и упоминанием", en: "Programme sponsorship with a bumper and a mention", hy: "Հաղորդման հովանավորություն՝ պաստառով և հիշատակումով" },
  "adChannel.TV.buy3": { ru: "Бегущая строка и логотип в углу экрана", en: "A ticker line and a corner logo", hy: "Վազող տող և լոգո էկրանի անկյունում" },

  "adChannel.BANNER": { ru: "Баннерная реклама", en: "Banner ads", hy: "Բանների գովազդ" },
  "adChannel.BANNER.desc": {
    ru: "Медийные баннеры на сайтах и в приложениях с армянской аудиторией.",
    en: "Display banners on sites and apps with an Armenian audience.",
    hy: "Մեդիա բաններներ հայկական լսարան ունեցող կայքերում և հավելվածներում։",
  },
  "adChannel.BANNER.about": {
    ru: "Самый управляемый канал: показ можно ограничить городом, устройством и временем суток, а результат виден в тот же день. Хорошо работает как поддержка кампании в других каналах.",
    en: "The most controllable channel: you can limit delivery by city, device and time of day, and see the result the same day. It works well as support for a campaign running in other channels.",
    hy: "Ամենակառավարելի ալիքը՝ ցուցադրումը կարելի է սահմանափակել ըստ քաղաքի, սարքի և օրվա ժամի, իսկ արդյունքը երևում է նույն օրը։ Լավ աշխատում է որպես այլ ալիքներում ընթացող արշավի աջակցություն։",
  },
  "adChannel.BANNER.buy1": { ru: "Баннеры на главных и внутренних страницах", en: "Banners on home and inner pages", hy: "Բաններներ գլխավոր և ներքին էջերում" },
  "adChannel.BANNER.buy2": { ru: "Таргетинг по городу, устройству и времени", en: "Targeting by city, device and time", hy: "Թիրախավորում ըստ քաղաքի, սարքի և ժամանակի" },
  "adChannel.BANNER.buy3": { ru: "Отчёт по показам и переходам", en: "A report on impressions and clicks", hy: "Հաշվետվություն ցուցադրումների և անցումների վերաբերյալ" },

  "adChannel.BILLBOARD": { ru: "Билборды", en: "Billboards", hy: "Բիլբորդներ" },
  "adChannel.BILLBOARD.desc": {
    ru: "Крупные щиты на трассах и городских магистралях.",
    en: "Large boards on highways and city arteries.",
    hy: "Խոշոր վահանակներ մայրուղիներում և քաղաքային պողոտաներում։",
  },
  "adChannel.BILLBOARD.about": {
    ru: "Щит нельзя закрыть, пропустить или заблокировать — он работает на всех, кто проехал мимо. Канал для запусков, распродаж и брендов, которым важна масштабность сообщения.",
    en: "A board cannot be closed, skipped or blocked — it works on everyone who drives past. The channel for launches, sales and brands that need scale in the message itself.",
    hy: "Վահանակը հնարավոր չէ փակել, բաց թողնել կամ արգելափակել․ այն աշխատում է բոլորի վրա, ովքեր անցել են կողքով։ Ալիք՝ գործարկումների, զեղչերի և այն բրենդների համար, որոնց կարևոր է հաղորդագրության մասշտաբը։",
  },
  "adChannel.BILLBOARD.buy1": { ru: "Аренда щита на месяц или на кампанию", en: "Renting a board for a month or for the campaign", hy: "Վահանակի վարձակալություն ամսով կամ արշավի տևողությամբ" },
  "adChannel.BILLBOARD.buy2": { ru: "Выбор конкретной локации и стороны движения", en: "Choosing the exact location and the traffic side", hy: "Կոնկրետ վայրի և երթևեկության կողմի ընտրություն" },
  "adChannel.BILLBOARD.buy3": { ru: "Печать и монтаж макета", en: "Printing and mounting the artwork", hy: "Մակետի տպագրություն և տեղադրում" },

  "adChannel.LIFTS": { ru: "Реклама в лифтах", en: "Lift advertising", hy: "Գովազդ վերելակներում" },
  "adChannel.LIFTS.desc": {
    ru: "Постеры и экраны в лифтах жилых домов и бизнес-центров.",
    en: "Posters and screens in the lifts of residential buildings and offices.",
    hy: "Պաստառներ և էկրաններ բնակելի շենքերի ու բիզնես կենտրոնների վերելակներում։",
  },
  "adChannel.LIFTS.about": {
    ru: "Несколько секунд, когда человеку буквально некуда смотреть, и он видит одно и то же сообщение дважды в день. Точная привязка к району делает канал удобным для локального бизнеса.",
    en: "A few seconds where there is literally nowhere else to look, and the same message is seen twice a day. The precise tie to a neighbourhood makes it a convenient channel for local business.",
    hy: "Մի քանի վայրկյան, երբ մարդուն բառացիորեն նայելու տեղ չկա, և նա նույն հաղորդագրությունը տեսնում է օրական երկու անգամ։ Թաղամասին ճշգրիտ կապվածությունը ալիքը հարմար է դարձնում տեղական բիզնեսի համար։",
  },
  "adChannel.LIFTS.buy1": { ru: "Постеры в лифтах выбранных домов", en: "Posters in the lifts of the buildings you pick", hy: "Պաստառներ ընտրված շենքերի վերելակներում" },
  "adChannel.LIFTS.buy2": { ru: "Экраны с видеороликом в бизнес-центрах", en: "Video screens in business centres", hy: "Վիդեոհոլովակով էկրաններ բիզնես կենտրոններում" },
  "adChannel.LIFTS.buy3": { ru: "Охват по конкретным районам города", en: "Coverage of specific city districts", hy: "Ծածկույթ քաղաքի կոնկրետ թաղամասերում" },

  "adChannel.TRANSIT": { ru: "Реклама на транспорте", en: "Transit ads", hy: "Գովազդ տրանսպորտում" },
  "adChannel.TRANSIT.desc": {
    ru: "Автобусы и метро: борта, салоны и станции.",
    en: "Buses and the metro — exteriors, interiors and stations.",
    hy: "Ավտոբուսներ և մետրո՝ կողային մակերեսներ, սրահներ և կայարաններ։",
  },
  "adChannel.TRANSIT.about": {
    ru: "Транспорт весь день ездит по самым людным маршрутам, а пассажир в салоне проводит с рекламой десятки минут. Канал сочетает уличный охват с длинным контактом внутри.",
    en: "Transport spends the whole day on the busiest routes, and a passenger inside spends tens of minutes with the ad. The channel combines street-level reach with a long contact inside.",
    hy: "Տրանսպորտն ամբողջ օրը շարժվում է ամենամարդաշատ երթուղիներով, իսկ սրահի ուղևորը գովազդի հետ անցկացնում է տասնյակ րոպեներ։ Ալիքը միավորում է փողոցային հասանելիությունը ներսի երկար շփման հետ։",
  },
  "adChannel.TRANSIT.buy1": { ru: "Брендирование бортов автобуса", en: "Branding the exterior of a bus", hy: "Ավտոբուսի կողային մակերեսների բրենդավորում" },
  "adChannel.TRANSIT.buy2": { ru: "Постеры в салоне и на поручнях", en: "Posters inside the cabin and on the handrails", hy: "Պաստառներ սրահում և բռնակների վրա" },
  "adChannel.TRANSIT.buy3": { ru: "Щиты и стикеры на станциях метро", en: "Boards and stickers in metro stations", hy: "Վահանակներ և ստիկերներ մետրոյի կայարաններում" },

  // ── Рекламные места: кабинет создателя ──────
  "adSpace.mine": { ru: "Мои рекламные места", en: "My ad spaces", hy: "Իմ գովազդային տարածքները" },
  "adSpace.mineSubtitle": {
    ru: "Билборды, лифты, транспорт, радио, ТВ и цифровые площадки, которые вы сдаёте брендам.",
    en: "Billboards, lifts, transit, radio, TV and digital inventory you rent out to brands.",
    hy: "Բիլբորդներ, վերելակներ, տրանսպորտ, ռադիո, հեռուստատեսություն և թվային տարածքներ, որոնք դուք տրամադրում եք բրենդներին։",
  },
  "adSpace.submit": { ru: "Добавить рекламное место", en: "Add an ad space", hy: "Ավելացնել գովազդային տարածք" },
  "adSpace.submitSubtitle": {
    ru: "Заполните карточку места — после проверки модератором оно появится на странице своего канала.",
    en: "Fill in the space — once a moderator has checked it, it appears on its channel page.",
    hy: "Լրացրեք տարածքի քարտը․ մոդերատորի ստուգումից հետո այն կհայտնվի իր ալիքի էջում։",
  },
  "adSpace.submitFirst": { ru: "Добавить первое место", en: "Add the first space", hy: "Ավելացնել առաջին տարածքը" },
  "adSpace.none": { ru: "У вас пока нет рекламных мест.", en: "You have no ad spaces yet.", hy: "Դուք դեռ գովազդային տարածքներ չունեք։" },
  "adSpace.edit": { ru: "Редактировать место", en: "Edit the space", hy: "Խմբագրել տարածքը" },
  "adSpace.offersCount": { ru: "Предложений", en: "Offers", hy: "Առաջարկներ" },
  // Место, уже прошедшее модерацию: то же правило, что у проекта, но своим
  // словом — account.form.approvedLocked / errApproved говорят «Проект».
  "adSpace.approvedLocked": {
    ru: "Место опубликовано, поэтому правки вносит редакция.",
    en: "This ad space is published, so edits are made by the editors.",
    hy: "Տարածքը հրապարակված է, ուստի փոփոխությունները կատարում է խմբագրությունը։",
  },
  "adSpace.errApproved": {
    ru: "Место уже опубликовано — правки вносит редакция.",
    en: "This ad space is already published — edits are made by the editors.",
    hy: "Տարածքն արդեն հրապարակված է — փոփոխությունները կատարում է խմբագրությունը։",
  },
  // Вводная строка списка блокеров. Отдельная от publish.blockedSubmit /
  // publish.blockedApprove: те говорят «Проект…», и место, отправленное на
  // модерацию, показывало создателю «Проект нельзя отправить…» — один ключ на
  // два разных предмета.
  "adSpace.publish.blockedSubmit": {
    ru: "Место нельзя отправить на модерацию, пока не заполнено:",
    en: "This ad space can't be submitted for review until you fill in:",
    hy: "Տարածքը հնարավոր չէ ուղարկել մոդերացիայի, քանի դեռ լրացված չէ․",
  },
  "adSpace.publish.blockedApprove": {
    ru: "Место нельзя опубликовать — создатель не заполнил:",
    en: "This ad space can't be published — the creator hasn't filled in:",
    hy: "Տարածքը հնարավոր չէ հրապարակել — ստեղծողը չի լրացրել․",
  },
  // Что мешает месту стать публичным — подставляется в них списком, как ключи
  // publish.missing.* у проекта.
  "adSpace.publish.offers": { ru: "хотя бы одно предложение", en: "at least one offer", hy: "առնվազն մեկ առաջարկ" },
  "adSpace.publish.sizeFormat": { ru: "размер или формат", en: "size or format", hy: "չափը կամ ձևաչափը" },

  // ── Форма рекламного места (та же в админке и в кабинете) ──
  "adSpaceForm.section.general": { ru: "Место", en: "The space", hy: "Տարածքը" },
  "adSpaceForm.section.about": { ru: "Название и описание", en: "Name and description", hy: "Անվանում և նկարագրություն" },
  "adSpaceForm.section.media": { ru: "Фото", en: "Photos", hy: "Լուսանկարներ" },
  "adSpaceForm.section.offers": { ru: "Что покупает бренд", en: "What the brand buys", hy: "Ինչ է գնում բրենդը" },
  "adSpaceForm.section.visibility": { ru: "Видимость", en: "Visibility", hy: "Տեսանելիություն" },
  "adSpaceForm.channel": { ru: "Канал", en: "Channel", hy: "Ալիք" },
  "adSpaceForm.channelHint": {
    ru: "Страница, на которой место будет показано брендам.",
    en: "The page where the space will be shown to brands.",
    hy: "Էջը, որտեղ տարածքը ցուցադրվելու է բրենդներին։",
  },
  "adSpaceForm.channelNotSet": { ru: "Не выбран", en: "Not selected", hy: "Ընտրված չէ" },
  "adSpaceForm.city": { ru: "Город", en: "City", hy: "Քաղաք" },
  // #64: picker placeholder, same wording pattern as projectForm.countriesPlaceholder.
  "adSpaceForm.cityPlaceholder": { ru: "Выберите город…", en: "Pick a city…", hy: "Ընտրեք քաղաքը…" },
  "adSpaceForm.address": { ru: "Адрес", en: "Address", hy: "Հասցե" },
  "adSpaceForm.sizeFormat": { ru: "Размер или формат", en: "Size or format", hy: "Չափ կամ ձևաչափ" },
  "adSpaceForm.sizeFormatHint": {
    ru: "Например: 3×6 м, 30 сек, 1080×1920",
    en: "For example: 3×6 m, 30 sec, 1080×1920",
    hy: "Օրինակ՝ 3×6 մ, 30 վրկ, 1080×1920",
  },
  "adSpaceForm.reachPerDay": { ru: "Охват в день", en: "Reach per day", hy: "Օրական ծածկույթ" },
  "adSpaceForm.sides": { ru: "Сторон", en: "Sides", hy: "Կողմեր" },
  "adSpaceForm.availableFrom": { ru: "Доступно с", en: "Available from", hy: "Հասանելի է սկսած" },
  "adSpaceForm.availableTo": { ru: "Доступно до", en: "Available to", hy: "Հասանելի է մինչև" },
  "adSpaceForm.availableHint": {
    ru: "Оставьте пустым, если место доступно всегда.",
    en: "Leave empty if the space is always available.",
    hy: "Թողեք դատարկ, եթե տարածքը միշտ հասանելի է։",
  },
  "adSpaceForm.title": { ru: "Название", en: "Title", hy: "Անվանում" },
  "adSpaceForm.description": { ru: "Описание", en: "Description", hy: "Նկարագրություն" },
  "adSpaceForm.image": { ru: "Главное фото", en: "Main photo", hy: "Հիմնական լուսանկար" },
  // The two hints say WHERE each picture is seen, not what it is — that is the
  // thing an owner cannot guess from a drop zone (same reason the project
  // form's poster/gallery cards carry one).
  "adSpaceForm.imageHint": {
    ru: "Показывается на карточке места в витрине канала и первым на его странице.",
    en: "Shown on the space's card in the channel showcase, and first on its own page.",
    hy: "Ցուցադրվում է տարածքի քարտում՝ ալիքի ցուցափեղկում, և առաջինը՝ իր էջում։",
  },
  "adSpaceForm.gallery": { ru: "Галерея", en: "Gallery", hy: "Պատկերասրահ" },
  // The ad-space twin of publish.gapNote / projectForm.offer.bulletEmpty. Both
  // of those name a *project* and a *tier offer*, which is what the first
  // version of this form showed a billboard's owner. Same sentence, right noun.
  "adSpaceForm.gapNote": {
    ru: "Без этого место не отправится на модерацию.",
    en: "The space can't be submitted for review without this.",
    hy: "Առանց սրա տարածքը չի ուղարկվի մոդերացիայի։",
  },
  "adSpaceForm.descriptionEmpty": {
    ru: "Ни одного пункта — бренд не увидит, что это за место.",
    en: "No items yet — the brand can't see what this space is.",
    hy: "Դեռ կետեր չկան․ բրենդը չի տեսնի, թե ինչ տարածք է սա։",
  },
  "adSpaceForm.galleryHint": {
    ru: "Дополнительные снимки на странице места — ракурсы, окружение, пример размещения.",
    en: "Extra shots on the space's page — angles, surroundings, an example of a placement.",
    hy: "Լրացուցիչ լուսանկարներ տարածքի էջում՝ տեսանկյուններ, շրջապատ, տեղադրման օրինակ։",
  },
  "adSpaceForm.isActive": { ru: "Показывать на сайте", en: "Show on the site", hy: "Ցուցադրել կայքում" },
  "adSpaceForm.moderationNote": {
    ru: "После сохранения место уходит на проверку модератору и появится на сайте после одобрения.",
    en: "Once saved, the space goes to a moderator and appears on the site after approval.",
    hy: "Պահպանելուց հետո տարածքն ուղարկվում է մոդերատորի ստուգմանը և կայքում կհայտնվի հաստատումից հետո։",
  },
  "adSpaceForm.offers.one": { ru: "предложение", en: "offer", hy: "առաջարկ" },
  "adSpaceForm.offers.many": { ru: "предложений", en: "offers", hy: "առաջարկ" },
  "adSpaceForm.offers.add": { ru: "Добавить предложение", en: "Add an offer", hy: "Ավելացնել առաջարկ" },
  "adSpaceForm.offers.empty": {
    ru: "Пока ни одного предложения — бренду нечего купить.",
    en: "No offers yet — there is nothing for a brand to buy.",
    hy: "Դեռ ոչ մի առաջարկ չկա․ բրենդին գնելու բան չկա։",
  },
  "adSpaceForm.offers.namePlaceholder": {
    ru: "Например: месяц на щите",
    en: "For example: a month on the board",
    hy: "Օրինակ՝ մեկ ամիս վահանակին",
  },
  "adSpaceForm.offers.period": { ru: "Период", en: "Period", hy: "Ժամկետ" },
  "adSpaceForm.offers.periodPlaceholder": {
    ru: "месяц / неделя / кампания",
    en: "month / week / campaign",
    hy: "ամիս / շաբաթ / արշավ",
  },
  "adSpaceForm.errChannelRequired": { ru: "Выберите канал.", en: "Pick a channel.", hy: "Ընտրեք ալիքը։" },
  "adSpaceForm.errTitleRequired": {
    ru: "Введите название хотя бы на одном языке.",
    en: "Enter a title in at least one language.",
    hy: "Մուտքագրեք անվանումն առնվազն մեկ լեզվով։",
  },
  "adSpaceForm.errDateOrder": {
    ru: "Дата «доступно до» раньше даты «доступно с».",
    en: "The “available to” date is earlier than the “available from” date.",
    hy: "«Հասանելի է մինչև» ամսաթիվն ավելի վաղ է, քան «հասանելի է սկսած» ամսաթիվը։",
  },
  "adSpaceForm.errCode": {
    ru: "Не удалось выдать номер месту — попробуйте сохранить ещё раз.",
    en: "Could not assign a code to the space — try saving again.",
    hy: "Չհաջողվեց տարածքին համար տրամադրել․ փորձեք նորից պահպանել։",
  },
};

/** Build a UI translator bound to a locale. Supports `{token}` interpolation
 *  via a second argument, e.g. t("catalog.showingProjectsPrefix"). */
/**
 * Localize a raw DB value from a closed set (genre, role, gender) via
 * a `${prefix}.${value}` dict key. Falls back to the raw value when there's no
 * translation (e.g. a custom genre an admin typed), so nothing ever renders a
 * bare key. Free-text content (title/synopsis) is NOT handled here.
 */
export function localizeValue(
  locale: Locale,
  prefix: string,
  value: string | null | undefined,
): string {
  if (!value) return "";
  return UI[`${prefix}.${value}`]?.[locale] ?? value;
}

export function makeUI(locale: Locale) {
  return function t(key: string, vars?: Record<string, string | number>): string {
    let s = UI[key]?.[locale] ?? UI[key]?.en ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        s = s.replaceAll(`{${k}}`, String(v));
      }
    }
    return s;
  };
}

/** The dictionary slice client components need, resolved to a single locale
 *  (same ru→en→key / [prefix].[value]→value fallback as t()/localizeValue()
 *  above, applied here since the client only ever sees one locale's worth of
 *  strings). Passed down from the root layout via <I18nProvider> — see
 *  i18n-client.tsx. CLIENT_KEYS/CLIENT_PREFIXES are generated by
 *  `npm run i18n:keys` (scripts/gen-i18n-client-keys.mjs) from a static scan
 *  of every "use client" file; `--check` mode of that script (wired into the
 *  test suite) fails the build if a client file starts using a key this
 *  slice doesn't cover. */
export function clientDict(locale: Locale): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of CLIENT_KEYS) {
    out[key] = UI[key]?.[locale] ?? UI[key]?.en ?? key;
  }
  for (const prefix of CLIENT_PREFIXES) {
    for (const key of Object.keys(UI)) {
      if (key.startsWith(prefix)) {
        out[key] = UI[key]?.[locale] ?? UI[key]?.en ?? key;
      }
    }
  }
  return out;
}
