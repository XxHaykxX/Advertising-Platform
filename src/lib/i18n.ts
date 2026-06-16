/* i18n core (client-safe). Locale is stored in the `locale` cookie and drives
   server rendering. DB content (content/projects/portfolio) is localized with a
   RU fallback; this UI dictionary covers static chrome (nav, buttons, labels). */

export const LOCALES = ["ru", "en", "hy"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ru";
export const LOCALE_COOKIE = "locale";

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}

type Dict = Record<Locale, string>;

export const UI: Record<string, Dict> = {
  "nav.how": { ru: "Как это работает", en: "How it works", hy: "Ինչպես է աշխատում" },
  "nav.catalog": { ru: "Каталог", en: "Catalog", hy: "Կատալոգ" },
  "nav.portfolio": { ru: "Портфолио", en: "Portfolio", hy: "Պորտֆոլիո" },
  "nav.partners": { ru: "Партнёры", en: "Partners", hy: "Գործընկերներ" },
  "nav.contact": { ru: "Контакты", en: "Contacts", hy: "Կոնտակտներ" },
  "nav.cta": { ru: "Оставить заявку", en: "Get in touch", hy: "Թողնել հայտ" },

  "card.more": { ru: "Подробнее", en: "Details", hy: "Մանրամասն" },
  "card.apply": { ru: "Оставить заявку", en: "Apply", hy: "Հայտ" },

  "catalog.search": { ru: "Поиск по названию…", en: "Search by title…", hy: "Որոնում ըստ վերնագրի…" },
  "catalog.allGenres": { ru: "Все жанры", en: "All genres", hy: "Բոլոր ժանրերը" },
  "catalog.found": { ru: "Найдено проектов:", en: "Projects found:", hy: "Գտնված նախագծեր՝" },
  "catalog.priceOnRequest": { ru: "Цена по запросу", en: "Price on request", hy: "Գինը՝ ըստ հարցման" },
  "catalog.notFound": { ru: "Ничего не найдено. Измените фильтры.", en: "Nothing found. Adjust the filters.", hy: "Ոչինչ չի գտնվել։ Փոխեք զտիչները։" },

  "deadline.all": { ru: "Все", en: "All", hy: "Բոլորը" },
  "deadline.1": { ru: "1 месяц", en: "1 month", hy: "1 ամիս" },
  "deadline.3": { ru: "3 месяца", en: "3 months", hy: "3 ամիս" },
  "deadline.6": { ru: "6 месяцев", en: "6 months", hy: "6 ամիս" },
  "deadline.12": { ru: "год", en: "1 year", hy: "1 տարի" },

  "footer.nav": { ru: "Навигация", en: "Navigation", hy: "Նավիգացիա" },
  "footer.contacts": { ru: "Контакты", en: "Contacts", hy: "Կոնտակտներ" },
  "footer.docs": { ru: "Документы", en: "Documents", hy: "Փաստաթղթեր" },
  "footer.privacy": { ru: "Политика конфиденциальности", en: "Privacy policy", hy: "Գաղտնիության քաղաքականություն" },
  "footer.consent": { ru: "Согласие на обработку ПД", en: "Personal data consent", hy: "Անձնական տվյալների համաձայնություն" },
  "footer.rights": { ru: "Все права защищены.", en: "All rights reserved.", hy: "Բոլոր իրավունքները պաշտպանված են։" },

  // catalog card
  "card.slots": { ru: "Доступно {a} из {b}", en: "{a} of {b} available", hy: "{a}-ը {b}-ից հասանելի" },
  "card.fewLeft": { ru: "мало мест", en: "few left", hy: "քիչ տեղ" },
  "card.release": { ru: "Выход:", en: "Release:", hy: "Թողարկում՝" },

  // how it works
  "how.step": { ru: "Шаг", en: "Step", hy: "Քայլ" },

  // project detail page
  "pd.back": { ru: "К каталогу", en: "Back to catalog", hy: "Դեպի կատալոգ" },
  "pd.about": { ru: "О проекте", en: "About the project", hy: "Նախագծի մասին" },
  "pd.actors": { ru: "Актёры", en: "Cast", hy: "Դերասաններ" },
  "pd.scenes": { ru: "Сцены для плейсмента", en: "Placement scenes", hy: "Տեղադրման տեսարաններ" },
  "pd.possible": { ru: "Возможный плейсмент:", en: "Possible placement:", hy: "Հնարավոր տեղադրում՝" },
  "pd.frames": { ru: "Кадры", en: "Stills", hy: "Կադրեր" },
  "pd.slots": { ru: "Слоты", en: "Slots", hy: "Տեղեր" },
  "pd.slotsValue": { ru: "{a} из {b} свободно", en: "{a} of {b} free", hy: "{a}-ը {b}-ից ազատ" },
  "pd.release": { ru: "Выход", en: "Release", hy: "Թողարկում" },
  "pd.deadline": { ru: "Дедлайн", en: "Deadline", hy: "Վերջնաժամկետ" },
  "pd.platforms": { ru: "Площадки", en: "Platforms", hy: "Հարթակներ" },
  "pd.price": { ru: "Цена", en: "Price", hy: "Գին" },
  "pd.onRequest": { ru: "по запросу", en: "on request", hy: "ըստ հարցման" },
  "pd.apply": { ru: "Оставить заявку", en: "Apply now", hy: "Թողնել հայտ" },

  // forms (contact + project apply)
  "form.name": { ru: "Имя", en: "Name", hy: "Անուն" },
  "form.namePh": { ru: "Иван Иванов", en: "John Smith", hy: "Անուն Ազգանուն" },
  "form.phone": { ru: "Телефон", en: "Phone", hy: "Հեռախոս" },
  "form.email": { ru: "Email", en: "Email", hy: "Էլ. փոստ" },
  "form.company": { ru: "Компания / бренд", en: "Company / brand", hy: "Ընկերություն / ապրանքանիշ" },
  "form.companyPh": { ru: "Бренд", en: "Brand", hy: "Ապրանքանիշ" },
  "form.message": { ru: "Сообщение", en: "Message", hy: "Հաղորդագրություն" },
  "form.messagePh": { ru: "Коротко о задаче…", en: "Briefly about the task…", hy: "Համառոտ առաջադրանքի մասին…" },
  "form.budget": { ru: "Бюджет", en: "Budget", hy: "Բյուջե" },
  "form.budgetPh": { ru: "например, 300 000 ₽", en: "e.g. $3,000", hy: "օր.՝ 300 000 ֏" },
  "form.project": { ru: "Интересующий проект", en: "Project of interest", hy: "Հետաքրքրող նախագիծ" },
  "form.anyProject": { ru: "Любой / не выбран", en: "Any / not selected", hy: "Ցանկացած / չընտրված" },
  "form.consentPre": { ru: "Я согласен на", en: "I agree to the", hy: "Համաձայն եմ" },
  "form.consentLink": { ru: "обработку персональных данных", en: "processing of personal data", hy: "անձնական տվյալների մշակմանը" },
  "form.submit": { ru: "Отправить заявку", en: "Send request", hy: "Ուղարկել հայտ" },
  "form.sending": { ru: "Отправляем…", en: "Sending…", hy: "Ուղարկվում է…" },
  "form.successTitle": { ru: "Заявка отправлена!", en: "Request sent!", hy: "Հայտն ուղարկվեց!" },
  "form.successText": { ru: "Спасибо. Менеджер свяжется с вами в ближайшее время по указанному телефону.", en: "Thank you. A manager will contact you shortly at the phone number provided.", hy: "Շնորհակալություն։ Մենեջերը շուտով կկապվի ձեզ հետ նշված հեռախոսով։" },
  "form.successProject": { ru: "Спасибо. Менеджер свяжется с вами по проекту «{p}» в ближайшее время.", en: "Thank you. A manager will contact you about the project “{p}” shortly.", hy: "Շնորհակալություն։ Մենեջերը շուտով կկապվի ձեզ հետ «{p}» նախագծի վերաբերյալ։" },
  "form.again": { ru: "Отправить ещё одну", en: "Send another", hy: "Ուղարկել ևս մեկը" },
  "form.error": { ru: "Не удалось отправить заявку. Попробуйте ещё раз или позвоните нам.", en: "Could not send the request. Please try again or call us.", hy: "Չհաջողվեց ուղարկել հայտը։ Փորձեք կրկին կամ զանգահարեք մեզ։" },
  "form.consentNote": { ru: "Нажимая кнопку, вы соглашаетесь с политикой конфиденциальности.", en: "By clicking the button, you agree to the privacy policy.", hy: "Կոճակը սեղմելով՝ դուք համաձայնում եք գաղտնիության քաղաքականությանը։" },

  // portfolio / partners
  "pf.video": { ru: "видео", en: "video", hy: "տեսանյութ" },
  "pt.hint": { ru: "Наведите на ленту, чтобы остановить · логотипы кликабельны", en: "Hover the strip to pause · logos are clickable", hy: "Սավառեք ժապավենի վրա՝ կանգնեցնելու համար · լոգոները սեղմելի են" },

  // a11y
  "a11y.close": { ru: "Закрыть", en: "Close", hy: "Փակել" },
  "a11y.prev": { ru: "Назад", en: "Previous", hy: "Նախորդ" },
  "a11y.next": { ru: "Вперёд", en: "Next", hy: "Հաջորդ" },
  "a11y.scrollDown": { ru: "Прокрутить вниз", en: "Scroll down", hy: "Ոլորել ներքև" },
};

/** Build a UI translator bound to a locale. */
export function makeUI(locale: Locale) {
  return (key: string) => UI[key]?.[locale] ?? UI[key]?.ru ?? key;
}
