/* i18n core (client-safe). Locale is stored in the `locale` cookie and drives
   server rendering. This UI dictionary covers static chrome (nav, hero, forms,
   footer, catalog filters) — content that later comes from the DB stays
   English-only for now. */

export const LOCALES = ["ru", "en", "hy"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "locale";

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}

type Dict = Record<Locale, string>;

export const UI: Record<string, Dict> = {
  // ── header nav ──────────────────────────────
  "nav.how": { ru: "Как это работает", en: "How It Works", hy: "Ինչպես է աշխատում" },
  "nav.faq": { ru: "Вопросы и ответы", en: "FAQ", hy: "Հաճախ տրվող հարցեր" },
  "nav.about": { ru: "О нас", en: "About", hy: "Մեր մասին" },
  "nav.contact": { ru: "Контакты", en: "Contact", hy: "Կոնտակտներ" },
  "nav.signIn": { ru: "Войти", en: "Sign In", hy: "Մուտք" },
  "nav.register": { ru: "Регистрация", en: "Register", hy: "Գրանցում" },
  "nav.browseProjects": { ru: "Смотреть проекты", en: "Browse Projects", hy: "Դիտել նախագծերը" },

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

  // ── buttons / CTAs ──────────────────────────
  "btn.getStarted": { ru: "Начать", en: "Get Started", hy: "Սկսել" },
  "btn.viewReport": { ru: "Смотреть отчёт", en: "View Report", hy: "Դիտել հաշվետվությունը" },
  "btn.requestDetails": { ru: "Запросить детали", en: "Request details", hy: "Հարցնել մանրամասներ" },
  "btn.expressInterest": { ru: "Проявить интерес", en: "Express Interest", hy: "Ցուցաբերել հետաքրքրություն" },
  "btn.browseProjects": { ru: "Смотреть проекты", en: "Browse Projects", hy: "Դիտել նախագծերը" },

  // ── footer ──────────────────────────────────
  "footer.tagline": {
    ru: "Находите премиальные возможности для брендированного плейсмента в кино и на ТВ.",
    en: "Discover premium brand placement opportunities in film and TV.",
    hy: "Բացահայտեք բրենդային տեղադրման պրեմիում հնարավորություններ կինոյում և հեռուստատեսությունում։",
  },
  "footer.product": { ru: "Продукт", en: "Product", hy: "Արտադրանք" },
  "footer.company": { ru: "Компания", en: "Company", hy: "Ընկերություն" },
  "footer.legal": { ru: "Правовая информация", en: "Legal", hy: "Իրավական տեղեկություններ" },
  "footer.browseProjects": { ru: "Смотреть проекты", en: "Browse Projects", hy: "Դիտել նախագծերը" },
  "footer.howItWorks": { ru: "Как это работает", en: "How It Works", hy: "Ինչպես է աշխատում" },
  "footer.faq": { ru: "Вопросы и ответы", en: "FAQ", hy: "Հաճախ տրվող հարցեր" },
  "footer.about": { ru: "О нас", en: "About", hy: "Մեր մասին" },
  "footer.contact": { ru: "Контакты", en: "Contact", hy: "Կոնտակտներ" },
  "footer.terms": { ru: "Условия использования", en: "Terms", hy: "Պայմաններ" },
  "footer.privacy": { ru: "Политика конфиденциальности", en: "Privacy", hy: "Գաղտնիության քաղաքականություն" },
  "footer.rights": { ru: "Все права защищены.", en: "All rights reserved.", hy: "Բոլոր իրավունքները պաշտպանված են։" },

  // ── catalog / filters ───────────────────────
  "catalog.filters": { ru: "Фильтры", en: "Filters", hy: "Զտիչներ" },
  "catalog.genre": { ru: "Жанр", en: "Genre", hy: "Ժանր" },
  "catalog.targetAudience": { ru: "Целевая аудитория", en: "Target Audience", hy: "Թիրախային լսարան" },
  "catalog.budgetRange": { ru: "Диапазон бюджета", en: "Budget Range", hy: "Բյուջեի միջակայք" },
  "catalog.productCategory": { ru: "Категория продукта", en: "Product Category", hy: "Ապրանքի կատեգորիա" },
  "catalog.brandSafety": { ru: "Безопасность бренда", en: "Brand Safety", hy: "Բրենդի անվտանգություն" },
  "catalog.status": { ru: "Статус", en: "Status", hy: "Կարգավիճակ" },
  "catalog.clearAll": { ru: "Сбросить всё", en: "Clear All", hy: "Մաքրել բոլորը" },
  "catalog.searchPlaceholder": { ru: "Поиск по проектам…", en: "Search projects…", hy: "Որոնել նախագծեր…" },
  "catalog.showingProjects": { ru: "Показано проектов: {n}", en: "Showing {n} projects", hy: "Ցուցադրված է {n} նախագիծ" },
  "catalog.mostRelevant": { ru: "Сначала релевантные", en: "Most relevant", hy: "Առավել համապատասխան" },

  // ── forms ───────────────────────────────────
  "form.name": { ru: "Имя", en: "Name", hy: "Անուն" },
  "form.phone": { ru: "Телефон", en: "Phone", hy: "Հեռախոս" },
  "form.email": { ru: "Email", en: "Email", hy: "Էլ. փոստ" },
  "form.company": { ru: "Компания", en: "Company", hy: "Ընկերություն" },
  "form.message": { ru: "Сообщение", en: "Message", hy: "Հաղորդագրություն" },
  "form.send": { ru: "Отправить", en: "Send", hy: "Ուղարկել" },
  "form.consent": {
    ru: "Я согласен на обработку персональных данных",
    en: "I agree to the processing of my personal data",
    hy: "Համաձայն եմ անձնական տվյալների մշակմանը",
  },
};

/** Build a UI translator bound to a locale. */
export function makeUI(locale: Locale) {
  return (key: string) => UI[key]?.[locale] ?? UI[key]?.en ?? key;
}
