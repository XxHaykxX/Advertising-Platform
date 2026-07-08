/* i18n core (client-safe). Locale is stored in the `locale` cookie and drives
   server rendering. This UI dictionary covers static chrome (nav, hero, forms,
   footer, catalog filters, report labels, legal page shells) — long legal
   body text and DB-sourced content (project titles/synopsis, partner
   taglines, portfolio metric keys) stay English-only for now (TODO: move to
   the `Content` i18n mechanism once that lands). */

export const LOCALES = ["ru", "en", "hy"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
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
  "nav.how": { ru: "Как это работает", en: "How It Works", hy: "Ինչպես է աշխատում" },
  "nav.portfolio": { ru: "Портфолио", en: "Portfolio", hy: "Պորտֆոլիո" },
  "nav.partners": { ru: "Партнёры", en: "Partners", hy: "Գործընկերներ" },
  "nav.faq": { ru: "Вопросы и ответы", en: "FAQ", hy: "Հաճախ տրվող հարցեր" },
  "nav.about": { ru: "О нас", en: "About", hy: "Մեր մասին" },
  "nav.contact": { ru: "Контакты", en: "Contact", hy: "Կոնտակտներ" },
  "nav.signIn": { ru: "Войти", en: "Sign In", hy: "Մուտք" },
  "nav.register": { ru: "Регистрация", en: "Register", hy: "Գրանցում" },
  "nav.browseProjects": { ru: "Смотреть проекты", en: "Browse Projects", hy: "Դիտել նախագծերը" },
  "nav.callUs": { ru: "Позвонить", en: "Call us", hy: "Զանգահարել" },
  "nav.openMenu": { ru: "Открыть меню", en: "Open menu", hy: "Բացել ընտրացանկը" },
  "nav.closeMenu": { ru: "Закрыть меню", en: "Close menu", hy: "Փակել ընտրացանկը" },

  // ── hero ────────────────────────────────────
  "hero.eyebrow": { ru: "Маркетплейс продакт-плейсмента", en: "Product placement marketplace", hy: "Փրոդակթ փլեյսմենթի շուկա" },
  "hero.titleHighlight": { ru: "Брендированный плейсмент", en: "Brand Placement", hy: "Բրենդային տեղադրում" },
  "hero.titleRest": { ru: "Маркетплейс", en: "Marketplace", hy: "Շուկա" },
  "hero.subtitle": {
    ru: "Соединяем бренды с кино- и сериальными продакшенами через посценовые, безопасные для бренда отчёты о плейсменте.",
    en: "Connect brands with film & series productions through scene-level, brand-safe placement reports.",
    hy: "Կապում ենք բրենդներին կինոնախագծերի և սերիալների հետ՝ տեսարան առ տեսարան, բրենդի համար անվտանգ տեղադրման հաշվետվությունների միջոցով։",
  },
  "hero.disclaimer": {
    ru: "Плейсменты от $5K. Комиссия платформы — только по закрытым сделкам.",
    en: "Placements from $5K. Platform fee only on closed deals.",
    hy: "Տեղադրումներ՝ $5K-ից։ Հարթակի վճարը՝ միայն կնքված գործարքների համար։",
  },
  "hero.scrollDown": { ru: "Прокрутить вниз", en: "Scroll down", hy: "Ոլորել ներքև" },

  // ── buttons / CTAs ──────────────────────────
  "btn.getStarted": { ru: "Начать", en: "Get Started", hy: "Սկսել" },
  "btn.viewReport": { ru: "Смотреть отчёт", en: "View Report", hy: "Դիտել հաշվետվությունը" },
  "btn.requestDetails": { ru: "Запросить детали", en: "Request details", hy: "Հարցնել մանրամասներ" },
  "btn.expressInterest": { ru: "Проявить интерес", en: "Express Interest", hy: "Ցուցաբերել հետաքրքրություն" },
  "btn.browseProjects": { ru: "Смотреть проекты", en: "Browse Projects", hy: "Դիտել նախագծերը" },
  "btn.viewAll": { ru: "Смотреть все", en: "View All", hy: "Դիտել բոլորը" },
  "btn.listProject": { ru: "Разместить проект", en: "List Your Project", hy: "Ավելացնել նախագիծ" },
  "btn.send": { ru: "Отправить", en: "Send", hy: "Ուղարկել" },
  "btn.sending": { ru: "Отправка…", en: "Sending…", hy: "Ուղարկվում է…" },
  "btn.submit": { ru: "Отправить", en: "Submit", hy: "Ուղարկել" },
  "btn.close": { ru: "Закрыть", en: "Close", hy: "Փակել" },
  "btn.showAll": { ru: "Показать все", en: "Show All", hy: "Ցուցադրել բոլորը" },
  "btn.showLess": { ru: "Свернуть", en: "Show Less", hy: "Ցուցադրել քիչ" },
  "btn.downloadPdf": { ru: "Скачать PDF", en: "Download PDF", hy: "Ներբեռնել PDF" },
  "btn.share": { ru: "Поделиться", en: "Share", hy: "Կիսվել" },
  "btn.registerAsPublisher": { ru: "Регистрация как продюсер", en: "Register as Publisher", hy: "Գրանցվել որպես պրոդյուսեր" },
  "btn.becomePartner": { ru: "Стать партнёром", en: "Become a partner", hy: "Դառնալ գործընկեր" },
  "btn.browseCurrentProjects": { ru: "Смотреть текущие проекты", en: "Browse current projects", hy: "Դիտել ընթացիկ նախագծերը" },

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
  "catalog.signIn": { ru: "Войти", en: "Sign In", hy: "Մուտք" },
  "catalog.register": { ru: "Регистрация", en: "Register", hy: "Գրանցում" },
  "catalog.anonymizedNotice": {
    ru: "Отчёты анонимны до подтверждения взаимного интереса",
    en: "Reports are anonymized until mutual interest is confirmed",
    hy: "Հաշվետվությունները անանուն են, մինչև փոխադարձ հետաքրքրության հաստատումը",
  },
  "catalog.filters": { ru: "Фильтры", en: "Filters", hy: "Զտիչներ" },
  "catalog.genre": { ru: "Жанр", en: "Genre", hy: "Ժանր" },
  "catalog.targetAudience": { ru: "Целевая аудитория", en: "Target Audience", hy: "Թիրախային լսարան" },
  "catalog.gender": { ru: "Пол", en: "Gender", hy: "Սեռ" },
  "catalog.genderAll": { ru: "Все", en: "All", hy: "Բոլորը" },
  "catalog.genderMale": { ru: "Мужской", en: "Male", hy: "Արական" },
  "catalog.genderFemale": { ru: "Женский", en: "Female", hy: "Իգական" },
  "catalog.budgetRange": { ru: "Диапазон бюджета", en: "Budget Range", hy: "Բյուջեի միջակայք" },
  "catalog.min": { ru: "Мин", en: "Min", hy: "Նվազ." },
  "catalog.max": { ru: "Макс", en: "Max", hy: "Առավ." },
  "catalog.productCategory": { ru: "Категория продукта", en: "Product Category", hy: "Ապրանքի կատեգորիա" },
  "catalog.comingSoon": { ru: "Скоро.", en: "Coming soon.", hy: "Շուտով։" },
  "catalog.brandSafety": { ru: "Безопасность бренда", en: "Brand Safety", hy: "Բրենդի անվտանգություն" },
  "catalog.safeOnly": { ru: "Только безопасные", en: "Safe only", hy: "Միայն անվտանգ" },
  "catalog.status": { ru: "Статус", en: "Status", hy: "Կարգավիճակ" },
  "catalog.clearAll": { ru: "Сбросить всё", en: "Clear All", hy: "Մաքրել բոլորը" },
  "catalog.searchPlaceholder": { ru: "Поиск по жанру, рынку, ключевым словам…", en: "Search by genre, market, keyword…", hy: "Որոնել ըստ ժանրի, շուկայի, բանալի բառի…" },
  "catalog.sortMostRelevant": { ru: "Сначала релевантные", en: "Most relevant", hy: "Առավել համապատասխան" },
  "catalog.sortViews": { ru: "Просмотры", en: "Views", hy: "Դիտումներ" },
  "catalog.sortBudget": { ru: "Бюджет", en: "Budget", hy: "Բյուջե" },
  "catalog.sortSafety": { ru: "Безопасность", en: "Safety", hy: "Անվտանգություն" },
  "catalog.gridView": { ru: "Вид сеткой", en: "Grid view", hy: "Ցանցի տեսք" },
  "catalog.listView": { ru: "Вид списком", en: "List view", hy: "Ցուցակի տեսք" },
  "catalog.showingProjectsPrefix": { ru: "Показано", en: "Showing", hy: "Ցուցադրված է" },
  "catalog.projectSingular": { ru: "проект", en: "project", hy: "նախագիծ" },
  "catalog.projectPlural": { ru: "проектов", en: "projects", hy: "նախագիծ" },
  "catalog.noResults": { ru: "Нет проектов, соответствующих фильтрам.", en: "No projects match your filters.", hy: "Ձեր զտիչներին համապատասխան նախագծեր չկան։" },
  "catalog.until": { ru: "До", en: "Until", hy: "Մինչև" },

  // ── project card / row ──────────────────────
  "card.opportunities": { ru: "возможностей", en: "opportunities", hy: "հնարավորություն" },
  "card.projectedViews": { ru: "прогноз. просмотров", en: "projected views", hy: "կանխատեսվող դիտում" },
  "card.release": { ru: "Выход", en: "Release", hy: "Թողարկում" },
  "card.applicationsUntil": { ru: "Заявки до", en: "Applications until", hy: "Հայտեր՝ մինչև" },
  "card.slotsAvailable": { ru: "из {b} слотов доступно", en: "of {b} slots available", hy: "{b}-ից հասանելի է" },
  "card.slotsShort": { ru: "из {b} слотов", en: "of {b} slots", hy: "{b}-ից" },

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
  "trust.scriptsAnalyzedNumber": { ru: "100 000+", en: "100,000+", hy: "100,000+" },
  "trust.scriptsAnalyzedTitle": { ru: "сценариев проанализировано", en: "scripts analyzed", hy: "սցենար վերլուծված" },
  "trust.scriptsAnalyzedCaption": { ru: "с полной аналитикой по бренду", en: "with comprehensive brand intelligence", hy: "բրենդի համապարփակ վերլուծությամբ" },
  "trust.countriesNumber": { ru: "100+", en: "100+", hy: "100+" },
  "trust.countriesTitle": { ru: "стран охвачено", en: "countries covered", hy: "երկիր ընդգրկված" },
  "trust.countriesCaption": { ru: "доступно на крупнейших рынках мира", en: "available in major markets worldwide", hy: "հասանելի է աշխարհի խոշոր շուկաներում" },
  "trust.safetyNumber": { ru: "Посценовая", en: "Scene-level", hy: "Տեսարան առ տեսարան" },
  "trust.safetyTitle": { ru: "безопасность бренда", en: "brand safety", hy: "բրենդի անվտանգություն" },
  "trust.safetyCaption": { ru: "на основе анализа контента через ИИ", en: "powered by AI content analysis", hy: "աշխատում է ԱԲ-ի կոնտենտի վերլուծությամբ" },

  // ── featured productions ──────────────────────
  "featured.title": { ru: "Избранные проекты", en: "Featured Productions", hy: "Առաջարկվող նախագծեր" },

  // ── how it works (landing widget) ────────────
  "landingHow.title": { ru: "Как это работает", en: "How It Works", hy: "Ինչպես է աշխատում" },
  "landingHow.subtitle": {
    ru: "Соединяем создателей и бренды. Честные сделки, аутентичный плейсмент.",
    en: "Connect creators and brands. Fair deals, authentic placements.",
    hy: "Կապում ենք ստեղծագործողներին և բրենդներին։ Արդար գործարքներ, ինքնատիպ տեղադրումներ։",
  },
  "landingHow.forBrands": { ru: "Для брендов", en: "For Brands", hy: "Բրենդների համար" },
  "landingHow.forFilmmakers": { ru: "Для режиссёров", en: "For Filmmakers", hy: "Ռեժիսորների համար" },
  "landingHow.brand1Title": { ru: "Смотрите анонимно", en: "Browse Anonymously", hy: "Դիտեք անանուն" },
  "landingHow.brand1Caption": {
    ru: "Изучайте доступные фильмы и продакшен-сделки, не раскрывая свой бренд.",
    en: "Explore available films and production deals without revealing your brand.",
    hy: "Ուսումնասիրեք հասանելի ֆիլմերն ու պրոդակշն գործարքները՝ առանց ձեր բրենդը բացահայտելու։",
  },
  "landingHow.brand2Title": { ru: "Проявите интерес", en: "Express Interest", hy: "Ցուցաբերեք հետաքրքրություն" },
  "landingHow.brand2Caption": {
    ru: "Отправьте требования к плейсменту и бюджет режиссёрам, с которыми хотите работать.",
    en: "Submit placement requirements and budget to filmmakers you connect with.",
    hy: "Ուղարկեք տեղադրման պահանջներն ու բյուջեն այն ռեժիսորներին, որոնց հետ կապ եք հաստատում։",
  },
  "landingHow.brand3Title": { ru: "Договоритесь", en: "Match & Negotiate", hy: "Համաձայնեցրեք" },
  "landingHow.brand3Caption": {
    ru: "Сотрудничайте с создателями, чтобы создать идеальный продакт-плейсмент.",
    en: "Collaborate with creators to craft the perfect product placement.",
    hy: "Համագործակցեք ստեղծագործողների հետ՝ կատարյալ փրոդակթ փլեյսմենթ ստեղծելու համար։",
  },
  "landingHow.film1Title": { ru: "Загрузите сценарий", en: "Upload Script", hy: "Վերբեռնեք սցենարը" },
  "landingHow.film1Caption": {
    ru: "Поделитесь сценарием с явно отмеченными возможностями для плейсмента.",
    en: "Share your screenplay with placement opportunities clearly marked.",
    hy: "Կիսվեք ձեր սցենարով՝ հստակ նշված տեղադրման հնարավորություններով։",
  },
  "landingHow.film2Title": { ru: "Получайте предложения", en: "Receive Offers", hy: "Ստացեք առաջարկներ" },
  "landingHow.film2Caption": {
    ru: "Находите бренды, заинтересованные в вашем проекте.",
    en: "Get matched with brands interested in your production.",
    hy: "Ստացեք համապատասխանություններ ձեր նախագծով հետաքրքրված բրենդների հետ։",
  },
  "landingHow.film3Title": { ru: "Монетизируйте историю", en: "Monetize Your Story", hy: "Մոնետիզացրեք ձեր պատմությունը" },
  "landingHow.film3Caption": {
    ru: "Договаривайтесь об условиях и получайте дополнительное финансирование фильма.",
    en: "Negotiate terms and unlock additional funding for your film.",
    hy: "Համաձայնեցրեք պայմանները և ստացեք լրացուցիչ ֆինանսավորում ձեր ֆիլմի համար։",
  },
  "landingHow.matchTitle": { ru: "Сделка и совпадение", en: "Matching & Deal", hy: "Համապատասխանեցում և գործարք" },
  "landingHow.matchCaption": {
    ru: "Завершайте сотрудничество и заключайте соглашения, выгодные всем сторонам.",
    en: "Close collaboration and secure agreements that benefit everyone.",
    hy: "Ավարտեք համագործակցությունը և ապահովեք համաձայնագրեր, որոնք ձեռնտու են բոլորին։",
  },

  // ── get started ───────────────────────────────
  "getStarted.title": { ru: "Начните", en: "Get Started", hy: "Սկսեք" },
  "getStarted.forBrandsTitle": { ru: "Для брендов", en: "For Brands", hy: "Բրենդների համար" },
  "getStarted.forBrandsBody": {
    ru: "Изучайте проверенные проекты, посценовые оценки безопасности, платите только по закрытым сделкам.",
    en: "Browse vetted productions, scene-level safety scores, pay only on closed deals.",
    hy: "Ուսումնասիրեք ստուգված նախագծեր, տեսարան առ տեսարան անվտանգության գնահատականներ, վճարեք միայն կնքված գործարքների համար։",
  },
  "getStarted.forFilmmakersTitle": { ru: "Для режиссёров", en: "For Filmmakers", hy: "Ռեժիսորների համար" },
  "getStarted.forFilmmakersBody": {
    ru: "Монетизируйте свой проект, сохраняйте творческий контроль, получите бесплатный отчёт о плейсменте.",
    en: "Monetize your production, keep creative control, free placement report.",
    hy: "Մոնետիզացրեք ձեր նախագիծը, պահպանեք ստեղծագործական վերահսկողությունը, ստացեք անվճար տեղադրման հաշվետվություն։",
  },

  // ── why we built this ─────────────────────────
  "why.title": { ru: "Почему мы это создали", en: "Why We Built This", hy: "Ինչու ենք մենք ստեղծել սա" },
  "why.paragraph1": {
    ru: "Продакт-плейсмент десятилетиями оставался несовершенной системой. Режиссёры с трудом монетизируют свои истории, а бренды блуждают по непрозрачным сетям, переплачивая за плейсменты, которые могут никогда не выйти на экран. Всё делается вручную, неэффективно и доступно лишь через личные связи.",
    en: "Product placement has been broken for decades. Filmmakers struggle to monetize their stories while brands stumble through opaque networks, paying inflated premiums for placements that may never see the light of day. It's manual, inefficient, and gated behind relationship networks.",
    hy: "Փրոդակթ փլեյսմենթը տասնամյակներ շարունակ մնացել է խափանված համակարգ։ Ռեժիսորները դժվարանում են մոնետիզացնել իրենց պատմությունները, իսկ բրենդները շրջում են անթափանց ցանցերում՝ վճարելով գերագնահատված գումարներ այն տեղադրումների համար, որոնք գուցե երբեք չհասնեն էկրան։ Ամեն ինչ արվում է ձեռքով, անարդյունավետ և հասանելի է միայն կապերի միջոցով։",
  },
  "why.paragraph2": {
    ru: "Мы создали FP Placement, чтобы это изменить. Делая плейсмент прозрачным, основанным на данных и доступным, мы даём создателям возможность контролировать свою судьбу и помогаем брендам делать более разумный, аутентичный выбор о том, где появляется их продукт.",
    en: "We built FP Placement to change that. By making placement transparent, data-driven, and accessible, we empower creators to control their own destiny and help brands make smarter, more authentic choices about where their products appear.",
    hy: "Մենք ստեղծել ենք FP Placement-ը՝ դա փոխելու համար։ Դարձնելով տեղադրումը թափանցիկ, տվյալահեն և հասանելի, մենք հնարավորություն ենք տալիս ստեղծագործողներին վերահսկել իրենց ճակատագիրը և օգնում ենք բրենդներին ավելի խելացի, ինքնատիպ ընտրություն կատարել այն մասին, թե որտեղ է հայտնվում իրենց ապրանքը։",
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
  "faq.q1.question": { ru: "Как формируется цена?", en: "How does pricing work?", hy: "Ինչպե՞ս է ձևավորվում գինը" },
  "faq.q1.answer": {
    ru: "Плейсменты начинаются от $5K. Листинг и просмотр бесплатны — мы берём комиссию только когда сделка действительно закрывается, поэтому бренды и режиссёры никогда не платят за сорвавшиеся плейсменты.",
    en: "Placements start from $5K. Listing and browsing are free — we only take a fee when a deal actually closes, so brands and filmmakers never pay for placements that fall through.",
    hy: "Տեղադրումները սկսվում են $5K-ից։ Ցուցակագրումն ու դիտումն անվճար են․ մենք վճար ենք վերցնում միայն այն ժամանակ, երբ գործարքն իրականում կնքվում է, ուստի բրենդներն ու ռեժիսորները երբեք չեն վճարում չկայացած տեղադրումների համար։",
  },
  "faq.q2.question": { ru: "Как оценивается безопасность бренда?", en: "How is brand safety scored?", hy: "Ինչպե՞ս է գնահատվում բրենդի անվտանգությունը" },
  "faq.q2.answer": {
    ru: "Каждый сценарий разбирается по сценам и оценивается по 11-категорийной системе безопасности бренда GARM, поэтому вы точно видите, где появится ваш продукт, ещё до заключения сделки.",
    en: "Every script is broken down scene by scene and scored against the GARM 11-category brand safety framework, so you can see exactly where your product would appear before committing to a deal.",
    hy: "Յուրաքանչյուր սցենար վերլուծվում է տեսարան առ տեսարան և գնահատվում GARM-ի 11 կատեգորիայի բրենդի անվտանգության շրջանակով, այնպես որ դուք ճշգրիտ կտեսնեք, թե որտեղ կհայտնվի ձեր ապրանքը՝ նախքան գործարքի կնքումը։",
  },
  "faq.q3.question": { ru: "Что значит анонимизация?", en: "What does anonymization mean?", hy: "Ի՞նչ է նշանակում անանունացում" },
  "faq.q3.answer": {
    ru: "Отчёты о плейсменте по умолчанию публикуются анонимно. Личности продакшена и бренда остаются скрытыми, пока обе стороны не подтвердят взаимный интерес, что делает ранние разговоры менее напряжёнными для обеих сторон.",
    en: "Placement reports are shared anonymously by default. Production and brand identities stay hidden until both sides confirm mutual interest, keeping early conversations low-pressure on both ends.",
    hy: "Տեղադրման հաշվետվությունները ըստ լռելյայն կիսվում են անանուն։ Պրոդակշնի և բրենդի ինքնությունը մնում է թաքնված, մինչև երկու կողմերն էլ հաստատեն փոխադարձ հետաքրքրությունը, ինչը վաղ խոսակցությունները դարձնում է քիչ ճնշող երկու կողմերի համար։",
  },
  "faq.q4.question": { ru: "Как режиссёры размещают проект?", en: "How do filmmakers list a project?", hy: "Ինչպե՞ս են ռեժիսորները ցուցակագրում նախագիծը" },
  "faq.q4.answer": {
    ru: "Режиссёры загружают сценарий, и наша система автоматически анализирует его, чтобы выявить сцены, готовые к плейсменту. Затем проект появляется в каталоге, доступном брендам для просмотра.",
    en: "Filmmakers upload their screenplay, and our system analyzes it automatically to surface placement-ready scenes. The project then appears in the catalog for brands to discover and review.",
    hy: "Ռեժիսորները վերբեռնում են սցենարը, և մեր համակարգը ինքնաշխատ վերլուծում է այն՝ բացահայտելու տեղադրման համար պատրաստ տեսարանները։ Այնուհետև նախագիծը հայտնվում է կատալոգում՝ բրենդների կողմից գտնվելու և վերանայվելու համար։",
  },
  "faq.q5.question": { ru: "Какие стадии продакшена представлены?", en: "What production stages are listed?", hy: "Ի՞նչ արտադրական փուլեր են ներկայացված" },
  "faq.q5.answer": {
    ru: "Вы найдёте проекты на любой стадии — от сценариев, всё ещё находящихся в разработке, до пре-продакшена и финансирования, вплоть до тех, что уже активно снимаются.",
    en: "You'll find projects across every stage — from scripts still in development, to productions in pre-production and financing, through to those already in active filming.",
    hy: "Դուք կգտնեք նախագծեր բոլոր փուլերում՝ դեռ մշակման փուլում գտնվող սցենարներից մինչև նախապատրաստական և ֆինանսավորման փուլում գտնվող արտադրություններ, ընդհուպ մինչև այն նախագծերը, որոնք արդեն ակտիվ նկարահանվում են։",
  },
  "faq.q6.question": { ru: "Как работает подбор и переговоры?", en: "How does matching and negotiation work?", hy: "Ինչպե՞ս է աշխատում համապատասխանեցումն ու բանակցությունը" },
  "faq.q6.answer": {
    ru: "Наш подбор находит подходящие сцены на основе категории и целей вашего бренда. После этого вы можете напрямую написать продакшену и договориться об условиях прямо внутри платформы, без посредников.",
    en: "Our matching surfaces relevant scenes based on your brand's category and goals. From there, you can message the production directly and negotiate terms inside the platform, no middlemen required.",
    hy: "Մեր համապատասխանեցումը բացահայտում է համապատասխան տեսարաններ՝ ելնելով ձեր բրենդի կատեգորիայից և նպատակներից։ Այնուհետև դուք կարող եք ուղղակիորեն գրել պրոդակշնին և բանակցել պայմանների շուրջ հենց հարթակի ներսում, առանց միջնորդների։",
  },
  "faq.q7.question": { ru: "Данные проверены?", en: "Is the data verified?", hy: "Տվյալնե՞րը ստուգված են" },
  "faq.q7.answer": {
    ru: "Да. Детали продакшена, оценки просмотров и анализ сценария проверяются нашей командой перед публикацией проекта, поэтому каждая цифра в отчёте заслуживает доверия.",
    en: "Yes. Production details, viewership estimates, and script analysis are reviewed by our team before a project goes live, so every number you see in a report is trustworthy.",
    hy: "Այո։ Արտադրության մանրամասները, դիտումների գնահատականները և սցենարի վերլուծությունը վերանայվում են մեր թիմի կողմից՝ նախքան նախագծի հրապարակումը, այնպես որ հաշվետվության մեջ տեսած յուրաքանչյուր թիվ արժանահավատ է։",
  },

  // ── contact section (landing + page shared bits) ─
  "contact.title": { ru: "Свяжитесь с нами", en: "Get in Touch", hy: "Կապվեք մեզ հետ" },
  "contact.subtitle": {
    ru: "Есть проект или бренд на примете? Напишите нам, и мы скоро ответим.",
    en: "Have a project or a brand in mind? Send us a message and we'll follow up shortly.",
    hy: "Ունե՞ք նախագիծ կամ բրենդ մտքում։ Ուղարկեք մեզ հաղորդագրություն, և մենք շուտով կպատասխանենք։",
  },
  "contact.thanks": { ru: "Спасибо — мы скоро с вами свяжемся.", en: "Thanks — we'll get back to you shortly.", hy: "Շնորհակալություն․ մենք շուտով կկապվենք ձեզ հետ։" },
  "contact.messagePlaceholder": { ru: "Расскажите о своём проекте или бренде…", en: "Tell us about your project or brand…", hy: "Պատմեք ձեր նախագծի կամ բրենդի մասին…" },
  "contact.emailDirectly": { ru: "Или напишите нам напрямую:", en: "Or email us directly:", hy: "Կամ գրեք մեզ ուղղակիորեն." },

  // ── contact page ──────────────────────────────
  "contactPage.title": { ru: "Свяжитесь с нами", en: "Get in Touch", hy: "Կապվեք մեզ հետ" },
  "contactPage.subtitle": {
    ru: "Есть проект или бренд на примете? Давайте обсудим ваши возможности для плейсмента.",
    en: "Have a project or brand in mind? Let's talk about your placement opportunities.",
    hy: "Ունե՞ք նախագիծ կամ բրենդ մտքում։ Եկեք խոսենք ձեր տեղադրման հնարավորությունների մասին։",
  },
  "contactPage.methodsTitle": { ru: "Способы связи", en: "Contact Methods", hy: "Կապի եղանակներ" },
  "contactPage.methodsSubtitle": {
    ru: "Свяжитесь с нами по любому из этих каналов. Обычно мы отвечаем в течение 24 часов.",
    en: "Reach out to us through any of these channels. We typically respond within 24 hours.",
    hy: "Կապվեք մեզ հետ այս ցանկացած ալիքով։ Սովորաբար պատասխանում ենք 24 ժամվա ընթացքում։",
  },
  "contactPage.methodEmail": { ru: "Email", en: "Email", hy: "Էլ. փոստ" },
  "contactPage.methodPhone": { ru: "Телефон", en: "Phone", hy: "Հեռախոս" },
  "contactPage.methodTelegram": { ru: "Telegram", en: "Telegram", hy: "Telegram" },
  "contactPage.methodWhatsApp": { ru: "WhatsApp", en: "WhatsApp", hy: "WhatsApp" },
  "contactPage.formTitle": { ru: "Отправьте нам сообщение", en: "Send us a Message", hy: "Ուղարկեք մեզ հաղորդագրություն" },
  "contactPage.formSubtitle": {
    ru: "Расскажите о своём бренде и целях плейсмента. Мы рассмотрим и скоро свяжемся с вами.",
    en: "Tell us about your brand and placement goals. We'll review and get back to you shortly.",
    hy: "Պատմեք ձեր բրենդի և տեղադրման նպատակների մասին։ Մենք կվերանայենք և շուտով կկապվենք ձեզ հետ։",
  },
  "contactPage.thanks": { ru: "Спасибо — мы скоро с вами свяжемся.", en: "Thanks — we'll get back to you shortly.", hy: "Շնորհակալություն․ մենք շուտով կկապվենք ձեզ հետ։" },
  "contactPage.thanksSubtitle": { ru: "Проверьте почту для подтверждения.", en: "Check your email for confirmation.", hy: "Ստուգեք ձեր էլ. փոստը հաստատման համար։" },
  "contactPage.projectOptional": { ru: "Проект (необязательно)", en: "Project (Optional)", hy: "Նախագիծ (կամընտիր)" },
  "contactPage.selectProject": { ru: "Выберите проект…", en: "Select a project...", hy: "Ընտրեք նախագիծ…" },
  "contactPage.messagePlaceholder": {
    ru: "Расскажите о своём бренде, целях и конкретных проектах или плейсментах, которые вас интересуют…",
    en: "Tell us about your brand, goals, and any specific projects or placements you're interested in…",
    hy: "Պատմեք ձեր բրենդի, նպատակների և ձեզ հետաքրքրող կոնկրետ նախագծերի կամ տեղադրումների մասին…",
  },
  "contactPage.respondNote": {
    ru: "Мы рассмотрим ваше сообщение и ответим на вашу почту в течение 24 часов.",
    en: "We'll review your message and respond to your email within 24 hours.",
    hy: "Մենք կվերանայենք ձեր հաղորդագրությունը և կպատասխանենք ձեր էլ. փոստին 24 ժամվա ընթացքում։",
  },

  // ── how it works (full page) ──────────────────
  "hiw.heroTitle": { ru: "Как это работает", en: "How It Works", hy: "Ինչպես է աշխատում" },
  "hiw.heroSubtitle": {
    ru: "FP Placement связывает бренды с режиссёрами через прозрачный, честный процесс. Узнайте, как начать всего за четыре простых шага.",
    en: "FP Placement connects brands with filmmakers through a transparent, fair process. Discover how to get started in just four simple steps.",
    hy: "FP Placement-ը կապում է բրենդներին ռեժիսորների հետ թափանցիկ, արդար գործընթացի միջոցով։ Իմացեք, թե ինչպես սկսել ընդամենը չորս պարզ քայլով։",
  },
  "hiw.forBrandsTitle": { ru: "Для брендов", en: "For Brands", hy: "Բրենդների համար" },
  "hiw.forBrandsSubtitle": {
    ru: "Находите аутентичные возможности для плейсмента в премиальных фильмах и сериалах.",
    en: "Find authentic placement opportunities in premium film and TV productions.",
    hy: "Գտեք ինքնատիպ տեղադրման հնարավորություններ պրեմիում ֆիլմերում և հեռուստասերիալներում։",
  },
  "hiw.forFilmmakersTitle": { ru: "Для режиссёров", en: "For Filmmakers", hy: "Ռեժիսորների համար" },
  "hiw.forFilmmakersSubtitle": {
    ru: "Откройте возможности финансирования, монетизируя плейсмент в своих проектах.",
    en: "Unlock funding opportunities by monetizing placement in your projects.",
    hy: "Բացահայտեք ֆինանսավորման հնարավորություններ՝ մոնետիզացնելով տեղադրումը ձեր նախագծերում։",
  },
  "hiw.brand1Title": { ru: "Смотрите каталог", en: "Browse Catalog", hy: "Դիտեք կատալոգը" },
  "hiw.brand1Desc": {
    ru: "Изучайте доступные кино- и ТВ-проекты с возможностями для плейсмента. Смотрите анонимно, пока не будете готовы проявить интерес.",
    en: "Explore available film and TV productions with placement opportunities. Browse anonymously until you're ready to express interest.",
    hy: "Ուսումնասիրեք տեղադրման հնարավորություններով հասանելի կինո և հեռուստատեսային նախագծերը։ Դիտեք անանուն, մինչև պատրաստ լինեք ցուցաբերել հետաքրքրություն։",
  },
  "hiw.brand2Title": { ru: "Смотрите посценовый отчёт", en: "View Scene-Level Report", hy: "Դիտեք տեսարան առ տեսարան հաշվետվությունը" },
  "hiw.brand2Desc": {
    ru: "Получите доступ к подробным отчётам о плейсменте по каждому проекту, включая описания сцен, метрики аудитории и оценки безопасности бренда.",
    en: "Access detailed placement reports for each project, including scene descriptions, audience metrics, and brand safety scores.",
    hy: "Ստացեք հասանելիություն յուրաքանչյուր նախագծի մանրամասն տեղադրման հաշվետվություններին, ներառյալ տեսարանների նկարագրություններ, լսարանի չափորոշիչներ և բրենդի անվտանգության գնահատականներ։",
  },
  "hiw.brand3Title": { ru: "Проявляйте интерес и договаривайтесь", en: "Express Interest & Negotiate", hy: "Ցուցաբերեք հետաքրքրություն և բանակցեք" },
  "hiw.brand3Desc": {
    ru: "Отправляйте требования к плейсменту и данные о бюджете режиссёрам. Сотрудничайте напрямую, чтобы создать аутентичный плейсмент под ваш бренд.",
    en: "Submit placement requirements and budget details to filmmakers. Collaborate directly to craft authentic placements that fit your brand.",
    hy: "Ուղարկեք տեղադրման պահանջներն ու բյուջեի մանրամասները ռեժիսորներին։ Համագործակցեք ուղղակիորեն՝ ձեր բրենդին համապատասխան ինքնատիպ տեղադրումներ ստեղծելու համար։",
  },
  "hiw.brand4Title": { ru: "Заключайте сделку", en: "Close the Deal", hy: "Կնքեք գործարքը" },
  "hiw.brand4Desc": {
    ru: "Финализируйте соглашения о плейсменте на прозрачных условиях. Комиссия платформы взимается только при закрытии сделки — без предоплаты.",
    en: "Finalize placement agreements with transparent terms. Platform fee only applies when deals close — no upfront costs.",
    hy: "Ավարտեք տեղադրման համաձայնագրերը թափանցիկ պայմաններով։ Հարթակի վճարը կիրառվում է միայն գործարքի կնքման դեպքում՝ առանց նախավճարի։",
  },
  "hiw.film1Title": { ru: "Регистрация как продюсер", en: "Register as Publisher", hy: "Գրանցվեք որպես պրոդյուսեր" },
  "hiw.film1Desc": {
    ru: "Создайте профиль режиссёра и подтвердите свои данные. Откройте доступ к партнёрству с брендами и возможностям финансирования.",
    en: "Create your filmmaker profile and verify your credentials. Unlock access to brand partnerships and funding opportunities.",
    hy: "Ստեղծեք ձեր ռեժիսորի պրոֆիլը և հաստատեք ձեր տվյալները։ Բացեք հասանելիություն բրենդային գործընկերությանը և ֆինանսավորման հնարավորություններին։",
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
    ru: "FP Placement построен на прозрачности и доверии. Никаких скрытых комиссий для брендов, творческий контроль для режиссёров и комиссия платформы — только при закрытии сделок.",
    en: "FP Placement is built on transparency and trust. No hidden fees for brands, creative control for filmmakers, and platform fees only when deals close.",
    hy: "FP Placement-ը կառուցված է թափանցիկության և վստահության վրա։ Ոչ մի թաքնված վճար բրենդների համար, ստեղծագործական վերահսկողություն ռեժիսորների համար, և հարթակի վճարներ միայն գործարքների կնքման դեպքում։",
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
    ru: "Продакшен-студии и дистрибьюторские сети, формирующие каталог FP Placement.",
    en: "Production studios and distribution networks building the FP Placement catalog.",
    hy: "Արտադրական ստուդիաներ և բաշխման ցանցեր, որոնք կառուցում են FP Placement-ի կատալոգը։",
  },
  "partners.fullNetwork": { ru: "Вся сеть", en: "Full Network", hy: "Ամբողջ ցանցը" },
  "partners.ctaTitle": { ru: "Хотите видеть здесь свой бренд?", en: "Want to see your brand here?", hy: "Ցանկանու՞մ եք տեսնել ձեր բրենդն այստեղ" },
  "partners.ctaBody": {
    ru: "Присоединяйтесь к партнёрской сети FP Placement и получите прямой доступ к проверенным кино- и ТВ-проектам.",
    en: "Join the FP Placement partner network and get direct access to vetted film and TV productions.",
    hy: "Միացեք FP Placement-ի գործընկերային ցանցին և ստացեք ուղղակի հասանելիություն ստուգված կինո և հեռուստատեսային նախագծերին։",
  },

  // ── report: hero / key facts / cast ────────────
  "report.backToCatalog": { ru: "Назад к каталогу", en: "Back to Catalog", hy: "Վերադառնալ կատալոգ" },
  "report.catalogLabel": { ru: "Каталог", en: "Catalog", hy: "Կատալոգ" },
  "report.share": { ru: "Поделиться", en: "Share", hy: "Կիսվել" },
  "report.downloadPdf": { ru: "Скачать PDF", en: "Download PDF", hy: "Ներբեռնել PDF" },
  "report.projectedViews": { ru: "Прогноз. просмотры", en: "Projected Views", hy: "Կանխատեսվող դիտումներ" },
  "report.brandSafety": { ru: "Безопасность бренда", en: "Brand Safety", hy: "Բրենդի անվտանգություն" },
  "report.cpm": { ru: "CPM", en: "CPM", hy: "CPM" },
  "report.budgetRange": { ru: "Диапазон бюджета", en: "Budget Range", hy: "Բյուջեի միջակայք" },
  "report.status.PRE_PRODUCTION": { ru: "Пре-продакшен", en: "Pre-Production", hy: "Նախապատրաստական փուլ" },
  "report.status.FILMING": { ru: "Съёмки", en: "Filming", hy: "Նկարահանում" },
  "report.status.POST_PRODUCTION": { ru: "Пост-продакшен", en: "Post-Production", hy: "Հետարտադրական փուլ" },
  "report.status.RELEASED": { ru: "Выпущено", en: "Released", hy: "Թողարկված" },
  "report.tabs.overview": { ru: "Обзор", en: "Overview", hy: "Ընդհանուր տեսք" },
  "report.tabs.cast": { ru: "Актёры", en: "Cast", hy: "Դերասաններ" },
  "report.tabs.safety": { ru: "Безопасность", en: "Safety", hy: "Անվտանգություն" },
  "report.tabs.investment": { ru: "Инвестиции", en: "Investment", hy: "Ներդրում" },
  "report.tabs.more": { ru: "Ещё", en: "More", hy: "Ավելին" },

  "cast.title": { ru: "Актёры", en: "Cast", hy: "Դերասաններ" },
  "cast.subtitle": { ru: "Актёры, задействованные в проекте", en: "Actors attached to this production", hy: "Այս նախագծին կցված դերասաններ" },

  "keyFacts.placementSlots": { ru: "Слоты для плейсмента", en: "Placement Slots", hy: "Տեղադրման հատվածներ" },
  "keyFacts.available": { ru: "из {b} доступно", en: "of {b} available", hy: "{b}-ից հասանելի է" },
  "keyFacts.release": { ru: "Выход", en: "Release", hy: "Թողարկում" },
  "keyFacts.applicationDeadline": { ru: "Срок подачи заявок", en: "Application Deadline", hy: "Հայտերի ընդունման վերջնաժամկետ" },
  "keyFacts.price": { ru: "Цена", en: "Price", hy: "Գին" },
  "keyFacts.onRequest": { ru: "По запросу", en: "On request", hy: "Ըստ պահանջի" },
  "keyFacts.platforms": { ru: "Площадки", en: "Platforms", hy: "Հարթակներ" },

  // ── report: ROI / express interest banner ──────
  "roi.title": { ru: "Прогноз ROI", en: "Estimated ROI Snapshot", hy: "Կանխատեսվող ROI-ի պատկեր" },
  "roi.exposureValue": { ru: "Оценка охвата бренда", en: "Estimated Exposure Value", hy: "Գնահատված ազդեցության արժեք" },
  "roi.exposureTooltip": {
    ru: "Методология: сумма оценённой стоимости охвата по всем выявленным возможностям плейсмента.",
    en: "Methodology: sum of estimated exposure value across all identified placement opportunities.",
    hy: "Մեթոդաբանություն. բոլոր հայտնաբերված տեղադրման հնարավորությունների գնահատված ազդեցության արժեքի գումարը։",
  },
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
  "roi.placements": { ru: "Плейсменты", en: "Placements", hy: "Տեղադրումներ" },
  "roi.placementsTooltip": {
    ru: "Методология: отдельные возможности плейсмента, выявленные при посценовом анализе сценария.",
    en: "Methodology: distinct placement opportunities identified across scene-level script analysis.",
    hy: "Մեթոդաբանություն. սցենարի տեսարան առ տեսարան վերլուծությամբ հայտնաբերված առանձին տեղադրման հնարավորություններ։",
  },
  "roi.acrossTypes": { ru: "в {n} категориях", en: "across {n} types", hy: "{n} տեսակների շրջանակում" },
  "roi.summary": {
    ru: "Этот проект предлагает {value} прогнозируемого охвата бренда через {count} посценовых возможностей плейсмента, с ценами, сопоставленными по формату, жанру и профилю аудитории.",
    en: "This project offers {value} in estimated brand exposure across {count} scene-level placement opportunities, with pricing benchmarked against comparable format, genre, and audience profiles.",
    hy: "Այս նախագիծը առաջարկում է {value} գնահատված բրենդային ազդեցություն {count} տեսարան առ տեսարան տեղադրման հնարավորությունների միջոցով՝ գներ, որոնք համեմատված են ձևաչափի, ժանրի և լսարանի պրոֆիլների հետ։",
  },
  "roi.poweredBy": { ru: "Прогнозы основаны на отраслевых бенчмарках.", en: "Projections powered by industry benchmark data.", hy: "Կանխատեսումները հիմնված են ոլորտի չափանիշային տվյալների վրա։" },
  "express.lockedNotice": { ru: "Полные детали открываются после взаимного интереса", en: "Full details unlocked after mutual interest", hy: "Ամբողջական մանրամասները բացվում են փոխադարձ հետաքրքրությունից հետո" },

  // ── report: safety assessment ──────────────────
  "safety.title": { ru: "Оценка безопасности бренда", en: "Brand Safety Assessment", hy: "Բրենդի անվտանգության գնահատում" },
  "safety.subtitle": {
    ru: "Первичная оценка на основе фреймворка GARM. Итоговая безопасность бренда требует ручной проверки сценария перед подписанием сделки.",
    en: "Initial assessment based on GARM framework. Final brand safety requires manual script review before deal signing.",
    hy: "Նախնական գնահատում՝ հիմնված GARM շրջանակի վրա։ Վերջնական բրենդային անվտանգությունը պահանջում է սցենարի ձեռքով վերանայում մինչև գործարքի ստորագրումը։",
  },
  "safety.garmCategories": { ru: "Категории GARM", en: "GARM Categories", hy: "GARM կատեգորիաներ" },
  "safety.verdictSafe": { ru: "В целом безопасно", en: "Generally Safe", hy: "Ընդհանուր առմամբ անվտանգ" },
  "safety.verdictReview": { ru: "Требует проверки", en: "Needs Review", hy: "Պահանջում է վերանայում" },
  "safety.verdictHighRisk": { ru: "Высокий риск", en: "High Risk", hy: "Բարձր ռիսկ" },
  "safety.note": {
    ru: "Представленные сцены описывают историю, сосредоточенную вокруг ключевых тем проекта. Хотя контент в целом подходит для массовой аудитории, рекомендуется полное прочтение сценария для подтверждения контекста любых чувствительных моментов перед финальным утверждением плейсмента.",
    en: "The provided scenes outline a story centered on the project's core narrative themes. While the content is largely appropriate for mainstream audiences, a full read of the script is recommended to confirm context around any sensitive moments before final placement approval.",
    hy: "Տրամադրված տեսարանները ուրվագծում են պատմություն, որը կենտրոնացած է նախագծի հիմնական պատումային թեմաների շուրջ։ Թեև բովանդակությունը հիմնականում համապատասխանում է լայն լսարանին, խորհուրդ է տրվում ամբողջությամբ կարդալ սցենարը՝ ցանկացած զգայուն պահի համատեքստը հաստատելու համար նախքան տեղադրման վերջնական հաստատումը։",
  },

  // ── report: investment ──────────────────────────
  "investment.title": { ru: "Инвестиции и что входит", en: "Investment & Deliverables", hy: "Ներդրում և մատուցվող ծառայություններ" },
  "investment.subtitle": { ru: "Пакеты плейсмента и конкурентные цены", en: "Placement packages and competitive pricing", hy: "Տեղադրման փաթեթներ և մրցունակ գներ" },
  "investment.investmentLabel": { ru: "Инвестиции", en: "Investment", hy: "Ներդրում" },
  "investment.item1": { ru: "Проверенные посценовые возможности плейсмента", en: "Verified scene-level placement opportunities", hy: "Ստուգված տեսարան առ տեսարան տեղադրման հնարավորություններ" },
  "investment.item2": { ru: "Анализ безопасности бренда с оценкой GARM", en: "Brand safety analysis with GARM scoring", hy: "Բրենդի անվտանգության վերլուծություն GARM գնահատմամբ" },
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
  "deepDive.fullSafetyTitle": { ru: "Полный анализ безопасности", en: "Full Safety Analysis", hy: "Անվտանգության ամբողջական վերլուծություն" },
  "deepDive.suitable": { ru: "Подходит", en: "Suitable", hy: "Հարմար է" },
  "deepDive.needsReview": { ru: "Требует проверки", en: "Needs Review", hy: "Պահանջում է վերանայում" },
  "deepDive.highRisk": { ru: "Высокий риск", en: "High Risk", hy: "Բարձր ռիսկ" },
  "deepDive.clearedNote": {
    ru: "Существенных блокеров безопасности бренда не выявлено. Одобрено для большинства партнёрств с брендами при условии полной проверки сценария.",
    en: "No significant brand-safety blockers identified. Cleared for most brand partnerships pending full script review.",
    hy: "Բրենդի անվտանգության էական խոչընդոտներ չեն հայտնաբերվել։ Հաստատված է բրենդային գործընկերությունների մեծ մասի համար՝ սցենարի ամբողջական վերանայման պայմանով։",
  },
  "deepDive.viewGarmBreakdown": { ru: "Смотреть подробную разбивку GARM ({n} категорий)", en: "View detailed GARM category breakdown ({n} categories)", hy: "Դիտել GARM կատեգորիաների մանրամասն վերլուծությունը ({n} կատեգորիա)" },
  "deepDive.potentialRisks": { ru: "Возможные риски", en: "Potential Risks", hy: "Հնարավոր ռիսկեր" },
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
  "applyDialog.phonePlaceholder": { ru: "+7 ___ ___-____", en: "+1 ___ ___-____", hy: "+374 __ ______" },
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

  // ── legal pages ────────────────────────────────
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
  "login.title": { ru: "Вход для бренда", en: "Brand Sign In", hy: "Բրենդի մուտք" },
  "login.subtitle": { ru: "Аккаунты брендов скоро появятся.", en: "Brand accounts coming soon.", hy: "Բրենդային հաշիվները շուտով հասանելի կլինեն։" },
  "login.emailPlaceholder": { ru: "you@brand.com", en: "you@brand.com", hy: "you@brand.com" },
  "login.password": { ru: "Пароль", en: "Password", hy: "Գաղտնաբառ" },
  "login.signIn": { ru: "Войти", en: "Sign In", hy: "Մուտք" },
  "login.notBrandYet": { ru: "Ещё нет бренд-аккаунта?", en: "Not a brand account yet?", hy: "Դեռ չունե՞ք բրենդային հաշիվ" },
  "login.expressInterestInstead": { ru: "Проявите интерес вместо этого", en: "Express Interest instead", hy: "Փոխարենը ցուցաբերեք հետաքրքրություն" },
  "login.filmmakerOrAdmin": { ru: "Режиссёр или админ?", en: "Filmmaker or admin?", hy: "Ռեժիսո՞ր եք կամ ադմին" },
  "login.goToAdminLogin": { ru: "Перейти к входу в админку", en: "Go to admin login", hy: "Անցնել ադմինի մուտք" },

  "register.title": { ru: "Создать бренд-аккаунт", en: "Create a Brand Account", hy: "Ստեղծել բրենդային հաշիվ" },
  "register.subtitle": {
    ru: "Аккаунты брендов скоро появятся — проявите интерес ниже, и мы свяжемся с вами.",
    en: "Brand accounts coming soon — express interest below and we'll reach out.",
    hy: "Բրենդային հաշիվները շուտով հասանելի կլինեն․ ցուցաբերեք հետաքրքրություն ներքևում, և մենք կկապվենք ձեզ հետ։",
  },
  "register.fullName": { ru: "Полное имя", en: "Full name", hy: "Լրիվ անուն" },
  "register.fullNamePlaceholder": { ru: "Иван Иванов", en: "Jane Doe", hy: "Անուն Ազգանուն" },
  "register.workEmail": { ru: "Рабочий email", en: "Work email", hy: "Աշխատանքային էլ. փոստ" },
  "register.companyPlaceholder": { ru: "Название компании", en: "Brand Inc.", hy: "Ընկերության անվանում" },
  "register.expressInterest": { ru: "Проявить интерес", en: "Express Interest", hy: "Ցուցաբերել հետաքրքրություն" },
  "register.alreadyHaveAccess": { ru: "Уже есть доступ?", en: "Already have access?", hy: "Արդեն ունե՞ք հասանելիություն" },
  "register.signIn": { ru: "Войти", en: "Sign in", hy: "Մուտք" },
  "register.filmmakerOrAdmin": { ru: "Режиссёр или админ?", en: "Filmmaker or admin?", hy: "Ռեժիսո՞ր եք կամ ադմին" },
  "register.goToAdminLogin": { ru: "Перейти к входу в админку", en: "Go to admin login", hy: "Անցնել ադմինի մուտք" },
};

/** Build a UI translator bound to a locale. Supports `{token}` interpolation
 *  via a second argument, e.g. t("catalog.showingProjectsPrefix"). */
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
