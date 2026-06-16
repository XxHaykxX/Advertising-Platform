/* Registry of editable landing texts (client-safe). The ru/en/hy values are the
   seed defaults and the runtime fallback when a content row is missing/empty. */

import { LOCALES, type Locale } from "@/lib/i18n";

export type ContentItem = {
  key: string;
  label: string;
  ru: string;
  en: string;
  hy: string;
  multiline?: boolean;
};
export type ContentGroup = { group: string; items: ContentItem[] };

export const CONTENT_GROUPS: ContentGroup[] = [
  {
    group: "Hero",
    items: [
      { key: "hero.eyebrow", label: "Над заголовком", ru: "Product placement в кино", en: "Product placement in film", hy: "Ապրանքի տեղադրում կինոյում" },
      { key: "hero.titleLead", label: "Заголовок (начало)", ru: "Ваш бренд —", en: "Your brand —", hy: "Ձեր ապրանքանիշը —" },
      { key: "hero.titleAccent", label: "Заголовок (акцент)", ru: "в кадре будущих фильмов", en: "in the frame of upcoming films", hy: "ապագա ֆիլմերի կադրում" },
      { key: "hero.subtitle", label: "Подзаголовок", ru: "Витрина проектов, которые ещё снимаются. Забронируйте размещение заранее — до выхода фильма, пока места свободны.", en: "A showcase of films still in production. Book your placement in advance — before the premiere, while slots are open.", hy: "Դեռ նկարահանվող ֆիլմերի ցուցափեղկ։ Ամրագրեք տեղադրումը նախապես՝ մինչ պրեմիերան, քանի դեռ տեղ կա։", multiline: true },
      { key: "hero.ctaPrimary", label: "Кнопка 1", ru: "Оставить заявку", en: "Get in touch", hy: "Թողնել հայտ" },
      { key: "hero.ctaSecondary", label: "Кнопка 2", ru: "Смотреть проекты", en: "View projects", hy: "Դիտել նախագծերը" },
    ],
  },
  {
    group: "Как это работает",
    items: [
      { key: "how.eyebrow", label: "Над заголовком", ru: "Как это работает", en: "How it works", hy: "Ինչպես է աշխատում" },
      { key: "how.heading", label: "Заголовок", ru: "Три шага до сделки", en: "Three steps to a deal", hy: "Երեք քայլ դեպի գործարք" },
      { key: "how.subtitle", label: "Подзаголовок", ru: "Прозрачный путь от публикации проекта до размещения вашего бренда в кадре.", en: "A transparent path from publishing a project to placing your brand in the frame.", hy: "Թափանցիկ ճանապարհ՝ նախագծի հրապարակումից մինչ ձեր ապրանքանիշի տեղադրումը կադրում։", multiline: true },
      { key: "how.step1.title", label: "Шаг 1 — заголовок", ru: "Производитель публикует проект", en: "The producer publishes a project", hy: "Պրոդյուսերը հրապարակում է նախագիծը" },
      { key: "how.step1.desc", label: "Шаг 1 — текст", ru: "Студия заранее размещает будущий фильм и доступные рекламные слоты — ещё до начала съёмок. Покупатели видят проект задолго до выхода.", en: "The studio lists an upcoming film and available ad slots in advance — even before shooting starts. Buyers see the project long before release.", hy: "Ստուդիան նախապես տեղադրում է ապագա ֆիլմը և հասանելի գովազդային տեղերը՝ նույնիսկ նկարահանումից առաջ։ Գնորդները տեսնում են նախագիծը թողարկումից շատ առաջ։", multiline: true },
      { key: "how.step2.title", label: "Шаг 2 — заголовок", ru: "Покупатель оставляет заявку", en: "The buyer submits a request", hy: "Գնորդը թողնում է հայտ" },
      { key: "how.step2.desc", label: "Шаг 2 — текст", ru: "Рекламодатель находит подходящий проект в каталоге, выбирает тип размещения и бронирует слот заявкой — пока места свободны.", en: "The advertiser finds a suitable project in the catalog, chooses a placement type and books a slot with a request — while spots are free.", hy: "Գովազդատուն կատալոգում գտնում է հարմար նախագիծ, ընտրում տեղադրման տեսակը և ամրագրում տեղը հայտով՝ քանի դեռ տեղ կա։", multiline: true },
      { key: "how.step3.title", label: "Шаг 3 — заголовок", ru: "Менеджер ведёт сделку", en: "A manager handles the deal", hy: "Մենեջերը վարում է գործարքը" },
      { key: "how.step3.desc", label: "Шаг 3 — текст", ru: "Наш менеджер связывается, согласует условия и сопровождает размещение вашего бренда в кадре — вплоть до выхода фильма.", en: "Our manager gets in touch, agrees the terms and supports your brand placement in the frame — all the way to the film's release.", hy: "Մեր մենեջերը կապ է հաստատում, համաձայնեցնում պայմանները և ուղեկցում ձեր ապրանքանիշի տեղադրումը կադրում՝ մինչ ֆիլմի թողարկումը։", multiline: true },
    ],
  },
  {
    group: "Каталог",
    items: [
      { key: "catalog.eyebrow", label: "Над заголовком", ru: "Каталог проектов", en: "Project catalog", hy: "Նախագծերի կատալոգ" },
      { key: "catalog.heading", label: "Заголовок", ru: "Будущие фильмы — выберите свой кадр", en: "Upcoming films — pick your frame", hy: "Ապագա ֆիլմեր — ընտրեք ձեր կադրը" },
      { key: "catalog.subtitle", label: "Подзаголовок", ru: "Бронируйте размещение заранее. Места ограничены, дедлайн заявок создаёт очередь.", en: "Book your placement in advance. Spots are limited; the application deadline creates a queue.", hy: "Ամրագրեք տեղադրումը նախապես։ Տեղերը սահմանափակ են, հայտերի վերջնաժամկետը հերթ է ստեղծում։", multiline: true },
    ],
  },
  {
    group: "Портфолио",
    items: [
      { key: "portfolio.eyebrow", label: "Над заголовком", ru: "Портфолио", en: "Portfolio", hy: "Պորտֆոլիո" },
      { key: "portfolio.heading", label: "Заголовок", ru: "Бренды, которые уже в кадре", en: "Brands already in the frame", hy: "Ապրանքանիշներ, որոնք արդեն կադրում են" },
      { key: "portfolio.subtitle", label: "Подзаголовок", ru: "Реальные кейсы размещений — где и как реклама уже жила в кино.", en: "Real placement cases — where and how advertising already lived in film.", hy: "Տեղադրման իրական դեպքեր — որտեղ և ինչպես գովազդն արդեն ապրել է կինոյում։", multiline: true },
    ],
  },
  {
    group: "Партнёры",
    items: [
      { key: "partners.eyebrow", label: "Над заголовком", ru: "Партнёры", en: "Partners", hy: "Գործընկերներ" },
      { key: "partners.heading", label: "Заголовок", ru: "Нам доверяют бренды", en: "Brands trust us", hy: "Ապրանքանիշները վստահում են մեզ" },
      { key: "partners.subtitle", label: "Подзаголовок", ru: "Компании, которые уже размещали рекламу в проектах платформы.", en: "Companies that have already advertised in the platform's projects.", hy: "Ընկերություններ, որոնք արդեն գովազդ են տեղադրել հարթակի նախագծերում։", multiline: true },
    ],
  },
  {
    group: "Контакты",
    items: [
      { key: "contact.eyebrow", label: "Над заголовком", ru: "Контакты", en: "Contacts", hy: "Կոնտակտներ" },
      { key: "contact.heading", label: "Заголовок", ru: "Оставьте заявку — менеджер перезвонит", en: "Leave a request — a manager will call back", hy: "Թողեք հայտ — մենեջերը կզանգահարի" },
      { key: "contact.subtitle", label: "Подзаголовок", ru: "Заполните форму или свяжитесь напрямую — ответим и подберём проект под ваш бренд.", en: "Fill out the form or contact us directly — we'll reply and pick a project for your brand.", hy: "Լրացրեք ձևը կամ կապվեք ուղղակիորեն — կպատասխանենք և կընտրենք նախագիծ ձեր ապրանքանիշի համար։", multiline: true },
    ],
  },
  {
    group: "Футер",
    items: [
      { key: "footer.tagline", label: "Описание", ru: "Маркетплейс product placement в фильмах. Бронируйте размещение бренда в будущих проектах заранее.", en: "A marketplace for product placement in films. Book your brand placement in upcoming projects in advance.", hy: "Ֆիլմերում ապրանքի տեղադրման շուկա։ Ամրագրեք ձեր ապրանքանիշի տեղադրումը ապագա նախագծերում նախապես։", multiline: true },
    ],
  },
];

export const CONTENT_KEYS = CONTENT_GROUPS.flatMap((g) => g.items);

/** Per-locale default text maps (used as the rendering base before DB overrides). */
export const CONTENT_DEFAULTS_BY_LOCALE: Record<Locale, Record<string, string>> =
  Object.fromEntries(
    LOCALES.map((loc) => [
      loc,
      Object.fromEntries(CONTENT_KEYS.map((i) => [i.key, i[loc] || i.ru])),
    ]),
  ) as Record<Locale, Record<string, string>>;

/** RU defaults (back-compat / admin editor fallback). */
export const CONTENT_DEFAULTS = CONTENT_DEFAULTS_BY_LOCALE.ru;
