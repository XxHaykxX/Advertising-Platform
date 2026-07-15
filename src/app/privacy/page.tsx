import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/components/footer";
import { LegalPage, type LegalSection } from "@/components/legal-page";
import { getLocale } from "@/lib/data/locale";
import { getCurrency } from "@/lib/data/currency";
import { makeUI, type Locale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Privacy Policy — iGovazd",
  description:
    "Privacy Policy for iGovazd marketplace. Learn how we collect, use, and protect your data.",
};

const content: Record<
  Locale,
  { updated: string; intro: string; sections: LegalSection[] }
> = {
  hy: {
    updated: "Հուլիս 2026",
    intro:
      "Այս Գաղտնիության քաղաքականությունը բացատրում է, թե ինչպես է iGovazd-ը հավաքագրում, օգտագործում և պաշտպանում Ձեր անձնական տվյալները: Մենք հավատարիմ ենք թափանցիկությանը և կիրառելի տվյալների պաշտպանության օրենքների պահպանմանը: iGovazd-ն օգտագործելով՝ Դուք համաձայնում եք ստորև նկարագրված գործելակերպերի հետ:",
    sections: [
      {
        heading: "Ինչ տվյալներ ենք հավաքագրում",
        body: [
          "iGovazd-ը հավաքագրում է անձնական տեղեկություններ՝ ֆիլմերում և հեռուստահաղորդումներում բրենդային տեղադրումը հեշտացնելու համար: Սա ներառում է կոնտակտային տեղեկություններ (անուն, էլ. հասցե, հեռախոս), ընկերության տվյալներ, նախագծի տեղեկատվություն, վճարային տվյալներ և օգտագործման վերլուծություն: Հաշիվ ստեղծելիս մենք հավաքագրում ենք վավերացման տվյալներ և պրոֆիլի տեղեկություններ: Ստեղծագործողների համար մենք հավաքագրում ենք նկարահանման մանրամասներ, բյուջեի տեղեկություններ և նկարահանման ժամանակացույցեր: Բրենդների համար մենք հավաքագրում ենք ապրանքի տեղեկություններ, տեղադրման նախապատվություններ և բյուջեի բաշխումներ: Մենք օգտագործում ենք cookie ֆայլեր և նմանատիպ տեխնոլոգիաներ՝ Ձեր դիտարկման վարքագծի և սարքի տեղեկատվության մասին տվյալներ հավաքագրելու համար:",
          "Ամբողջ նույնականացվող անձնական տեղեկատվությունը մշակվում է կիրառելի տվյալների պաշտպանության կանոնակարգերին համապատասխան: Մենք հավաքագրում ենք միայն մեր ծառայությունները մատուցելու և իրավական պարտավորությունները կատարելու համար անհրաժեշտ նվազագույն տվյալները:",
        ],
      },
      {
        heading: "Ինչպես ենք օգտագործում Ձեր տվյալները",
        body: [
          "Ձեր անձնական տվյալներն օգտագործվում են iGovazd շուկան կառավարելու և բարելավելու համար: Մասնավորապես, մենք դրանք օգտագործում ենք՝ (1) օգտատերերին վավերացնելու և հաշվի անվտանգությունը պահպանելու համար. (2) բրենդների և ստեղծագործողների միջև կապեր հեշտացնելու համար. (3) գործարքներ մշակելու և վճարումները կառավարելու համար. (4) տեղադրման կատարողականի վերաբերյալ հաշվետվություններ և վերլուծություններ ստեղծելու համար. (5) ծառայության թարմացումների, քաղաքականության փոփոխությունների և մարքեթինգային տեղեկատվության մասին հաղորդակցվելու համար. (6) հաճախորդների աջակցություն տրամադրելու համար. (7) իրավական պարտավորությունները կատարելու և մեր Ծառայության մատուցման պայմանները կիրառելու համար:",
          "Մենք օգտագործում ենք ագրեգացված, անանունացված տվյալներ՝ միտումների վերլուծության և ծառայության բարելավման համար: Մենք չենք վաճառի Ձեր անձնական տեղեկությունը երրորդ կողմերին: Տվյալների մշակումը սահմանափակվում է նշված նպատակների համար անհրաժեշտով:",
        ],
      },
      {
        heading: "Cookie ֆայլեր և հետևման տեխնոլոգիաներ",
        body: [
          "iGovazd-ն օգտագործում է cookie ֆայլեր, տեղական պահեստավորում և նմանատիպ տեխնոլոգիաներ՝ օգտատիրոջ փորձը բարելավելու համար: Անհրաժեշտ cookie ֆայլերն անհրաժեշտ են վավերացման և անվտանգության համար: Ֆունկցիոնալ cookie ֆայլերը հիշում են օգտատիրոջ նախապատվություններն ու կարգավորումները: Վերլուծական cookie ֆայլերն օգնում են մեզ հասկանալ, թե ինչպես են օգտատերերն օգտագործում հարթակը՝ օգտագործելով այնպիսի ծառայություններ, ինչպիսին Google Analytics-ն է: Մարքեթինգային cookie ֆայլերը կարող են օգտագործվել համապատասխան գովազդ ցուցադրելու և արշավների արդյունավետությունը հետևելու համար:",
          "Դուք կարող եք վերահսկել cookie ֆայլերի կարգավորումները Ձեր դիտարկիչի նախապատվությունների միջոցով: Որոշ cookie ֆայլերի անջատումը կարող է սահմանափակել ֆունկցիոնալությունը: Մենք չենք հետևում օգտատերերին երրորդ կողմերի կայքերում, եթե նրանք հստակորեն չեն ընտրել մարքեթինգային ծառայությունները:",
        ],
      },
      {
        heading: "Երրորդ կողմերի հետ կիսում և ծառայություններ մատուցողներ",
        body: [
          "iGovazd-ը կարող է կիսվել տվյալներով վստահելի ծառայություններ մատուցողների հետ, որոնք օգնում են հարթակի աշխատանքին, ներառյալ վճարումների մշակողներ (Stripe), վերլուծության մատակարարներ (Google Analytics), էլ. փոստի առաքման ծառայություններ և հոսթինգ մատակարարներ: Այս ծառայություններ մատուցողները պայմանագրով պարտավոր են օգտագործել Ձեր տվյալները միայն մեր նշած նպատակների համար և պահպանել գաղտնիությունը:",
          "Մենք չենք կիսվում անձնական տեղեկություններով երրորդ կողմերի հետ նրանց մարքեթինգային նպատակների համար՝ առանց Ձեր հստակ համաձայնության: Մենք կարող ենք բացահայտել տեղեկատվությունը, երբ դա պահանջվում է օրենքով, դատարանի որոշմամբ կամ պետական մարմնի հարցումով: Եթե մենք տեղեկանանք ապօրինի գործունեության կամ մեր Ծառայության մատուցման պայմանների խախտումների մասին, կարող ենք զեկուցել համապատասխան մարմիններին:",
        ],
      },
      {
        heading: "Տվյալների պահպանում և անվտանգություն",
        body: [
          "Անձնական տեղեկությունը պահվում է այնքան ժամանակ, որքան անհրաժեշտ է ծառայություններ մատուցելու և իրավական պարտավորությունները կատարելու համար: Հաշվի տվյալները հիմնականում պահվում են հաշվի գործողության ողջ ընթացքում և ողջամիտ ժամանակահատվածում այնուհետև՝ վեճերը լուծելու համար: Գործարքների գրառումները պահվում են հաշվապահական և կանոնակարգային նպատակներով: Դուք կարող եք պահանջել Ձեր հաշվի և կապակցված տվյալների ջնջում՝ իրավական պահպանման պահանջներին համապատասխան:",
          "Մենք կիրառում ենք ոլորտի ստանդարտ անվտանգության միջոցներ, ներառյալ գաղտնագրում (SSL/TLS), գաղտնաբառերի անվտանգ հեշավորում, firewall-ներ և կանոնավոր անվտանգության աուդիտներ: Զգայուն տվյալների հասանելիությունը սահմանափակված է լիազորված անձնակազմով: Այնուամենայնիվ, ոչ մի համակարգ ամբողջովին անվտանգ չէ, և մենք չենք կարող երաշխավորել Ձեր տեղեկատվության բացարձակ անվտանգությունը:",
        ],
      },
      {
        heading: "Ձեր իրավունքները և կապ",
        body: [
          "Ձեր իրավազորությունից կախված՝ Դուք կարող եք ունենալ իրավունքներ, ներառյալ Ձեր տվյալներին հասանելիություն, անճշտությունների ուղղում, ջնջման հայտեր, տվյալների փոխանցելիություն և համաձայնության հետկանչում: Այս իրավունքներից օգտվելու համար կապվեք մեր գաղտնիության թիմի հետ՝ privacy@igovazd.am հասցեով: Մենք կպատասխանենք հաստատված հարցումներին 30 օրվա ընթացքում: Եթե կարծում եք, որ մենք ոչ պատշաճ ենք վարվել Ձեր տվյալների հետ, կարող եք բողոք ներկայացնել Ձեր տեղական տվյալների պաշտպանության մարմնին:",
          "Գաղտնիության հարցերի կամ մտահոգությունների համար կապվեք՝ iGovazd Գաղտնիության թիմ, privacy@igovazd.am: Մենք պարբերաբար թարմացնում ենք այս գաղտնիության քաղաքականությունը: Էական փոփոխությունների մասին կհաղորդակցվենք էլ. փոստով կամ հարթակի վրա տեսանելի ծանուցումով: iGovazd-ի շարունակական օգտագործումը նշանակում է թարմացված քաղաքականության ընդունում:",
        ],
      },
    ],
  },
  ru: {
    updated: "Июль 2026",
    intro:
      "Настоящая Политика конфиденциальности объясняет, как iGovazd собирает, использует и защищает Вашу личную информацию. Мы привержены прозрачности и соблюдению применимых законов о защите данных. Используя iGovazd, Вы соглашаетесь с описанными ниже практиками.",
    sections: [
      {
        heading: "Какие данные мы собираем",
        body: [
          "iGovazd собирает персональную информацию для облегчения размещения брендов в кино- и телепроизводстве. Это включает контактную информацию (имя, e-mail, телефон), данные компании, информацию о проекте, платёжные данные и аналитику использования. При создании учётной записи мы собираем учётные данные для аутентификации и информацию профиля. Для продюсеров мы собираем детали производства, информацию о бюджете и график съёмок. Для брендов мы собираем информацию о продукте, предпочтения по размещению и распределение бюджета. Мы используем файлы cookie и аналогичные технологии для сбора информации о Вашем поведении при просмотре и информации об устройстве.",
          "Вся персонально идентифицируемая информация обрабатывается в соответствии с применимыми нормами защиты данных. Мы собираем только минимально необходимые данные для предоставления наших услуг и выполнения юридических обязательств.",
        ],
      },
      {
        heading: "Как мы используем Ваши данные",
        body: [
          "Ваши персональные данные используются для работы и улучшения торговой площадки iGovazd. В частности, мы используем их для: (1) аутентификации пользователей и поддержания безопасности учётной записи; (2) содействия связям между брендами и продюсерами; (3) обработки транзакций и управления платежами; (4) формирования отчётов и аналитики по эффективности размещения; (5) информирования об обновлениях сервиса, изменениях политики и маркетинговых материалах; (6) предоставления клиентской поддержки; (7) соблюдения юридических обязательств и обеспечения выполнения наших Условий использования.",
          "Мы используем агрегированные, обезличенные данные для анализа тенденций и улучшения сервиса. Мы не будем продавать Вашу личную информацию третьим лицам. Обработка данных ограничена тем, что необходимо для заявленных целей.",
        ],
      },
      {
        heading: "Файлы cookie и технологии отслеживания",
        body: [
          "iGovazd использует файлы cookie, локальное хранилище и аналогичные технологии для улучшения пользовательского опыта. Необходимые файлы cookie требуются для аутентификации и безопасности. Функциональные файлы cookie запоминают предпочтения и настройки пользователя. Аналитические файлы cookie помогают нам понять, как пользователи взаимодействуют с платформой, используя такие сервисы, как Google Analytics. Маркетинговые файлы cookie могут использоваться для показа релевантной рекламы и отслеживания эффективности кампаний.",
          "Вы можете управлять настройками файлов cookie через настройки браузера. Отключение некоторых файлов cookie может ограничить функциональность. Мы не отслеживаем пользователей на сторонних сайтах, если они явно не согласились на маркетинговые сервисы.",
        ],
      },
      {
        heading: "Передача третьим лицам и поставщики услуг",
        body: [
          "iGovazd может передавать данные доверенным поставщикам услуг, которые помогают в работе платформы, включая платёжных процессоров (Stripe), поставщиков аналитики (Google Analytics), сервисы доставки электронной почты и хостинг-провайдеров. Эти поставщики услуг по договору обязаны использовать Ваши данные только в указанных нами целях и сохранять конфиденциальность.",
          "Мы не передаём личную информацию третьим лицам для их маркетинговых целей без Вашего явного согласия. Мы можем раскрывать информацию, когда этого требует закон, судебное постановление или запрос государственного органа. Если нам станет известно о незаконной деятельности или нарушениях наших Условий использования, мы можем сообщить об этом соответствующим органам.",
        ],
      },
      {
        heading: "Хранение данных и безопасность",
        body: [
          "Личная информация хранится столько, сколько необходимо для предоставления услуг и выполнения юридических обязательств. Данные учётной записи, как правило, хранятся в течение всего срока действия учётной записи и разумный период после этого для разрешения споров. Записи о транзакциях хранятся в целях бухгалтерского учёта и соблюдения нормативных требований. Вы можете запросить удаление своей учётной записи и связанных данных с учётом требований к юридическому хранению.",
          "Мы применяем отраслевые стандартные меры безопасности, включая шифрование (SSL/TLS), безопасное хеширование паролей, межсетевые экраны и регулярные аудиты безопасности. Доступ к конфиденциальным данным ограничен уполномоченным персоналом. Однако ни одна система не является полностью безопасной, и мы не можем гарантировать абсолютную безопасность Вашей информации.",
        ],
      },
      {
        heading: "Ваши права и контакты",
        body: [
          "В зависимости от Вашей юрисдикции, у Вас могут быть права, включая доступ к Вашим данным, исправление неточностей, запросы на удаление, переносимость данных и отзыв согласия. Чтобы воспользоваться этими правами, свяжитесь с нашей командой по конфиденциальности по адресу privacy@igovazd.am. Мы ответим на подтверждённые запросы в течение 30 дней. Если Вы считаете, что мы неправильно обработали Ваши данные, Вы можете подать жалобу в местный орган по защите данных.",
          "По вопросам конфиденциальности обращайтесь: Команда по конфиденциальности iGovazd, privacy@igovazd.am. Мы периодически обновляем данную политику конфиденциальности. О существенных изменениях будет сообщено по электронной почте или заметным уведомлением на платформе. Продолжение использования iGovazd означает принятие обновлённой политики.",
        ],
      },
    ],
  },
  en: {
    updated: "July 2026",
    intro:
      "This Privacy Policy explains how iGovazd collects, uses, and protects your personal information. We are committed to transparency and compliance with applicable data protection laws. By using iGovazd, you agree to the practices outlined below.",
    sections: [
      {
        heading: "Data We Collect",
        body: [
          "iGovazd collects personal information to facilitate brand placement in film and television productions. This includes contact information (name, email, phone), company details, project information, payment data, and usage analytics. When you create an account, we collect authentication credentials and profile information. For filmmakers, we gather production details, budget information, and filming schedules. For brands, we collect product information, placement preferences, and budget allocations. We use cookies and similar technologies to collect information about your browsing behavior and device information.",
          "All personally identifiable information is handled in accordance with applicable data protection regulations. We collect only the minimum data necessary to provide our services and fulfill legal obligations.",
        ],
      },
      {
        heading: "How We Use Your Data",
        body: [
          "Your personal data is used to operate and improve the iGovazd marketplace. Specifically, we use it to: (1) authenticate users and maintain account security; (2) facilitate connections between brands and filmmakers; (3) process transactions and manage payments; (4) generate reports and analytics on placement performance; (5) communicate service updates, policy changes, and marketing information; (6) provide customer support; (7) comply with legal obligations and enforce our Terms of Service.",
          "We use aggregated, anonymized data for trend analysis and service improvement. We will not sell your personal information to third parties. Data processing is limited to what is necessary for the stated purposes.",
        ],
      },
      {
        heading: "Cookies and Tracking Technologies",
        body: [
          "iGovazd uses cookies, local storage, and similar technologies to enhance user experience. Essential cookies are necessary for authentication and security. Functional cookies remember user preferences and settings. Analytical cookies help us understand how users interact with the platform, using services such as Google Analytics. Marketing cookies may be used to display relevant advertising and track campaign effectiveness.",
          "You can control cookie settings through your browser preferences. Disabling certain cookies may limit functionality. We do not track users across third-party websites unless they explicitly opt into marketing services.",
        ],
      },
      {
        heading: "Third-Party Sharing and Service Providers",
        body: [
          "iGovazd may share data with trusted service providers who assist in operating the platform, including payment processors (Stripe), analytics providers (Google Analytics), email delivery services, and hosting providers. These service providers are contractually obligated to use your data only for the purposes we specify and to maintain confidentiality.",
          "We do not share personal information with third parties for their marketing purposes without your explicit consent. We may disclose information when required by law, court order, or government request. If we become aware of illegal activity or violations of our Terms of Service, we may report to relevant authorities.",
        ],
      },
      {
        heading: "Data Retention and Security",
        body: [
          "Personal information is retained as long as necessary to provide services and fulfill legal obligations. Account data is generally retained for the duration of the account and for a reasonable period thereafter to resolve disputes. Transaction records are kept for accounting and compliance purposes. You may request deletion of your account and associated data, subject to legal retention requirements.",
          "We implement industry-standard security measures including encryption (SSL/TLS), secure password hashing, firewalls, and regular security audits. Access to sensitive data is restricted to authorized personnel. However, no system is completely secure, and we cannot guarantee absolute security of your information.",
        ],
      },
      {
        heading: "Your Rights and Contact",
        body: [
          "Depending on your jurisdiction, you may have rights including access to your data, correction of inaccuracies, deletion requests, data portability, and withdrawal of consent. To exercise these rights, contact our privacy team at privacy@igovazd.am. We will respond to verified requests within 30 days. If you believe we have mishandled your data, you may lodge a complaint with your local data protection authority.",
          "For privacy inquiries or concerns, please contact: iGovazd Privacy Team, privacy@igovazd.am. We update this privacy policy periodically. Significant changes will be communicated via email or prominent notice on the platform. Your continued use of iGovazd constitutes acceptance of the updated policy.",
        ],
      },
    ],
  },
};

export default async function PrivacyPage() {
  const locale = await getLocale();
  const currency = await getCurrency();
  const t = makeUI(locale);
  const c = content[locale];
  return (
    <>
      <SiteHeader />
      <LegalPage
        title={t("legal.privacyTitle")}
        updated={c.updated}
        intro={c.intro}
        sections={c.sections}
        locale={locale}
      />
      <Footer locale={locale} currency={currency} />
    </>
  );
}
