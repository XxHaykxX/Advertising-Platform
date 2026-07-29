/* i18n core (client-safe). Locale is stored in the `locale` cookie and drives
   server rendering. This UI dictionary covers static chrome (nav, hero, forms,
   footer, catalog filters, report labels, legal page shells) — long legal
   body text and DB-sourced content (project titles/synopsis, partner
   taglines, portfolio metric keys) stay English-only for now (TODO: move to
   the `Content` i18n mechanism once that lands). */

export const LOCALES = ["ru", "en", "hy"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "hy";
export const LOCALE_COOKIE = "locale";

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}

/** Locale tag for Intl/Date APIs (toLocaleDateString, etc). */
export function intlLocale(locale: Locale): string {
  return locale === "ru" ? "ru-RU" : locale === "hy" ? "hy-AM" : "en-US";
}

type Dict = Record<Locale, string>;

export const UI: Record<string, Dict> = {
  // ── header nav ──────────────────────────────
  "nav.catalog": { ru: "Каталог", en: "Catalog", hy: "Նախագծեր" },
  "nav.how": { ru: "Как это работает", en: "How It Works", hy: "Ինչպես է աշխատում" },
  "nav.portfolio": { ru: "Портфолио", en: "Portfolio", hy: "Պորտֆոլիո" },
  "nav.partners": { ru: "Партнёры", en: "Partners", hy: "Գործընկերներ" },
  "nav.faq": { ru: "Вопросы и ответы", en: "FAQ", hy: "Հաճախ տրվող հարցեր" },
  "nav.about": { ru: "О нас", en: "About", hy: "Մեր մասին" },
  "nav.contact": { ru: "Контакты", en: "Contact", hy: "Կոնտակտներ" },
  "nav.signIn": { ru: "Войти", en: "Sign In", hy: "Մուտք" },
  "nav.register": { ru: "Регистрация", en: "Register", hy: "Գրանցում" },
  "nav.signInUp": { ru: "Войти / Регистрация", en: "Sign In / Up", hy: "Մուտք / Գրանցում" },
  "nav.cabinet": { ru: "Кабинет", en: "Dashboard", hy: "Անձնական էջ" },
  "nav.logout": { ru: "Выйти", en: "Log out", hy: "Դուրս գալ" },
  "nav.browseProjects": { ru: "Смотреть проекты", en: "Browse Projects", hy: "Տեսնել նախագծերը" },
  "nav.callUs": { ru: "Позвонить", en: "Call us", hy: "Զանգահարել" },
  "nav.openMenu": { ru: "Открыть меню", en: "Open menu", hy: "Բացել ընտրացանկը" },
  "nav.closeMenu": { ru: "Закрыть меню", en: "Close menu", hy: "Փակել ընտրացանկը" },

  // ── logout confirm popup ────────────────────
  "logout.confirmTitle": { ru: "Выйти из аккаунта?", en: "Log out?", hy: "Դուրս գա՞լ հաշվից" },
  "logout.confirmMessage": {
    ru: "Вы уверены, что хотите выйти?",
    en: "Are you sure you want to log out?",
    hy: "Համոզվա՞ծ եք, որ ցանկանում եք դուրս գալ։",
  },
  "logout.confirmYes": { ru: "Да, выйти", en: "Yes, log out", hy: "Այո, դուրս գալ" },
  "logout.confirmNo": { ru: "Отмена", en: "No", hy: "Ոչ" },

  "about.heroTitle": { ru: "О нас", en: "About us", hy: "Մեր մասին" },
  "about.heroSubtitle": {
    ru: "iGovazd — маркетплейс, который соединяет бренды с создателями фильмов и контента для честного product placement.",
    en: "iGovazd is a marketplace connecting brands with film and content creators for authentic product placement.",
    hy: "iGovazd-ը շուկա է, որ կապում է բրենդներին ֆիլմերի ու բովանդակության ստեղծագործողների հետ՝ ազնիվ ապրանքի տեղաբաշխման համար։",
  },
  "about.missionTitle": { ru: "Наша миссия", en: "Our mission", hy: "Մեր առաքելությունը" },
  "about.missionBody": {
    ru: "Мы делаем размещение брендов в кино и контенте простым, прозрачным и доступным. Бренды находят подходящие проекты, а создатели получают финансирование — без посредников и лишних сложностей.",
    en: "We make brand placement in film and content simple, transparent and accessible. Brands find the right projects, creators get funding — without middlemen or friction.",
    hy: "Մենք բրենդների տեղաբաշխումը կինոյում ու բովանդակության մեջ դարձնում ենք պարզ, թափանցիկ և հասանելի։ Բրենդները գտնում են հարմար նախագծեր, ստեղծագործողները՝ ֆինանսավորում՝ առանց միջնորդների ու ավելորդ բարդությունների։",
  },
  "about.forBrandsTitle": { ru: "Для брендов", en: "For brands", hy: "Բրենդների համար" },
  "about.forBrandsBody": {
    ru: "Просматривайте проекты, выбирайте подходящие форматы и связывайтесь с создателями напрямую. Ваш продукт — в руках любимых героев зрителей.",
    en: "Browse projects, pick the right formats and reach creators directly. Your product — in the hands of the characters audiences love.",
    hy: "Դիտեք նախագծերը, ընտրեք հարմար ձևաչափերը և ուղիղ կապվեք ստեղծագործողների հետ։ Ձեր ապրանքը՝ հանդիսատեսի սիրելի հերոսների ձեռքում։",
  },
  "about.forCreatorsTitle": { ru: "Для создателей", en: "For creators", hy: "Ստեղծագործողների համար" },
  "about.forCreatorsBody": {
    ru: "Разместите свой проект, покажите возможности для брендов и получайте финансирование под съёмки — сохраняя творческий контроль.",
    en: "List your project, showcase opportunities for brands and secure funding for production — while keeping creative control.",
    hy: "Տեղադրեք ձեր նախագիծը, ցույց տվեք բրենդների հնարավորությունները և ապահովեք ֆինանսավորում նկարահանումների համար՝ պահպանելով ստեղծագործական վերահսկողությունը։",
  },
  "about.ctaTitle": { ru: "Готовы начать?", en: "Ready to start?", hy: "Պատրա՞ստ եք սկսել։" },
  "about.ctaBody": {
    ru: "Изучите активные проекты или зарегистрируйтесь, чтобы разместить свой.",
    en: "Explore active projects or register to list your own.",
    hy: "Ուսումնասիրեք ակտիվ նախագծերը կամ գրանցվեք՝ ձերը տեղադրելու համար։",
  },
  "about.registerCta": { ru: "Зарегистрироваться", en: "Register", hy: "Գրանցվել" },
  "about.heroEyebrow": {
    ru: "Маркетплейс product placement",
    en: "Product-placement marketplace",
    hy: "Փրոդակթ փլեյսմենթի շուկա",
  },
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
    hy: "Բրենդներն ու ստեղծագործողները շփվում են ուղիղ՝ ավելի արագ գործարքներ, ավելի արդար պայմաններ։",
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
  "btn.requestDetails": { ru: "Связаться", en: "Contact us", hy: "Կապվել" },
  "btn.removeInterest": { ru: "Убрать из интересов", en: "Remove from Interests", hy: "Հանել հետաքրքրություններից" },
  "btn.removeFavorite": { ru: "Убрать", en: "Remove", hy: "Հեռացնել" },
  "cta.loginToApply": {
    ru: "Войдите, чтобы оставить заявку",
    en: "Sign in to express interest",
    hy: "Մուտք գործեք հայտ ուղարկելու համար",
  },
  "btn.browseProjects": { ru: "Смотреть проекты", en: "Browse Projects", hy: "Տեսնել նախագծերը" },
  "btn.viewAll": { ru: "Смотреть все", en: "View All", hy: "Դիտել բոլորը" },
  "btn.listProject": { ru: "Разместить проект", en: "List Your Project", hy: "Ավելացնել նախագիծ" },
  "btn.send": { ru: "Отправить", en: "Send", hy: "Ուղարկել" },
  "btn.sending": { ru: "Отправка…", en: "Sending…", hy: "Ուղարկվում է…" },
  "btn.submit": { ru: "Отправить", en: "Submit", hy: "Ուղարկել" },
  "btn.close": { ru: "Закрыть", en: "Close", hy: "Փակել" },
  "btn.showAll": { ru: "Показать все", en: "Show All", hy: "Ցուցադրել բոլորը" },
  "btn.showLess": { ru: "Свернуть", en: "Show Less", hy: "Ցուցադրել քիչ" },
  "btn.share": { ru: "Поделиться", en: "Share", hy: "Կիսվել" },
  "btn.registerAsPublisher": { ru: "Регистрация как продюсер", en: "Register as Publisher", hy: "Գրանցվել որպես պրոդյուսեր" },
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
  "poster.withLogo": { ru: "Логотип создателя на постере", en: "Creator logo on poster", hy: "Ստեղծագործողի լոգոն պաստառի վրա" },
  "poster.noAvatarHint": {
    ru: "Сначала загрузите аватар в профиле",
    en: "Upload an avatar in your profile first",
    hy: "Նախ վերբեռնեք ձեր պրոֆիլի ավատարը",
  },
  "poster.customText": { ru: "Текст на постере (необязательно)", en: "Text on poster (optional)", hy: "Տեքստ պաստառի վրա (ոչ պարտադիր)" },
  "poster.customTextPlaceholder": { ru: "Оставьте пустым — без текста", en: "Leave empty for no text", hy: "Թողեք դատարկ՝ առանց տեքստի" },
  "poster.fromImage": { ru: "Из своего изображения", en: "From my image", hy: "Իմ նկարից" },
  "poster.fromLibrary": { ru: "Из библиотеки", en: "From library", hy: "Գրադարանից" },
  "poster.error": { ru: "Не удалось сгенерировать постер", en: "Poster generation failed", hy: "Չհաջողվեց ստեղծել պաստառը" },

  // ── footer ──────────────────────────────────
  "footer.tagline": {
    ru: "Находите премиальные возможности для брендированного плейсмента в кино и на ТВ.",
    en: "Discover premium brand placement opportunities in film and TV.",
    hy: "Բացահայտեք բրենդային տեղադրման պրեմիում հնարավորություններ կինոյում և հեռուստատեսությունում։",
  },
  "footer.product": { ru: "Продукт", en: "Product", hy: "Արտադրանք" },
  "footer.company": { ru: "Компания", en: "Company", hy: "Ընկերություն" },
  "footer.legal": { ru: "Правовая информация", en: "Legal", hy: "Իրավական տեղեկություններ" },
  "footer.contacts": { ru: "Контакты", en: "Contacts", hy: "Կոնտակտներ" },
  "footer.browseProjects": { ru: "Смотреть проекты", en: "Browse Projects", hy: "Դիտել նախագծերը" },
  "footer.howItWorks": { ru: "Как это работает", en: "How It Works", hy: "Ինչպես է աշխատում" },
  "footer.portfolio": { ru: "Портфолио", en: "Portfolio", hy: "Պորտֆոլիո" },
  "footer.partners": { ru: "Партнёры", en: "Partners", hy: "Գործընկերներ" },
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
  "catalog.signIn": { ru: "Войти", en: "Sign In", hy: "Մուտք" },
  "catalog.register": { ru: "Регистрация", en: "Register", hy: "Գրանցում" },
  "catalog.filters": { ru: "Фильтры", en: "Filters", hy: "ՖԻԼՏՐՆԵՐ" },
  "catalog.genre": { ru: "Жанр", en: "Genre", hy: "Ժանր" },
  "catalog.targetAudience": { ru: "Целевая аудитория", en: "Target Audience", hy: "Թիրախային լսարան" },
  "catalog.gender": { ru: "Пол", en: "Gender", hy: "Սեռ" },
  "catalog.genderAll": { ru: "Все", en: "All", hy: "Բոլորը" },
  "catalog.genderMale": { ru: "Мужской", en: "Male", hy: "Արական" },
  "catalog.genderFemale": { ru: "Женский", en: "Female", hy: "Իգական" },

  // ── Localized data-value labels (closed sets rendered from DB values) ──
  // Keyed by the raw DB value; localizeValue() falls back to the raw value
  // for anything not listed (e.g. a custom genre an admin types).
  "gender.All": { ru: "Все", en: "All", hy: "Բոլորը" },
  "gender.Male": { ru: "Мужской", en: "Male", hy: "Արական" },
  "gender.Female": { ru: "Женский", en: "Female", hy: "Իգական" },
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
  "catalog.min": { ru: "Мин", en: "Min", hy: "Նվազ." },
  "catalog.max": { ru: "Макс", en: "Max", hy: "Առավ." },
  "catalog.status": { ru: "Статус", en: "Status", hy: "Կարգավիճակ" },
  "catalog.format": { ru: "Формат", en: "Format", hy: "Ձևաչափ" },
  // 5.8: explicit bucket for rows whose formatCategory heuristic found nothing
  // (deriveFormatCategory can legitimately return "") — lets a visitor opt
  // into seeing them instead of the value silently vanishing from every
  // specific-format selection.
  "catalog.formatUnspecified": { ru: "Не указан", en: "Unspecified", hy: "Չնշված" },
  "catalog.age": { ru: "Возраст", en: "Age", hy: "Տարիք" },
  "catalog.platform": { ru: "Платформа", en: "Platform", hy: "Հարթակ" },
  "catalog.clearAll": { ru: "Сбросить всё", en: "Clear All", hy: "Մաքրել բոլորը" },
  "catalog.showResults": { ru: "Показать", en: "Show", hy: "Ցուցադրել" },
  "catalog.searchPlaceholder": {
    ru: "Поиск по жанру, рынку, ключевым словам…",
    en: "Search by genre, market, keyword…",
    hy: "Փնտրել ըստ վերնագրի, ժանրի կամ անվան...",
  },
  "catalog.sortMostRelevant": { ru: "Сначала релевантные", en: "Most relevant", hy: "Առավել համապատասխան" },
  "catalog.sortViews": { ru: "Просмотры", en: "Views", hy: "Դիտումներ" },
  "catalog.sortBudget": { ru: "Бюджет", en: "Budget", hy: "Բյուջե" },
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
  "catalog.projectSingular": { ru: "проект", en: "project", hy: "նախագիծ" },
  "catalog.projectPlural": { ru: "проектов", en: "projects", hy: "նախագիծ" },
  "catalog.noResults": {
    ru: "Нет проектов, соответствующих фильтрам.",
    en: "No projects match your filters.",
    hy: "Համապատասխան նախագիծ չի գտնվել։ Փորձեք փոխել ֆիլտրները։",
  },
  "catalog.until": { ru: "До", en: "Until", hy: "Մինչև" },

  // ── project card / row ──────────────────────
  "card.projectedViews": { ru: "прогноз. просмотров", en: "projected views", hy: "կանխատեսվող դիտում" },
  "card.release": { ru: "Выход", en: "Release", hy: "Թողարկում" },
  "card.applicationsUntil": { ru: "Заявки до", en: "Applications until", hy: "Հայտեր՝ մինչև" },
  "card.slotsAvailable": { ru: "мест доступно", en: "slots available", hy: "հասանելի տեղ" },
  // Owner request 2026-07-28: say on the card how many placement opportunities
  // a project carries, the way the competing marketplaces do.
  "card.placementsOne": { ru: "вариант размещения", en: "placement", hy: "փլեյսմենթ" },
  "card.placementsMany": { ru: "варианта размещения", en: "placements", hy: "փլեյսմենթ" },

  // ── forms (shared) ──────────────────────────
  "form.name": { ru: "Имя", en: "Name", hy: "Անուն" },
  "form.namePlaceholder": { ru: "Ваше имя", en: "Your name", hy: "Ձեր անունը" },
  "form.phone": { ru: "Телефон", en: "Phone", hy: "Հեռախոս" },
  "form.email": { ru: "Email", en: "Email", hy: "Էլ. փոստ" },
  "form.company": { ru: "Компания", en: "Company", hy: "Ընկերություն" },
  "form.companyPlaceholder": { ru: "Ваша компания", en: "Your company", hy: "Ձեր ընկերությունը" },
  "form.message": { ru: "Сообщение", en: "Message", hy: "Հաղորդագրություն" },
  "form.send": { ru: "Отправить", en: "Send", hy: "Ուղարկել" },
  "form.consent": {
    ru: "Я согласен на обработку персональных данных",
    en: "I agree to the processing of my personal data",
    hy: "Համաձայն եմ անձնական տվյալների մշակմանը",
  },

  // ── stats section ────────────────────────────
  "stats.averageCpm": { ru: "Средний CPM", en: "Average CPM", hy: "Միջին CPM" },
  "stats.higherBrandRecall": { ru: "Выше запоминаемость бренда", en: "Higher Brand Recall", hy: "Ավելի բարձր բրենդի հիշարժանություն" },
  "stats.avgProjectedViews": { ru: "Средний прогноз просмотров", en: "Avg Projected Views", hy: "Միջին կանխատեսվող դիտումներ" },
  "stats.brandRecallRate": { ru: "Уровень запоминаемости бренда", en: "Brand Recall Rate", hy: "Բրենդի հիշարժանության մակարդակ" },

  // ── trust section ─────────────────────────────
  "trust.scriptsAnalyzedNumber": { ru: "100 000+", en: "100,000+", hy: "100%" },
  "trust.scriptsAnalyzedTitle": { ru: "сценариев проанализировано", en: "scripts analyzed", hy: "ապահով գործարք" },
  "trust.scriptsAnalyzedCaption": {
    ru: "с полной аналитикой по бренду",
    en: "with comprehensive brand intelligence",
    hy: "Երաշխավորված վճարումներ և իրավական պաշտպանվածություն",
  },
  "trust.countriesNumber": { ru: "100+", en: "100+", hy: "50+" },
  "trust.countriesTitle": { ru: "стран охвачено", en: "countries covered", hy: "Վստահելի գործընկերներ" },
  "trust.countriesCaption": {
    ru: "доступно на крупнейших рынках мира",
    en: "available in major markets worldwide",
    hy: "Համագործակցություններ ստուգված մեդիա նախագծերի հեղինակների hետ։",
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
  "getStarted.title": { ru: "Начните", en: "Get Started", hy: "Միացեք հիմա" },
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
    hy: "Փրոդակթ փլեյսմենթը տասնամյակներ շարունակ մնացել է խափանված համակարգ։ Ստեղծագործողները դժվարանում են մոնետիզացնել իրենց պատմությունները, իսկ բրենդները շրջում են անթափանց ցանցերում՝ վճարելով գերագնահատված գումարներ այն տեղադրումների համար, որոնք գուցե երբեք չհասնեն էկրան։ Ամեն ինչ արվում է ձեռքով, անարդյունավետ և հասանելի է միայն կապերի միջոցով։",
  },
  "why.paragraph2": {
    ru: "Мы создали iGovazd, чтобы это изменить. Делая плейсмент прозрачным, основанным на данных и доступным, мы даём создателям возможность контролировать свою судьбу и помогаем брендам делать более разумный, аутентичный выбор о том, где появляется их продукт.",
    en: "We built iGovazd to change that. By making placement transparent, data-driven, and accessible, we empower creators to control their own destiny and help brands make smarter, more authentic choices about where their products appear.",
    hy: "Մենք ստեղծել ենք iGovazd-ը՝ դա փոխելու համար։ Դարձնելով տեղադրումը թափանցիկ, տվյալահեն և հասանելի, մենք հնարավորություն ենք տալիս ստեղծագործողներին վերահսկել իրենց ճակատագիրը և օգնում ենք բրենդներին ավելի խելացի, ինքնատիպ ընտրություն կատարել այն մասին, թե որտեղ է հայտնվում իրենց ապրանքը։",
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
  // wrong keys when her sheet was applied (2026-07-27). The numbering also
  // left her question text ("1. Ինչպե՞ս…"); it's dropped here, since the
  // accordion is the numbering.
  "faq.q1.question": {
    ru: "Как работает платформа?",
    en: "How does the platform work?",
    hy: "Ինչպե՞ս է աշխատում հարթակը։",
  },
  "faq.q1.answer": {
    ru: "Создатели размещают проект вместе с пакетами плейсмента, бренды изучают каталог и посценовый отчёт. Бренд отправляет заявку с брифом и бюджетом, создатель принимает её или отклоняет, а условия обсуждаются внутри платформы — без посредников.",
    en: "Creators list a project together with its placement packages, and brands explore the catalog and the scene-level report. A brand sends an application with its brief and budget, the creator accepts or declines it, and the terms are agreed inside the platform, with no middlemen.",
    hy: "Ստեղծագործողներն ավելացնում են նախագիծը և տեղադրման փաթեթները, բրենդներն ուսումնասիրում են կատալոգը և տեսարան առ տեսարան հաշվետվությունը։ Բրենդն ուղարկում է հայտ՝ բրիֆով և բյուջեով, ստեղծագործողն ընդունում կամ մերժում է այն, իսկ պայմանները քննարկվում են հարթակի ներսում՝ առանց միջնորդների։",
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
    ru: "Как заключается договор и как проходит оплата?",
    en: "How are contracts signed and payments handled?",
    hy: "Ինչպե՞ս է իրականացվում պայմանագրի կնքումը և վճարումը։",
  },
  "faq.q3.answer": {
    ru: "В заявке бренда уже указано, что размещаем, в какие сроки и в какой форме идёт расчёт — оплатой или бартером. Когда обе стороны согласны, договор заключается напрямую между ними, а платформа хранит историю переписки и согласованные условия. Расчёты идут между брендом и продакшеном, платформа в них не встаёт.",
    en: "A brand's application already states what is being placed, on what timeline, and in what form the settlement happens — payment or barter. Once both sides agree, the contract is signed directly between them, while the platform keeps the message history and the agreed terms. Money moves between the brand and the production; the platform does not sit in the middle.",
    hy: "Բրենդի հայտում արդեն նշված են՝ ինչ ենք տեղադրում, ինչ ժամկետներում և ինչ ձևով է կատարվում հաշվարկը՝ վճարով, թե բարտերով։ Երբ երկու կողմերն էլ համաձայն են, պայմանագիրը կնքվում է ուղղակիորեն նրանց միջև, իսկ հարթակը պահպանում է նամակագրության պատմությունը և համաձայնեցված պայմանները։ Հաշվարկները կատարվում են բրենդի և արտադրողի միջև՝ առանց հարթակի միջնորդության։",
  },
  "faq.q4.question": {
    ru: "Какие гарантии получают бренды?",
    en: "What guarantees do brands get?",
    hy: "Ի՞նչ երաշխիքներ են ստանում բրենդները։",
  },
  "faq.q4.answer": {
    ru: "Проекты проходят модерацию до публикации: команда проверяет данные продакшена, оценки аудитории и анализ сценария. Занятые слоты видны в пакете, поэтому эксклюзивное размещение не может быть продано дважды. Контакты сторон не показываются в открытом каталоге и раскрываются только участникам сделки.",
    en: "Projects are moderated before they go live: the team checks the production details, the audience estimates and the script analysis. Taken slots are visible inside each package, so an exclusive placement cannot be sold twice. Contact details are never shown in the public catalog — they are revealed only to the parties in a deal.",
    hy: "Նախագծերը հրապարակումից առաջ անցնում են մոդերացիա. թիմը ստուգում է արտադրության տվյալները, լսարանի գնահատականները և սցենարի վերլուծությունը։ Զբաղված տեղերը երևում են փաթեթում, ուստի բացառիկ տեղադրումը չի կարող վաճառվել երկու անգամ։ Կողմերի կոնտակտային տվյալները բաց կատալոգում չեն ցուցադրվում և բացվում են միայն գործարքի մասնակիցներին։",
  },
  "faq.q5.question": {
    ru: "Какую комиссию берёт платформа?",
    en: "What does the platform charge?",
    hy: "Որքա՞ն միջնորդավճար է վերցնում հարթակը։",
  },
  "faq.q5.answer": {
    ru: "Размещение проекта и просмотр каталога бесплатны. Комиссия берётся только тогда, когда сделка действительно закрывается — предоплаты и скрытых платежей нет. Размер комиссии стороны узнают до подписания договора.",
    en: "Listing a project and browsing the catalog are free. A fee applies only when a deal actually closes — there are no upfront or hidden costs, and both sides know the rate before the contract is signed.",
    hy: "Նախագծի ավելացումը և կատալոգի դիտումն անվճար են։ Միջնորդավճարը վերցվում է միայն այն դեպքում, երբ գործարքն իրականում կնքվում է՝ առանց նախավճարի և թաքնված վճարների։ Միջնորդավճարի չափը կողմերին հայտնի է դառնում մինչև պայմանագրի կնքումը։",
  },
  "faq.q6.question": {
    ru: "Проходят ли проекты проверку перед публикацией?",
    en: "Are projects checked before they go live?",
    hy: "Արդյո՞ք հարթակում ներկայացված նախագծերն անցնում են նախնական ստուգման փուլով։",
  },
  "faq.q6.answer": {
    ru: "Да. Каждый проект проходит модерацию до появления в каталоге: данные продакшена, оценки просмотров и анализ сценария проверяет наша команда, поэтому цифрам в отчёте можно доверять.",
    en: "Yes. Every project is moderated before it appears in the catalog: production details, viewership estimates and the script analysis are reviewed by our team, so the numbers in a report can be trusted.",
    hy: "Այո։ Յուրաքանչյուր նախագիծ կատալոգում հայտնվելուց առաջ անցնում է մոդերացիա. արտադրության տվյալները, դիտումների գնահատականները և սցենարի վերլուծությունը ստուգում է մեր թիմը, ուստի հաշվետվության թվերին կարելի է վստահել։",
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
    hy: "Պատմեք Ձեր նախագծի կամ բրենդի մասին, կամ պարզապես հարցրեք այն, ինչ հետաքրքրում է Ձեզ։",
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
    hy: "iGovazd-ը կապում է բրենդներին ստեղծագործողների հետ թափանցիկ, արդար գործընթացի միջոցով։ Իմացեք, թե ինչպես սկսել ընդամենը չորս պարզ քայլով։",
  },
  "hiw.forBrandsTitle": { ru: "Для брендов", en: "For Brands", hy: "Բրենդների համար" },
  "hiw.forBrandsSubtitle": {
    ru: "Находите аутентичные возможности для плейсмента в премиальных фильмах и сериалах.",
    en: "Find authentic placement opportunities in premium film and TV productions.",
    hy: "Գտեք ինքնատիպ տեղադրման հնարավորություններ պրեմիում ֆիլմերում և հեռուստասերիալներում։",
  },
  "hiw.forCreatorsTitle": { ru: "Для создателей", en: "For Creators", hy: "Ստեղծագործողների համար" },
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
    hy: "Ուղարկեք տեղադրման պահանջներն ու բյուջեի մանրամասները ստեղծագործողներին։ Համագործակցեք ուղղակիորեն՝ ձեր բրենդին համապատասխան ինքնատիպ տեղադրումներ ստեղծելու համար։",
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
    hy: "Ստեղծեք ձեր ստեղծագործողի պրոֆիլը և հաստատեք ձեր տվյալները։ Բացեք հասանելիություն բրենդային գործընկերությանը և ֆինանսավորման հնարավորություններին։",
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
    hy: "iGovazd-ը կառուցված է թափանցիկության և վստահության վրա։ Ոչ մի թաքնված վճար բրենդների համար, ստեղծագործական վերահսկողություն ստեղծագործողների համար, և հարթակի վճարներ միայն գործարքների կնքման դեպքում։",
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
  "partners.title": { ru: "Наши партнёры", en: "Our Partners", hy: "Մեր գործընկերները" },
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
  "report.backToCatalog": { ru: "Назад к каталогу", en: "Back to Catalog", hy: "Վերադառնալ կատալոգ" },
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
  "report.projectedViews": { ru: "Прогноз. просмотры", en: "Projected Views", hy: "Կանխատեսվող դիտումներ" },
  "report.cpm": { ru: "CPM", en: "CPM", hy: "CPM" },
  // ── report: press-kit additions (Aram) ──
  "cast.crewHeading": { ru: "Команда", en: "Crew", hy: "Թիմ" },
  "cast.castHeading": { ru: "Актёры", en: "Cast", hy: "Դերասաններ" },
  "keyFacts.cinemas": { ru: "Кинотеатры", en: "Cinemas", hy: "Կինոթատրոններ" },
  "keyFacts.comparableTo": { ru: "Сравнимо с", en: "Comparable to", hy: "Համեմատելի է" },
  // Product placement, shown ABOVE the sponsorship packages on the report:
  // the brand inside the story, with a still of the scene. A placement whose
  // price the creator left empty says "on request" instead of a number.
  "report.placementsTitle": { ru: "Продакт-плейсмент", en: "Product placement", hy: "Փրոդակթ փլեյսմենթ" },
  "report.placementsSubtitle": {
    ru: "Где бренд появляется в самой истории",
    en: "Where the brand appears inside the story itself",
    hy: "Որտեղ է բրենդը հայտնվում հենց պատմության մեջ",
  },
  "report.priceOnRequest": { ru: "Цена по запросу", en: "Price on request", hy: "Գինը՝ հարցումով" },
  "investment.sponsorsTitle": { ru: "Пакеты спонсорства", en: "Sponsorship Packages", hy: "Հովանավորության փաթեթներ" },
  "investment.sponsorsSubtitle": {
    ru: "Выберите уровень спонсорства проекта",
    en: "Choose a sponsorship level for the project",
    hy: "Ընտրեք նախագծի հովանավորության մակարդակ",
  },
  "report.slotsAvailable": { ru: "мест доступно", en: "slots available", hy: "հասանելի տեղ" },
  "report.exclusive": { ru: "Эксклюзив", en: "Exclusive", hy: "Բացառիկ" },
  "report.budgetRange": { ru: "Диапазон бюджета", en: "Budget Range", hy: "Բյուջեի միջակայք" },
  "report.status.PRE_PRODUCTION": { ru: "Пре-продакшен", en: "Pre-Production", hy: "Նախապատրաստական փուլ" },
  "report.status.FILMING": { ru: "Съёмки", en: "Filming", hy: "Նկարահանում" },
  "report.status.POST_PRODUCTION": { ru: "Пост-продакшен", en: "Post-Production", hy: "Հետարտադրական փուլ" },
  "report.status.RELEASED": { ru: "Выпущено", en: "Released", hy: "Թողարկված" },
  // Replaces the "Express interest" button once the placement deadline has
  // passed — the page still reads, the offer just can't be made any more.
  "report.offersClosed": {
    ru: "Приём предложений закрыт",
    en: "Offers closed",
    hy: "Առաջարկների ընդունումը փակ է",
  },
  "report.tabs.overview": { ru: "Обзор", en: "Overview", hy: "Ընդհանուր տեսք" },
  // The cast section carries crew as well ("Cast & Creators"), so the tab that
  // points at it is "Team" — owner decision 2026-07-29, four tabs.
  "report.tabs.cast": { ru: "Команда", en: "Team", hy: "Թիմ" },
  "report.tabs.production": { ru: "Производство", en: "Production", hy: "Արտադրություն" },
  // The commercial section (placements + sponsorship) had no tab at all and
  // sat ~3500px down the page. It is the reason a brand is here, so it gets
  // the last tab and is highlighted as the primary one.
  "report.tabs.offer": { ru: "Предложение брендам", en: "For brands", hy: "Առաջարկ բրենդներին" },
  "report.tabs.investment": { ru: "Инвестиции", en: "Investment", hy: "Ներդրում" },
  "report.tabs.more": { ru: "Ещё", en: "More", hy: "Ավելին" },

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
  "completeness.item.cast": { ru: "Актёры и создатели", en: "Cast & creators", hy: "Դերասաններ և ստեղծագործողներ" },
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
    hy: "Բրենդը գալիս է մի կողմից, ստեղծագործողը՝ մյուսից։ Նրանք հանդիպում են հայտի վրա։",
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
  "hiw.flow.creator": { ru: "Создатель", en: "Creator", hy: "Ստեղծագործող" },
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
    hy: "Բրենդը ներկայացնում է հայտ, ստեղծագործողը պատասխանում է",
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
  "format.serialEpisodes": { ru: "{n} эп. × {m} мин", en: "{n} ep × {m} min", hy: "{n} դրվագ × {m} րոպե" },
  "format.filmMinutes": { ru: "{m} мин", en: "{m} min", hy: "{m} րոպե" },

  "cast.title": { ru: "Актёры и создатели", en: "Cast & Creators", hy: "Դերասաններ և ստեղծագործողներ" },
  "cast.subtitle": { ru: "Актёры и создатели, задействованные в проекте", en: "Actors and creators attached to this project", hy: "Այս նախագծին կցված դերասաններ և ստեղծագործողներ" },

  "keyFacts.release": { ru: "Выход", en: "Release", hy: "Թողարկում" },
  "keyFacts.applicationDeadline": { ru: "Срок подачи предложений", en: "Offer deadline", hy: "Առաջարկների ընդունման վերջնաժամկետ" },
  "keyFacts.price": { ru: "Цена", en: "Price", hy: "Գին" },
  "keyFacts.onRequest": { ru: "По запросу", en: "On request", hy: "Ըստ պահանջի" },
  "keyFacts.platforms": { ru: "Где смотреть", en: "Available on", hy: "Հասանելի է" },
  "keyFacts.boxOffice": { ru: "Кассовый сбор", en: "Box office", hy: "Դրամարկղ" },
  "keyFacts.productionBudget": { ru: "Бюджет производства", en: "Production budget", hy: "Արտադրության բյուջե" },
  "report.productionBudget": { ru: "Бюджет производства", en: "Production budget", hy: "Արտադրության բյուջե" },

  // ── report: ROI / express interest banner ──────
  "roi.title": { ru: "Прогноз ROI", en: "Estimated ROI Snapshot", hy: "Կանխատեսվող ROI-ի պատկեր" },
  "roi.projectedViewers": { ru: "Прогноз. зрители", en: "Projected Viewers", hy: "Կանխատեսվող դիտողներ" },
  "roi.projectedViewersTooltip": {
    ru: "Методология: моделируемая аудитория на основе формата, жанра и бенчмарков целевой аудитории.",
    en: "Methodology: modeled viewership derived from format, genre, and audience benchmarks.",
    hy: "Մեթոդաբանություն. մոդելավորված դիտողականություն՝ ձևաչափի, ժանրի և լսարանի չափանիշների հիման վրա։",
  },
  "roi.cpm": { ru: "CPM", en: "CPM", hy: "CPM" },
  "roi.cpmTooltip": {
    ru: "Методология: диапазон цены за тысячу показов, сопоставленный с аналогичными плейсментами.",
    en: "Methodology: cost-per-thousand-impressions range benchmarked against comparable placements.",
    hy: "Մեթոդաբանություն. հազար ցուցադրության արժեքի միջակայք՝ համեմատված նմանատիպ տեղադրումների հետ։",
  },
  "roi.poweredBy": { ru: "Прогнозы основаны на отраслевых бенчмарках.", en: "Projections powered by industry benchmark data.", hy: "Կանխատեսումները հիմնված են ոլորտի չափանիշային տվյալների վրա։" },

  // ── report: investment ──────────────────────────
  "investment.title": { ru: "Инвестиции и что входит", en: "Investment & Deliverables", hy: "Ներդրում և մատուցվող ծառայություններ" },
  "investment.subtitle": { ru: "Пакеты плейсмента и конкурентные цены", en: "Placement packages and competitive pricing", hy: "Տեղադրման փաթեթներ և մրցունակ գներ" },
  "investment.investmentLabel": { ru: "Инвестиции", en: "Investment", hy: "Ներդրում" },
  "investment.item1": { ru: "Проверенные посценовые возможности плейсмента", en: "Verified scene-level placement opportunities", hy: "Ստուգված տեսարան առ տեսարան տեղադրման հնարավորություններ" },
  "investment.item3": { ru: "Прогнозируемые метрики эффективности", en: "Projected performance metrics", hy: "Կանխատեսվող արդյունավետության չափորոշիչներ" },
  "investment.item4": { ru: "Персональный координатор плейсмента", en: "Dedicated placement coordinator", hy: "Հատուկ նշանակված տեղադրման համակարգող" },
  "investment.item5": { ru: "Отчёт об эффективности после кампании", en: "Post-campaign performance reporting", hy: "Հետարշավային արդյունավետության հաշվետվություն" },
  "investment.item6": { ru: "Процесс согласования контента", en: "Content approval workflow", hy: "Բովանդակության հաստատման աշխատընթաց" },
  "investment.howCompares": { ru: "Как это сравнивается", en: "How This Compares", hy: "Ինչպես է սա համեմատվում" },
  "investment.cheaperThanTv": { ru: "≈85% дешевле, чем традиционный ТВ CPM", en: "≈85% cheaper than traditional TV CPM", hy: "≈85%-ով ավելի էժան, քան ավանդական TV CPM-ը" },
  "investment.channel": { ru: "Канал", en: "Channel", hy: "Ալիք" },
  "investment.typicalCost": { ru: "Типичная стоимость", en: "Typical Cost", hy: "Բնորոշ արժեք" },
  "investment.tvCommercial": { ru: "ТВ-реклама (30с)", en: "TV Commercial (30s)", hy: "Հեռուստագովազդ (30վ)" },
  "investment.printAd": { ru: "Печатная реклама", en: "Print Ad Campaign", hy: "Տպագիր գովազդային արշավ" },
  "investment.influencer": { ru: "Партнёрство с блогером", en: "Influencer Partnership", hy: "Ինֆլուենսերի հետ գործընկերություն" },
  "investment.thisPlatform": { ru: "Эта платформа", en: "This Platform", hy: "Այս հարթակը" },
  "investment.bestValue": { ru: "Лучшая цена", en: "Best value", hy: "Լավագույն արժեք" },
  "investment.readyTitle": { ru: "Готовы разместить свой бренд?", en: "Ready to place your brand?", hy: "Պատրա՞ստ եք տեղադրել ձեր բրենդը" },
  "investment.readyBody": {
    ru: "Отправьте заявку, и наша команда свяжется с вами в течение 24 часов.",
    en: "Submit your interest and our team will reach out within 24 hours.",
    hy: "Ուղարկեք ձեր հետաքրքրությունը, և մեր թիմը կկապվի ձեզ հետ 24 ժամվա ընթացքում։",
  },

  // ── report: deep dive ────────────────────────────
  "deepDive.title": { ru: "Подробный разбор", en: "Deep Dive", hy: "Մանրամասն վերլուծություն" },
  "deepDive.subtitle": { ru: "Изучите подробный анализ и данные", en: "Explore detailed analysis and data", hy: "Ուսումնասիրեք մանրամասն վերլուծություն և տվյալներ" },
  "deepDive.allOpportunities": { ru: "Все возможности плейсмента ({n})", en: "All Placement Opportunities ({n})", hy: "Բոլոր տեղադրման հնարավորությունները ({n})" },
  "deepDive.categoryExclusive": { ru: "Эксклюзив категории", en: "Category Exclusive", hy: "Կատեգորիայի էքսկլյուզիվ" },
  "deepDive.totalExposure": { ru: "Общая оценка охвата", en: "Total Est. Exposure", hy: "Ընդհանուր գնահատված ազդեցություն" },
  "deepDive.showing": { ru: "Показано {shown} из {total}", en: "Showing {shown} of {total}", hy: "Ցուցադրված է {shown}՝ {total}-ից" },
  "deepDive.psychographicsTitle": { ru: "Психографика аудитории", en: "Audience Psychographics", hy: "Լսարանի հոգեբանական բնութագիր" },
  "deepDive.noData": { ru: "Нет данных для этого отчёта.", en: "No data available for this report.", hy: "Այս հաշվետվության համար տվյալներ չկան։" },
  "deepDive.valueAlignmentTitle": { ru: "Соответствие ценностям", en: "Value Alignment Details", hy: "Արժեքային համապատասխանության մանրամասներ" },
  "deepDive.signalsTitle": { ru: "Сигналы проекта", en: "Project Signals", hy: "Նախագծի ազդանշաններ" },
  "deepDive.placements": { ru: "Плейсменты", en: "Placements", hy: "Տեղադրումներ" },
  "deepDive.uniqueScenes": { ru: "Уникальные сцены", en: "Unique scenes", hy: "Եզակի տեսարաններ" },
  "deepDive.totalScreenTime": { ru: "Общее экранное время", en: "Total screen time", hy: "Ընդհանուր էկրանային ժամանակ" },
  "deepDive.analysisDate": { ru: "Дата анализа", en: "Analysis date", hy: "Վերլուծության ամսաթիվ" },
  "deepDive.recommendations": { ru: "Рекомендации", en: "Recommendations", hy: "Առաջարկություններ" },
  "deepDive.rec1": { ru: "Ознакомьтесь с полным сценарием перед финализацией сделки с брендом.", en: "Review the full script before finalizing any brand deal.", hy: "Վերանայեք ամբողջական սցենարը նախքան բրենդային ցանկացած գործարքի ավարտը։" },
  "deepDive.rec2": { ru: "Согласуйте посценовое утверждение с юридической службой продакшена.", en: "Coordinate scene-level approval with the production's legal team.", hy: "Համակարգեք տեսարան առ տեսարան հաստատումը արտադրության իրավաբանական թիմի հետ։" },
  "deepDive.rec3": { ru: "Отслеживайте изменения на постпродакшене на предмет поздних правок контента.", en: "Monitor edits during post-production for late content changes.", hy: "Հետևեք հետարտադրական փուլում կատարվող փոփոխություններին՝ ուշացած բովանդակային փոփոխությունների համար։" },
  "deepDive.recommendedFor": { ru: "Рекомендуется для:", en: "Recommended for:", hy: "Խորհուրդ է տրվում." },
  "deepDive.useCautionWith": { ru: "Требует осторожности:", en: "Use caution with:", hy: "Զգուշություն է պահանջում." },

  // ── apply dialog ──────────────────────────────
  "applyDialog.requestTitle": { ru: "Запросить детали", en: "Request Details", hy: "Հարցնել մանրամասներ" },
  "applyDialog.expressTitle": { ru: "Проявить интерес", en: "Express Interest", hy: "Ցուցաբերել հետաքրքրություն" },
  "applyDialog.thanks": { ru: "Спасибо — мы свяжемся с вами в течение 24 часов.", en: "Thanks — we'll get back to you within 24 hours.", hy: "Շնորհակալություն․ մենք կկապվենք ձեզ հետ 24 ժամվա ընթացքում։" },
  "applyDialog.namePlaceholder": { ru: "Ваше имя", en: "Your name", hy: "Ձեր անունը" },
  "applyDialog.phonePlaceholder": { ru: "+374 __ ______", en: "+374 __ ______", hy: "+374 __ ______" },
  "applyDialog.emailPlaceholder": { ru: "you@company.com", en: "you@company.com", hy: "you@company.com" },
  "applyDialog.companyPlaceholder": { ru: "Ваша компания", en: "Your company", hy: "Ձեր ընկերությունը" },
  "applyDialog.messagePlaceholder": {
    ru: "Расскажите о своём бренде и целях плейсмента…",
    en: "Tell us about your brand and placement goals…",
    hy: "Պատմեք ձեր բրենդի և տեղադրման նպատակների մասին…",
  },
  "applyDialog.consentPrefix": {
    ru: "Я согласен на то, что со мной свяжутся по этому запросу, и принимаю",
    en: "I agree to be contacted regarding this inquiry and accept the",
    hy: "Համաձայն եմ, որ ինձ հետ կկապվեն այս հարցման կապակցությամբ և ընդունում եմ",
  },
  "applyDialog.privacyPolicy": { ru: "Политику конфиденциальности", en: "Privacy Policy", hy: "Գաղտնիության քաղաքականությունը" },

  // ── application / contact form validation (F11/F12) ──
  "formErr.name": { ru: "Введите ваше имя.", en: "Please enter your name.", hy: "Մուտքագրեք ձեր անունը։" },
  "formErr.nameLong": { ru: "Имя слишком длинное.", en: "Name is too long.", hy: "Անունը չափազանց երկար է։" },
  "formErr.phone": { ru: "Введите номер телефона.", en: "Please enter your phone number.", hy: "Մուտքագրեք ձեր հեռախոսահամարը։" },
  "formErr.phoneLong": { ru: "Номер телефона слишком длинный.", en: "Phone number is too long.", hy: "Հեռախոսահամարը չափազանց երկար է։" },
  "formErr.email": { ru: "Введите вашу эл. почту.", en: "Please enter your email.", hy: "Մուտքագրեք ձեր էլ. փոստը։" },
  "formErr.emailLong": { ru: "Эл. почта слишком длинная.", en: "Email is too long.", hy: "Էլ. փոստը չափազանց երկար է։" },
  "formErr.emailInvalid": { ru: "Введите корректный адрес эл. почты.", en: "Please enter a valid email address.", hy: "Մուտքագրեք վավեր էլ. փոստի հասցե։" },
  "formErr.messageLong": { ru: "Сообщение слишком длинное.", en: "Message is too long.", hy: "Հաղորդագրությունը չափազանց երկար է։" },
  "formErr.consent": { ru: "Подтвердите согласие на обратную связь.", en: "Please confirm you agree to be contacted.", hy: "Հաստատեք, որ համաձայն եք կապ հաստատելուն։" },
  "formErr.rateLimit": { ru: "Слишком много запросов. Попробуйте позже.", en: "Too many requests. Please try again later.", hy: "Չափազանց շատ հարցումներ։ Փորձեք ավելի ուշ։" },
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
  "login.subtitle": { ru: "Войдите в аккаунт бренда или создателя.", en: "Sign in to your brand or creator account.", hy: "Մուտք գործեք ձեր բրենդի կամ ստեղծագործողի հաշիվ։" },
  "login.emailPlaceholder": { ru: "you@brand.com", en: "you@brand.com", hy: "you@company.com" },
  "login.password": { ru: "Пароль", en: "Password", hy: "Գաղտնաբառ" },
  "login.signIn": { ru: "Войти", en: "Sign In", hy: "Մուտք" },
  "login.notBrandYet": { ru: "Ещё нет бренд-аккаунта?", en: "Not a brand account yet?", hy: "Դեռ չունե՞ք բրենդային հաշիվ" },
  "login.expressInterestInstead": { ru: "Проявите интерес вместо этого", en: "Express Interest instead", hy: "Փոխարենը ցուցաբերեք հետաքրքրություն" },
  "login.creatorOrAdmin": { ru: "Создатель или админ?", en: "Creator or admin?", hy: "Ստեղծագործո՞ղ եք կամ ադմին" },
  "login.goToAdminLogin": { ru: "Перейти к входу в админку", en: "Go to admin login", hy: "Անցնել ադմինի մուտք" },

  "register.title": { ru: "Регистрация", en: "Create Account", hy: "Գրանցում" },
  "register.subtitle": {
    ru: "Создайте аккаунт бренда или создателя — доступ открывается сразу после регистрации.",
    en: "Create a brand or creator account — access opens right after you sign up.",
    hy: "Ստեղծեք բրենդի կամ ստեղծագործողի հաշիվ․ հասանելիությունը բացվում է գրանցումից անմիջապես հետո։",
  },
  "register.fullName": { ru: "Полное имя", en: "Full name", hy: "Լրիվ անուն" },
  "register.fullNamePlaceholder": { ru: "Иван Иванов", en: "Jane Doe", hy: "Անուն Ազգանուն" },
  "register.workEmail": { ru: "Рабочий email", en: "Work email", hy: "Աշխատանքային էլ. փոստ" },
  "register.emailPlaceholderBrand": { ru: "you@brand.com", en: "you@brand.com", hy: "you@company.com" },
  "register.emailPlaceholderCreator": { ru: "you@studio.com", en: "you@studio.com", hy: "you@company.com" },
  "register.companyPlaceholder": { ru: "Название компании", en: "Brand Inc.", hy: "Ընկերության անվանում" },
  "register.creatorOrg": { ru: "Студия / Псевдоним", en: "Studio / Alias", hy: "Ստուդիա / Կեղծանուն" },
  "register.creatorOrgPlaceholder": { ru: "Название студии или псевдоним", en: "Studio name or alias", hy: "Ստուդիայի անվանում կամ կեղծանուն" },
  "register.expressInterest": { ru: "Проявить интерес", en: "Express Interest", hy: "Ցուցաբերել հետաքրքրություն" },
  "register.alreadyHaveAccess": { ru: "Уже есть доступ?", en: "Already have access?", hy: "Արդեն ունե՞ք հասանելիություն" },
  "register.signIn": { ru: "Войти", en: "Sign in", hy: "Մուտք" },
  "register.creatorOrAdmin": { ru: "Создатель или админ?", en: "Creator or admin?", hy: "Ստեղծագործո՞ղ եք կամ ադմին" },
  "register.goToAdminLogin": { ru: "Перейти к входу в админку", en: "Go to admin login", hy: "Անցնել ադմինի մուտք" },

  // ── auth: register (brand + creator self-serve) ──
  "register.accountType": { ru: "Тип аккаунта", en: "Account type", hy: "Հաշվի տեսակ" },
  "register.typeBrand": { ru: "Бренд", en: "Brand", hy: "Բրենդ" },
  "register.typeCreator": { ru: "Создатель", en: "Creator", hy: "Ստեղծագործող" },
  "register.typeBrandHint": { ru: "Хочу разместить бренд в проектах", en: "Place my brand in productions", hy: "Տեղադրել իմ բրենդը նախագծերում" },
  "register.typeCreatorHint": { ru: "Монетизирую свой контент плейсментом", en: "Monetize my content with placement", hy: "Մոնետիզացնել իմ բովանդակությունը տեղադրումով" },
  "register.password": { ru: "Пароль", en: "Password", hy: "Գաղտնաբառ" },
  "register.passwordPlaceholder": { ru: "Минимум 8 символов", en: "At least 8 characters", hy: "Առնվազն 8 նիշ" },
  "register.submit": { ru: "Зарегистрироваться", en: "Create account", hy: "Գրանցվել" },
  "register.pendingTitle": { ru: "Заявка отправлена", en: "Registration received", hy: "Հայտն ուղարկված է" },
  "register.pendingBody": {
    ru: "Ваш аккаунт ожидает одобрения администратора. Мы сообщим, когда доступ будет открыт.",
    en: "Your account is awaiting admin approval. We'll let you know once access is granted.",
    hy: "Ձեր հաշիվը սպասում է ադմինի հաստատմանը։ Կտեղեկացնենք, երբ հասանելիությունը բացվի։",
  },
  "register.errEmailTaken": { ru: "Этот email уже зарегистрирован.", en: "This email is already registered.", hy: "Այս էլ. փոստն արդեն գրանցված է։" },
  "register.errFields": { ru: "Заполните все обязательные поля.", en: "Please fill in all required fields.", hy: "Լրացրեք բոլոր պարտադիր դաշտերը։" },
  "register.errPasswordShort": { ru: "Пароль должен быть не короче 8 символов.", en: "Password must be at least 8 characters.", hy: "Գաղտնաբառը պետք է լինի առնվազն 8 նիշ։" },

  // ── auth: login errors ──
  "login.errInvalid": { ru: "Неверный email или пароль.", en: "Incorrect email or password.", hy: "Սխալ էլ. փոստ կամ գաղտնաբառ։" },
  "login.errPending": { ru: "Аккаунт ожидает одобрения администратора.", en: "Your account is awaiting admin approval.", hy: "Ձեր հաշիվը սպասում է ադմինի հաստատմանը։" },
  "login.errBlocked": { ru: "Аккаунт заблокирован. Свяжитесь с администрацией.", en: "This account is blocked. Contact the administrator.", hy: "Հաշիվը արգելափակված է։ Կապվեք ադմինի հետ։" },
  "login.errRejected": { ru: "Заявка на регистрацию отклонена.", en: "Your registration was rejected.", hy: "Ձեր գրանցման հայտը մերժվել է։" },
  "login.noAccount": { ru: "Нет аккаунта?", en: "No account?", hy: "Չունե՞ք հաշիվ" },
  "login.registerLink": { ru: "Зарегистрироваться", en: "Register", hy: "Գրանցվել" },
  "login.errGoogle": { ru: "Не удалось войти через Google.", en: "Google sign-in failed.", hy: "Google մուտքը ձախողվեց։" },
  "login.errTooManyAttempts": { ru: "Слишком много попыток. Повторите через несколько минут.", en: "Too many attempts. Try again in a few minutes.", hy: "Չափազանց շատ փորձեր։ Կրկնեք մի քանի րոպեից։" },
  "login.errDeactivated": { ru: "Аккаунт деактивирован. Свяжитесь с администратором.", en: "This account has been deactivated. Contact the administrator.", hy: "Հաշիվն ապաակտիվացված է։ Կապվեք ադմինիստրատորի հետ։" },
  "login.errFillBoth": { ru: "Введите email и пароль.", en: "Please enter your email and password.", hy: "Մուտքագրեք էլ. փոստը և գաղտնաբառը։" },
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
    hy: "Նշեք ձեր էլ. փոստը՝ գաղտնաբառը վերականգնելու հղում կստանաք։",
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
  "auth.resetSuccess": { ru: "Пароль изменён.", en: "Password updated.", hy: "Գաղտնաբառը փոփոխվել է։" },
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
    hy: "Կառավարեք ձեր ստեղծագործողի պրոֆիլը",
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
  "account.company": { ru: "Компания", en: "Company", hy: "Ընկերություն" },
  "account.roleBrand": { ru: "Бренд", en: "Brand", hy: "Բրենդ" },
  "account.roleCreator": { ru: "Создатель", en: "Creator", hy: "Ստեղծագործող" },
  "account.statusApproved": { ru: "Одобрен", en: "Approved", hy: "Հաստատված" },
  "account.logout": { ru: "Выйти", en: "Log out", hy: "Դուրս գալ" },

  // ── shared UI controls (multi-select / uploaders) ──
  "ui.addOption": { ru: "Добавить", en: "Add", hy: "Ավելացնել" },
  "ui.remove": { ru: "Удалить", en: "Remove", hy: "Հեռացնել" },
  "ui.close": { ru: "Закрыть", en: "Close", hy: "Փակել" },

  "account.creatorUploadTitle": { ru: "Загрузка сценария", en: "Upload script", hy: "Վերբեռնել սցենարը" },
  "account.creatorProjectsTitle": { ru: "Мои проекты", en: "My projects", hy: "Իմ նախագծերը" },
  "account.brandBrowseTitle": { ru: "Каталог проектов", en: "Browse catalog", hy: "Դիտել կատալոգը" },
  "account.brandBrowseBody": {
    ru: "Изучайте каталог проектов и выражайте интерес к плейсменту.",
    en: "Browse the project catalog and express interest in placement.",
    hy: "Ուսումնասիրեք նախագծերի կատալոգը և ցուցաբերեք հետաքրքրություն տեղադրման հանդեպ։",
  },
  "account.brandBrowseCta": { ru: "Открыть каталог", en: "Open catalog", hy: "Բացել կատալոգը" },

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
  "interests.timing": { ru: "Желаемые сроки", en: "Preferred timing", hy: "Ցանկալի ժամկետները" },
  "interests.deal": { ru: "Форма оплаты", en: "Deal type", hy: "Վճարման ձևը" },
  "interests.dealCASH": { ru: "Оплата", en: "Cash", hy: "Վճարում" },
  "interests.dealBARTER": { ru: "Бартер", en: "Barter", hy: "Բարտեր" },
  "interests.dealBOTH": { ru: "Оплата и бартер", en: "Cash and barter", hy: "Վճարում և բարտեր" },
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
  "interests.offerAmount": { ru: "Предложенная сумма", en: "Offered amount", hy: "Առաջարկվող գումարը" },
  "account.brandOnlyNotice": {
    ru: "Подача проектов доступна только для аккаунтов создателей.",
    en: "Submitting projects is only available for creator accounts.",
    hy: "Նախագծերի ներկայացումը հասանելի է միայն ստեղծագործողների հաշիվների համար։",
  },

  // ── creator: submission form fields ──
  "account.form.title": { ru: "Название", en: "Title", hy: "Անվանում" },
  "account.form.titlePlaceholder": { ru: "Название проекта", en: "Project title", hy: "Նախագծի անվանումը" },
  "account.form.synopsis": { ru: "Синопсис", en: "Synopsis", hy: "Սինոպսիս" },
  "account.form.synopsisPlaceholder": {
    ru: "О чём ваш проект",
    en: "What your project is about",
    hy: "Ինչի մասին է ձեր նախագիծը",
  },
  "account.form.genres": { ru: "Жанры", en: "Genres", hy: "Ժանրեր" },
  "account.form.genresPlaceholder": { ru: "Выберите жанры", en: "Select genres", hy: "Ընտրեք ժանրերը" },
  "account.form.kind": { ru: "Тип", en: "Kind", hy: "Տեսակ" },
  "account.form.kindFilm": { ru: "Фильм", en: "Film", hy: "Ֆիլմ" },
  "account.form.kindSerial": { ru: "Сериал", en: "Serial", hy: "Սերիալ" },
  "account.form.episodes": { ru: "Кол-во серий", en: "Episodes", hy: "Սերիաների քանակ" },
  "account.form.episodesPlaceholder": { ru: "24", en: "24", hy: "24" },
  "account.form.episodeMinutes": { ru: "Хронометраж серии (мин)", en: "Episode length (min)", hy: "Սերիայի տևողությունը (րոպե)" },
  "account.form.episodeMinutesPlaceholder": { ru: "50", en: "50", hy: "50" },
  "account.form.poster": { ru: "Постер (ссылка)", en: "Poster (URL)", hy: "Պաստառ (հղում)" },
  "account.form.posterPlaceholder": { ru: "https://…", en: "https://…", hy: "https://…" },
  "account.form.format": { ru: "Формат", en: "Format", hy: "Ձևաչափ" },
  "account.form.formatPlaceholder": { ru: "Например, 50 серий × 45 мин", en: "e.g. 50 ep × 45 min", hy: "օր.՝ 50 դրվագ × 45 րոպե" },
  "account.form.studio": {
    ru: "Название студии",
    en: "Studio name",
    hy: "Ստուդիայի անվանումը",
  },
  "account.form.studioPlaceholder": { ru: "Kinodaran, Sharm…", en: "Kinodaran, Sharm…", hy: "Kinodaran, Sharm…" },
  "account.form.countries": { ru: "Страны", en: "Countries", hy: "Երկրներ" },
  "account.form.countriesPlaceholder": { ru: "Армения, Россия", en: "Armenia, Russia", hy: "Հայաստան, Ռուսաստան" },
  "account.form.submit": { ru: "Отправить на модерацию", en: "Submit for review", hy: "Ուղարկել մոդերացիայի" },
  "account.form.cancel": { ru: "Отмена", en: "Cancel", hy: "Չեղարկել" },
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
  "account.form.submitted": {
    ru: "Проект отправлен на модерацию. Мы уведомим вас, когда он будет рассмотрен.",
    en: "Project submitted for review. We'll let you know once it's been reviewed.",
    hy: "Նախագիծն ուղարկվել է մոդերացիայի։ Կտեղեկացնենք, երբ այն ստուգվի։",
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
  "publish.missing.releaseDate": {
    ru: "Дата релиза или ожидаемая дата выхода",
    en: "Release date or expected release date",
    hy: "Թողարկման կամ սպասվող թողարկման ամսաթիվ",
  },
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
  "projectForm.section.general": { ru: "Общее", en: "General", hy: "Ընդհանուր" },
  "projectForm.section.translations": {
    ru: "Переводы (hy / ru / en)",
    en: "Translations (hy / ru / en)",
    hy: "Թարգմանություններ (hy / ru / en)",
  },
  // ── About block (#11) ──
  "projectForm.section.about": { ru: "О проекте", en: "About", hy: "Նախագծի մասին" },
  "projectForm.about.title": { ru: "Название", en: "Title", hy: "Վերնագիր" },
  "projectForm.about.description": { ru: "Описание", en: "Description", hy: "Նկարագրություն" },
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
  "projectForm.section.statusRelease": { ru: "Статус и релиз", en: "Status & release", hy: "Կարգավիճակ և թողարկում" },
  "projectForm.section.placement": { ru: "Размещение", en: "Placement", hy: "Տեղադրում" },
  "projectForm.section.audienceValue": { ru: "Аудитория и ценность", en: "Audience & value", hy: "Լսարան և արժեք" },
  // Admin redesign phase 1: renamed from "Press-kit details" — this section
  // is now just poster/gallery/video (Comparable titles moved out to its own
  // "Reference Projects" section).
  "projectForm.section.pressKit": { ru: "Дизайн", en: "Design", hy: "Դիզայն" },
  "projectForm.section.castCrew": { ru: "Актёры и съёмочная группа", en: "Cast & crew", hy: "Դերասաններ և թիմ" },
  // Two different things, and the form used to call the sponsorship one
  // "Placement(s)" (owner correction 2026-07-28). Sponsorship sells the logo:
  // promo materials, credits, premiere invitations. A placement puts the brand
  // inside the story itself, and lives in its own section above sponsors.
  "projectForm.section.sponsorshipTiers": { ru: "Спонсоры", en: "Sponsors", hy: "Հովանավորներ" },
  "projectForm.section.placements": { ru: "Продакт-плейсмент", en: "Placements", hy: "Փլեյսմենթներ" },
  "projectForm.section.visibility": { ru: "Видимость", en: "Visibility", hy: "Տեսանելիություն" },
  // New sections (admin redesign phase 1): Production Info holds
  // status/timeline/where-it-plays fields moved out of the old Status&release
  // and Placement cards; Reference Projects is the "Comparable titles" field,
  // pulled out of Design into its own section.
  "projectForm.section.production": { ru: "Производство", en: "Production Info", hy: "Արտադրություն" },
  "projectForm.section.references": { ru: "Похожие проекты", en: "Reference Projects", hy: "Նմանատիպ նախագծեր" },
  "projectForm.field.code": { ru: "Код", en: "Code", hy: "Կոդ" },
  "projectForm.generatedAutomatically": { ru: "Генерируется автоматически", en: "Generated automatically", hy: "Ստեղծվում է ինքնաշխատ" },
  "projectForm.field.genre": { ru: "Жанр *", en: "Genre *", hy: "Ժանր *" },
  "projectForm.genresPlaceholder": { ru: "Выберите жанры…", en: "Select genres…", hy: "Ընտրեք ժանրերը…" },
  "projectForm.field.poster": { ru: "Постер", en: "Poster", hy: "Պաստառ" },
  "projectForm.uploadPoster": { ru: "Загрузить постер", en: "Upload poster", hy: "Վերբեռնել պաստառը" },
  "projectForm.or": { ru: "или", en: "or", hy: "կամ" },
  "projectForm.field.gallery": {
    ru: "Галерея (кадры — до 5 показываются)",
    en: "Gallery (storyboard stills — up to 5 shown)",
    hy: "Պատկերասրահ (կադրեր, ցուցադրվում է մինչև 5-ը)",
  },
  "projectForm.uploadGalleryImages": { ru: "Загрузить изображения галереи", en: "Upload gallery images", hy: "Վերբեռնել պատկերասրահի նկարները" },
  // Renamed from "Kind" (admin redesign phase 1) — the Format Category
  // dropdown that used to own this label was removed, so "Format" is free.
  "projectForm.field.kind": { ru: "Формат", en: "Format", hy: "Ձևաչափ" },
  "projectForm.field.formatCategory": { ru: "Формат", en: "Format", hy: "Ձևաչափ" },
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
  "projectForm.field.titleHy": { ru: "Название (HY)", en: "Title (HY)", hy: "Վերնագիր (HY)" },
  "projectForm.field.titleRu": { ru: "Название (RU)", en: "Title (RU)", hy: "Վերնագիր (RU)" },
  "projectForm.field.titleEn": { ru: "Название (EN)", en: "Title (EN)", hy: "Վերնագիր (EN)" },
  "projectForm.field.synopsisHy": { ru: "Синопсис (HY)", en: "Synopsis (HY)", hy: "Սինոպսիս (HY)" },
  "projectForm.field.synopsisRu": { ru: "Синопсис (RU)", en: "Synopsis (RU)", hy: "Սինոպսիս (RU)" },
  "projectForm.field.synopsisEn": { ru: "Синопсис (EN)", en: "Synopsis (EN)", hy: "Սինոպսիս (EN)" },
  // "Production stage" (projectForm.field.status / .help.status) and its option
  // labels were removed on 2026-07-26 — the field is gone from both editors at
  // the owner's request. The stage is still shown to visitors through the
  // report.status.* / catalog.* keys, which stay.
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
  "projectForm.field.releaseDate": { ru: "Дата релиза", en: "Release date", hy: "Թողարկման ամսաթիվ" },
  "projectForm.field.platforms": { ru: "Платформы", en: "Platforms", hy: "Հարթակներ" },
  "projectForm.platformsPlaceholder": { ru: "YouTube, Kinodaran, TV", en: "YouTube, Kinodaran, TV", hy: "YouTube, Kinodaran, TV" },
  "projectForm.field.streamingSource": { ru: "Источник показа", en: "Streaming source", hy: "Հեռարձակման աղբյուր" },
  "projectForm.streamingSourcePlaceholder": {
    ru: "Выберите источники…",
    en: "Select sources…",
    hy: "Ընտրեք աղբյուրները…",
  },
  "projectForm.field.priceNote": { ru: "Примечание к цене (необязательно)", en: "Price note (optional caption)", hy: "Գնի նշում (ոչ պարտադիր)" },
  "projectForm.priceNotePlaceholder": { ru: "/ сцена", en: "/ scene", hy: "/ տեսարան" },
  "projectForm.field.priceMin": { ru: "Цена мин. (AMD)", en: "Price min (AMD)", hy: "Գին նվազ. (AMD)" },
  "projectForm.field.priceMax": { ru: "Цена макс. (AMD)", en: "Price max (AMD)", hy: "Գին առավ. (AMD)" },
  "projectForm.priceHint": {
    ru: "Оставьте цену пустой → на сайте будет показано «Цена по запросу».",
    en: "Leave price empty → the site shows “Price on request”.",
    hy: "Թողեք գինը դատարկ → կայքում կցուցադրվի «Գին՝ հարցումով»։",
  },
  "projectForm.field.audienceGender": { ru: "Пол аудитории", en: "Audience gender", hy: "Լսարանի սեռ" },
  "projectForm.field.audienceAge": { ru: "Возраст аудитории", en: "Audience age", hy: "Լսարանի տարիք" },
  "projectForm.audienceAgePlaceholder": { ru: "16-30", en: "16-30", hy: "16-30" },
  "projectForm.field.ageRating": { ru: "Возрастной рейтинг (значок на постере)", en: "Age rating (poster badge)", hy: "Տարիքային սահմանափակում (նշան պաստառի վրա)" },
  "projectForm.field.tagline": {
    ru: "Слоган (одна строка, показывается в шапке)",
    en: "Tagline / logline (one line, shown in the hero)",
    hy: "Կարգախոս (մեկ տող, ցուցադրվում է գլխավոր բլոկում)",
  },
  "projectForm.field.taglineHy": { ru: "Слоган (HY)", en: "Tagline (HY)", hy: "Կարգախոս (HY)" },
  "projectForm.field.taglineRu": { ru: "Слоган (RU)", en: "Tagline (RU)", hy: "Կարգախոս (RU)" },
  "projectForm.field.taglineEn": { ru: "Слоган (EN)", en: "Tagline (EN)", hy: "Կարգախոս (EN)" },
  "projectForm.taglinePlaceholder": {
    ru: "Звезда рождается — и у славы есть цена.",
    en: "A star is born — and fame has a price.",
    hy: "Աստղը ծնվում է, և փառքն ունի իր գինը։",
  },
  "projectForm.field.references": { ru: "Похожие тайтлы (через запятую)", en: "Comparable titles (comma-separated)", hy: "Նմանատիպ ֆիլմեր (ստորակետով)" },
  "projectForm.referencesPlaceholder": {
    ru: "Богемская рапсодия, Рэй, Майкл",
    en: "Bohemian Rhapsody, Ray, Michael",
    hy: "Bohemian Rhapsody, Ray, Michael",
  },
  // Ф2: repeatable Reference Projects editor (replaces the single
  // comma-separated input above, which is now unused).
  "projectForm.field.referenceName": { ru: "Название", en: "Title", hy: "Վերնագիր" },
  "projectForm.field.referenceUrl": { ru: "Ссылка / URL изображения", en: "Link/image URL", hy: "Հղում / նկարի URL" },
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
  "projectForm.cast.name": { ru: "Имя", en: "Name", hy: "Անուն" },
  "projectForm.cast.namePlaceholder": { ru: "Найдите или введите новое имя…", en: "Search or type a new name…", hy: "Փնտրեք կամ մուտքագրեք նոր անուն…" },
  "projectForm.cast.role": { ru: "Роль", en: "Role", hy: "Դեր" },
  "projectForm.cast.kind": { ru: "Категория", en: "Kind", hy: "Կատեգորիա" },
  "projectForm.cast.kindCast": { ru: "Актёры", en: "Cast", hy: "Դերասաններ" },
  "projectForm.cast.kindCrew": { ru: "Съёмочная группа", en: "Crew", hy: "Թիմ" },
  "projectForm.cast.photo": { ru: "Фото", en: "Photo", hy: "Լուսանկար" },
  "projectForm.cast.replacePhoto": { ru: "Заменить фото", en: "Replace photo", hy: "Փոխարինել լուսանկարը" },
  "projectForm.cast.uploadPhoto": { ru: "Загрузить фото", en: "Upload photo", hy: "Վերբեռնել լուսանկարը" },
  "projectForm.tiers.tier": { ru: "пакет", en: "package", hy: "փաթեթ" },
  "projectForm.tiers.tiers": { ru: "пакета", en: "packages", hy: "փաթեթ" },
  "projectForm.tiers.addTier": { ru: "Добавить пакет", en: "Add package", hy: "Ավելացնել փաթեթ" },
  "projectForm.tiers.empty": { ru: "Пока нет спонсорских пакетов.", en: "No sponsorship packages yet.", hy: "Դեռ հովանավորության փաթեթներ չկան։" },
  "projectForm.tiers.name": { ru: "Название пакета", en: "Package name", hy: "Փաթեթի անվանում" },
  "projectForm.tiers.namePlaceholder": { ru: "Официальный спонсор", en: "Official Sponsor", hy: "Պաշտոնական հովանավոր" },
  "projectForm.tiers.price": { ru: "Цена (AMD)", en: "Price (AMD)", hy: "Գին (AMD)" },
  "projectForm.tiers.slots": { ru: "Доступно", en: "Available", hy: "Հասանելի" },
  "projectForm.tiers.totalSlots": { ru: "Всего", en: "Total", hy: "Ընդամենը" },
  "projectForm.tiers.exclusive": { ru: "Эксклюзив", en: "Exclusive", hy: "Բացառիկ" },
  "projectForm.tiers.exclusiveHint": {
    ru: "Эксклюзивный плейсмент — всегда один слот",
    en: "An exclusive placement is always a single slot",
    hy: "Բացառիկ փլեյսմենթը միշտ մեկ տեղ է",
  },
  "projectForm.tiers.duplicate": { ru: "Дублировать", en: "Duplicate", hy: "Կրկնօրինակել" },
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
  "projectForm.placements.title": { ru: "Название", en: "Title", hy: "Անվանում" },
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
  "projectForm.placements.descriptionPlaceholder": {
    ru: "Бренд в кадре не менее трёх раз\nУпоминание в диалоге\nКрупный план продукта",
    en: "Brand on screen at least three times\nMentioned in dialogue\nClose-up of the product",
    hy: "Բրենդը կադրում առնվազն երեք անգամ\nՀիշատակում երկխոսության մեջ\nԱպրանքի խոշոր պլան",
  },
  "projectForm.placements.image": { ru: "Кадр", en: "Still", hy: "Կադր" },
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

  "projectForm.tiers.benefitsPlaceholder": {
    ru: "Логотип на выбранных промо-материалах\nПродвижение в соцсетях\nБлагодарность в титрах\nПриглашения на премьеру",
    en: "Logo on selected promo materials\nSocial promo presence\nSpecial thanks in the credits\nPremiere invitations",
    hy: "Լոգոն ընտրված գովազդային նյութերի վրա\nԱջակցություն սոցիալական ցանցերում\nՀատուկ շնորհակալագիր տիտրերում\nՀրավեր պրեմիերայի",
  },

  // ── admin: member registrations ──
  "admin.registrations.nav": { ru: "Регистрации", en: "Registrations", hy: "Գրանցումներ" },
  "admin.registrations.title": { ru: "Регистрации участников", en: "Member registrations", hy: "Անդամների գրանցումներ" },
  "admin.registrations.subtitle": {
    ru: "Одобряйте, отклоняйте или блокируйте аккаунты брендов и создателей.",
    en: "Approve, reject, or block brand and creator accounts.",
    hy: "Հաստատեք, մերժեք կամ արգելափակեք բրենդների և ստեղծագործողների հաշիվները։",
  },
  "admin.registrations.colName": { ru: "Имя", en: "Name", hy: "Անուն" },
  "admin.registrations.colEmail": { ru: "Email", en: "Email", hy: "Էլ. փոստ" },
  "admin.registrations.colRole": { ru: "Роль", en: "Role", hy: "Դեր" },
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
  "account.brand.navFavorites": { ru: "Избранное", en: "Favorites", hy: "Ընտրանի" },
  "account.brand.navProfile": { ru: "Мой профиль", en: "My Profile", hy: "Իմ պրոֆիլը" },
  "account.brand.navNotifications": { ru: "Уведомления", en: "Notifications", hy: "Ծանուցումներ" },
  "account.brand.soon": { ru: "Скоро", en: "Soon", hy: "Շուտով" },

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
  // Favorites / Application feature (2026-07-19)
  "notif.interestApproved.title": { ru: "Заявка одобрена", en: "Application approved", hy: "Հայտը հաստատվեց" },
  "notif.interestApproved.body": { ru: "Ваше предложение по проекту «{project}» принято.", en: "Your offer for “{project}” was accepted.", hy: "«{project}» նախագծի համար ձեր առաջարկն ընդունվեց։" },
  "notif.interestDeclined.title": { ru: "Предложение отклонено", en: "Offer declined", hy: "Առաջարկը մերժվեց" },
  "notif.interestDeclined.body": { ru: "Ваше предложение по проекту «{project}» отклонено.", en: "Your offer for “{project}” was declined.", hy: "«{project}» նախագծի համար ձեր առաջարկը մերժվեց։" },
  "favorite.addAria": { ru: "Добавить в избранное", en: "Add to favorites", hy: "Ավելացնել ընտրյալում" },
  "favorite.removeAria": { ru: "Убрать из избранного", en: "Remove from favorites", hy: "Հեռացնել ընտրյալից" },
  "apply.title": { ru: "Отправить предложение", en: "Send an offer", hy: "Ուղարկել առաջարկ" },
  "apply.messageLabel": { ru: "Сообщение (необязательно)", en: "Message (optional)", hy: "Հաղորդագրություն (ըստ ցանկության)" },
  "apply.messagePlaceholder": { ru: "Расскажите о вашем интересе к размещению…", en: "Tell us about your placement interest…", hy: "Պատմեք ձեր տեղադրման հետաքրքրության մասին…" },
  "apply.contactLabel": { ru: "Контакт (необязательно)", en: "Contact (optional)", hy: "Կոնտակտ (ըստ ցանկության)" },
  // ── Media picker (audit 4.5: the dialog was English-only for members) ──
  "media.chooseImage": { ru: "Выберите изображение", en: "Choose image", hy: "Ընտրեք պատկերը" },
  "media.chooseVideo": { ru: "Выберите видео", en: "Choose video", hy: "Ընտրեք տեսանյութը" },
  "media.chooseFile": { ru: "Выберите файл", en: "Choose file", hy: "Ընտրեք ֆայլը" },
  "media.upload": { ru: "Загрузить с компьютера", en: "Upload from computer", hy: "Վերբեռնել համակարգչից" },
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
  "apply.replaceWarning": {
    ru: "По этому проекту у вас уже есть заявка. Отправка заменит её — прежний выбор и ответ создателя не сохранятся.",
    en: "You already have an application for this project. Sending will replace it — the previous choice and the creator's answer will not be kept.",
    hy: "Այս նախագծի համար դուք արդեն ունեք հայտ։ Ուղարկելը կփոխարինի այն — նախորդ ընտրությունը և ստեղծագործողի պատասխանը չեն պահպանվի։",
  },
  "apply.tierLabel": { ru: "Спонсорский пакет", en: "Sponsorship package", hy: "Հովանավորության փաթեթ" },
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
  "apply.offerAmountLabel": { ru: "Ваша цена, ֏", en: "Your price, ֏", hy: "Ձեր գինը, ֏" },
  "apply.offerAmountHint": {
    ru: "Если цена «по запросу» — назовите свою сумму",
    en: "If the price is on request, name your own",
    hy: "Եթե գինը «հարցումով» է, նշեք ձերը",
  },
  "apply.contactPlaceholder": { ru: "Email или телефон", en: "Email or phone", hy: "Էլ. փոստ կամ հեռախոս" },
  // Required since 2026-07-29 (it was the optional one, with the free-text
  // message mandatory — inverted: without the product the seller cannot tell
  // what the offer is even about).
  "apply.productLabel": { ru: "Что размещаем", en: "What is being placed", hy: "Ի՞նչ ենք տեղադրում" },
  "apply.productPlaceholder": { ru: "Товар, услуга или бренд для размещения", en: "Product, service or brand to place", hy: "Ապրանք, ծառայություն կամ բրենդ տեղադրման համար" },
  "apply.timingLabel": { ru: "Желаемые сроки", en: "Preferred timing", hy: "Ցանկալի ժամկետները" },
  "apply.timingPlaceholder": { ru: "Например: осень 2026", en: "For example: autumn 2026", hy: "Օրինակ՝ 2026-ի աշուն" },
  "apply.dealLabel": { ru: "Форма оплаты", en: "Deal type", hy: "Վճարման ձևը" },
  "apply.dealUnset": { ru: "Не указано", en: "Not specified", hy: "Նշված չէ" },
  "apply.dealCash": { ru: "Оплата", en: "Cash", hy: "Վճարում" },
  "apply.dealBarter": { ru: "Бартер", en: "Barter", hy: "Բարտեր" },
  "apply.dealBoth": { ru: "Оплата и бартер", en: "Cash and barter", hy: "Վճարում և բարտեր" },
  "apply.messageTooShort": { ru: "Опишите запрос подробнее — минимум {n} символов", en: "Please describe your request in more detail — at least {n} characters", hy: "Նկարագրեք հարցումն ավելի մանրամասն՝ նվազագույնը {n} նիշ" },
  "apply.phoneLabel": { ru: "Телефон", en: "Phone", hy: "Հեռախոս" },
  "apply.phonePlaceholder": { ru: "+374 XX XXX XXX", en: "+374 XX XXX XXX", hy: "+374 XX XXX XXX" },
  "apply.phoneInvalid": { ru: "Укажите номер с кодом страны, например +374 XX XXX XXX", en: "Enter the number with its country code, for example +374 XX XXX XXX", hy: "Նշեք համարը երկրի կոդով, օրինակ՝ +374 XX XXX XXX" },
  "apply.submit": { ru: "Отправить предложение", en: "Send offer", hy: "Ուղարկել առաջարկը" },
  "apply.cancel": { ru: "Отмена", en: "Cancel", hy: "Չեղարկել" },
  "apply.success": { ru: "Предложение отправлено", en: "Offer sent", hy: "Առաջարկն ուղարկվեց" },
  "apply.error": { ru: "Не удалось отправить предложение. Попробуйте ещё раз.", en: "Could not send the offer. Please try again.", hy: "Չհաջողվեց ուղարկել առաջարկը։ Փորձեք նորից։" },
  "admin.interests.approve": { ru: "Одобрить", en: "Approve", hy: "Հաստատել" },
  "admin.interests.decline": { ru: "Отклонить", en: "Decline", hy: "Մերժել" },
  "admin.interests.message": { ru: "Сообщение", en: "Message", hy: "Հաղորդագրություն" },
  "admin.interests.contact": { ru: "Контакт", en: "Contact", hy: "Կոնտակտ" },
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
  "account.brand.activeInterests": { ru: "Активные интересы", en: "Active Interests", hy: "Ակտիվ հետաքրքրություններ" },
  "account.brand.noInterestsTitle": { ru: "Пока нет интересов", en: "No interests yet", hy: "Հետաքրքրություններ դեռ չկան" },
  "account.brand.noInterestsDashboardBody": {
    ru: "Вы ещё не проявили интерес ни к одному проекту. Просмотрите каталог, чтобы найти возможности.",
    en: "You haven't expressed interest in any projects yet. Browse the catalog to find opportunities.",
    hy: "Դուք դեռ որևէ նախագծի հանդեպ հետաքրքրություն չեք հայտնել։ Դիտեք կատալոգը՝ հնարավորություններ գտնելու համար։",
  },
  "account.brand.recommended": { ru: "Рекомендовано для вас", en: "Recommended for You", hy: "Առաջարկվում է ձեզ համար" },
  "account.brand.recommendedBasedOn": {
    ru: "На основе вашего профиля: {categories}",
    en: "Based on your profile: {categories}",
    hy: "Ըստ ձեր պրոֆիլի՝ {categories}",
  },
  "account.brand.recommendedEmpty": {
    ru: "Заполните профиль бренда, чтобы получать персональные рекомендации.",
    en: "Complete your brand profile to get personalized recommendations.",
    hy: "Լրացրեք ձեր բրենդի պրոֆիլը՝ անհատականացված առաջարկներ ստանալու համար։",
  },
  "account.brand.recentlyAdded": { ru: "Недавно добавленные", en: "Recently Added", hy: "Վերջերս ավելացված" },

  // ── my interests ──
  "account.brand.interestsSubtitle": {
    ru: "Проекты, которым вы отправили предложение",
    en: "Projects you have sent an offer to",
    hy: "Նախագծեր, որոնց ուղարկել եք առաջարկ",
  },
  "account.brand.noInterestsPageBody": {
    ru: "Просмотрите каталог и отправьте предложение проектам, подходящим вашему бренду.",
    en: "Browse the catalog and send an offer to projects that match your brand.",
    hy: "Դիտեք կատալոգը և առաջարկ ուղարկեք ձեր բրենդին համապատասխան նախագծերին։",
  },
  "account.brand.interestStatusSent": { ru: "Отправлено", en: "Sent", hy: "Ուղարկված" },
  "account.brand.interestStatusMutual": { ru: "Взаимный интерес", en: "Mutual interest", hy: "Փոխադարձ հետաքրքրություն" },
  "account.brand.interestStatusDeclined": { ru: "Отклонено", en: "Declined", hy: "Մերժված" },
  "account.brand.interestedOn": { ru: "Интерес проявлен {date}", en: "Interest expressed {date}", hy: "Հետաքրքրությունը հայտնվել է {date}" },

  // ── favorites (#22) ──
  "account.brand.favoritesSubtitle": {
    ru: "Проекты, которые вы сохранили",
    en: "Projects you saved",
    hy: "Ձեր պահած նախագծերը",
  },
  "account.brand.noFavoritesTitle": { ru: "Пока нет избранного", en: "No favorites yet", hy: "Ընտրանին դատարկ է" },
  "account.brand.noFavoritesBody": {
    ru: "Нажмите на сердечко на проекте, чтобы сохранить его сюда.",
    en: "Tap the heart on a project to save it here.",
    hy: "Սեղմեք նախագծի սրտիկը՝ այն այստեղ պահելու համար։",
  },
  "account.brand.favoritedOn": { ru: "Сохранено {date}", en: "Saved on {date}", hy: "Պահված է {date}" },

  // ── browse ──
  "account.brand.alreadyInterested": { ru: "Интерес отправлен", en: "Interest Sent", hy: "Հետաքրքրությունն ուղարկված է" },
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
  "account.brand.filtersToggle": { ru: "Фильтры", en: "Filters", hy: "Զտիչներ" },
  "account.brand.filtersClose": { ru: "Свернуть фильтры", en: "Hide filters", hy: "Փակել զտիչները" },

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
  "account.brand.compareStage": { ru: "Стадия", en: "Stage", hy: "Փուլ" },
  "account.brand.compareFormat": { ru: "Формат", en: "Format", hy: "Ձևաչափ" },
  "account.brand.compareNoValue": { ru: "—", en: "—", hy: "—" },

  // ── my profile ──
  "account.brand.profileSubtitle": { ru: "Управляйте профилем бренда", en: "Manage your brand profile", hy: "Կառավարեք ձեր բրենդի պրոֆիլը" },
  "account.brand.accountSection": { ru: "Аккаунт", en: "Account", hy: "Հաշիվ" },
  "account.brand.emailReadonlyNote": {
    ru: "Ваш логин — изменить нельзя",
    en: "Your login email — cannot be changed",
    hy: "Ձեր մուտքի էլ. փոստը՝ չի կարող փոփոխվել",
  },
  "account.brand.companyDetails": { ru: "Данные компании", en: "Company Details", hy: "Ընկերության տվյալներ" },
  "account.brand.website": { ru: "Веб-сайт", en: "Website", hy: "Կայք" },
  "account.brand.websitePlaceholder": { ru: "https://…", en: "https://…", hy: "https://…" },
  "account.brand.saveChanges": { ru: "Сохранить изменения", en: "Save Changes", hy: "Պահպանել փոփոխությունները" },
  "account.brand.saved": { ru: "Сохранено", en: "Saved", hy: "Պահպանված է" },
  "account.brand.brandProfileSection": { ru: "Профиль бренда", en: "Brand Profile", hy: "Բրենդի պրոֆիլ" },
  "account.brand.categories": { ru: "Категории", en: "Categories", hy: "Կատեգորիաներ" },
  "account.brand.categoriesHint": {
    ru: "Выберите категории, соответствующие вашему бренду.",
    en: "Tap to add categories that match your brand.",
    hy: "Ընտրեք ձեր բրենդին համապատասխան կատեգորիաները։",
  },
  "account.brand.budgetSelectPlaceholder": { ru: "Выберите диапазон", en: "Select a range", hy: "Ընտրեք միջակայք" },
  "account.brand.yourDataSection": { ru: "Ваши данные", en: "Your data", hy: "Ձեր տվյալները" },
  "account.brand.yourDataBody": {
    ru: "Скачайте JSON-выгрузку вашего профиля и проявленных интересов.",
    en: "Download a JSON export of your brand profile and expressed interests.",
    hy: "Ներբեռնեք ձեր պրոֆիլի և հայտնված հետաքրքրությունների JSON արտահանումը։",
  },
  "account.brand.downloadData": { ru: "Скачать мои данные (JSON)", en: "Download my data (JSON)", hy: "Ներբեռնել իմ տվյալները (JSON)" },
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
