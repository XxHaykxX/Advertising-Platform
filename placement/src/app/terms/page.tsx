import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { LegalPage, type LegalSection } from "@/components/legal-page";
import { getLocale } from "@/lib/data/locale";
import { getCurrency } from "@/lib/data/currency";
import { makeUI, type Locale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Terms of Service — iGovazd",
  description:
    "Terms of Service for iGovazd marketplace. Understand the rules and conditions for using our platform.",
};

const content: Record<
  Locale,
  { updated: string; intro: string; sections: LegalSection[] }
> = {
  hy: {
    updated: "Հուլիս 2026",
    intro:
      "Այս Ծառայության մատուցման պայմանները կարգավորում են iGovazd հարթակին, մեր կայքին, բջջային հավելվածներին և ծառայություններին Ձեր հասանելիությունը և օգտագործումը: iGovazd-ը մուտք գործելով կամ օգտագործելով՝ Դուք համաձայնում եք պահպանել այս Պայմանները: Եթե համաձայն չեք, խնդրում ենք չօգտագործել հարթակը: Խնդրում ենք ուշադիր կարդալ:",
    sections: [
      {
        heading: "Ծառայության նկարագրություն",
        body: [
          "iGovazd-ը թվային շուկա է, որը կինոստեղծագործողներին և պրոդյուսերներին կապում է բրենդների հետ, որոնք փնտրում են բրենդային տեղադրման հնարավորություններ ֆիլմերում և հեռուստահաղորդումներում: Հարթակը հեշտացնում է հաղորդակցությունը, բանակցությունները և գործարքների կառավարումը բովանդակություն ստեղծողների (Ստեղծագործողներ) և բրենդների ներկայացուցիչների (Բրենդներ) միջև: iGovazd-ն ինքնուրույն չի արտադրում բովանդակություն, չի կառավարում նկարահանումները և ուղղակիորեն չի տեղադրում ապրանքներ: Մենք ապահովում ենք ենթակառուցվածք որոնման, հաշվետվության և հաղորդակցության համար:",
          "Ծառայությունները ներառում են՝ (1) նախագծերի հնարավորությունների որոնելի կատալոգ՝ մանրամասն տեղեկություններով. (2) անվտանգ նամակագրություն Ստեղծագործողների և Բրենդների միջև. (3) հաշվետվության գործիքներ, որոնք ցույց են տալիս տեսարանին վերաբերող տեղադրման տեղեկատվություն. (4) վճարումների մշակում և էսքրոու ծառայություններ. (5) վեճերի կարգավորման աջակցություն: iGovazd-ը տրամադրվում է «ինչպես կա» սկզբունքով՝ առանց որևէ երաշխիքի նկարահանման արդյունքների, տեղադրման հաջողության կամ երրորդ կողմերի գործունեության վերաբերյալ:",
        ],
      },
      {
        heading: "Օգտատերերի հաշիվներ և պատասխանատվություններ",
        body: [
          "iGovazd-ից օգտվելու համար Դուք պետք է ստեղծեք հաշիվ և տրամադրեք ճշգրիտ, ամբողջական տեղեկություններ: Դուք պատասխանատու եք Ձեր մուտքի տվյալների գաղտնիությունը պահպանելու և Ձեր հաշվի ներքո կատարվող ցանկացած գործողության համար: Դուք համաձայնում եք անհապաղ տեղեկացնել մեզ չարտոնված մուտքի մասին: Դուք պատասխանատու եք Ձեր հաշվի չարտոնված օգտագործումից բխող ցանկացած կորստի համար:",
          "Դուք հավաստիացնում և երաշխավորում եք, որ՝ (1) Ձեզ իրավունք ունեք կնքել այս Պայմանները. (2) օրենքով արգելված չեք հարթակն օգտագործել. (3) Ձեր տրամադրած տեղեկությունը ճշմարիտ և ճշգրիտ է. (4) Դուք սեփականատեր եք կամ լիազորված եք օգտագործել վերբեռնված ցանկացած բովանդակություն: Դուք պետք է պահպանեք բոլոր կիրառելի օրենքներն ու կանոնակարգերը: iGovazd-ը իրավունք է վերապահում կասեցնել կամ դադարեցնել այն հաշիվները, որոնք խախտում են այս Պայմանները կամ չարաշահում հարթակը:",
        ],
      },
      {
        heading: "Տեղադրման հայտեր և համաձայնագրեր",
        body: [
          "Բրենդները կարող են ներկայացնել տեղադրման հայտեր կոնկրետ նախագծերի հնարավորությունների համար: Ստեղծագործողները վերանայում են հայտերը և հայտնում ընդունելու կամ մերժելու մասին: Տեղադրման համաձայնագիրը կնքվում է միայն այն դեպքում, երբ երկու կողմերն էլ գրավոր հստակ համաձայնում են պայմանների վերաբերյալ, ներառյալ ծավալը, փոխհատուցումը, օգտագործման իրավունքները և առաքման ժամկետները: iGovazd-ը հեշտացնում է այս հաղորդակցությունը, սակայն տեղադրման համաձայնագրերի կողմ չէ:",
          "Բոլոր տեղադրման համաձայնագրերը պետք է համապատասխանեն կիրառելի օրենքին և ոլորտի ստանդարտներին: iGovazd-ը երաշխիք չի տալիս, որ հայտերն ընդունվելու են, նկարահանումները տեղի կունենան, կամ տեղադրված ապրանքները կհայտնվեն վերջնական խմբագրված բովանդակության մեջ: Փոխհատուցման վեճերն ու կատարողականի հարցերը ներգրավված կողմերի պատասխանատվությունն են: iGovazd-ն առաջարկում է վեճերի կարգավորման ծառայություններ, սակայն չի կարող ապահովել կոնկրետ արդյունքներ:",
        ],
      },
      {
        heading: "Բովանդակության սեփականություն և իրավունքներ",
        body: [
          "Ստեղծագործողները պահպանում են իրենց նկարահանման բովանդակության բոլոր իրավունքները: Նախագիծը iGovazd-ում տեղադրելով՝ Ստեղծագործողները մեզ տրամադրում են սահմանափակ լիցենզիա՝ ցուցադրելու նախագծի տեղեկատվությունը, պաստառները և մետատվյալները շուկայում: Բրենդները չեն կարող օգտագործել նկարահանման բովանդակությունը համաձայնեցված տեղադրման ծավալից դուրս՝ առանց հստակ թույլտվության:",
          "Բրենդները պահպանում են սեփականությունը ապրանքի պատկերների, լոգոների և մարքեթինգային նյութերի վրա, որոնք վերբեռնում են: iGovazd-ում վերբեռնելով՝ Բրենդները մեզ տրամադրում են սահմանափակ լիցենզիա՝ նյութերը ցուցադրելու շուկայում և հաշվետվություններում: Ոչ մի կողմ չի կարող վերարտադրել, փոփոխել կամ տարածել մյուս կողմի բովանդակությունը՝ իրենց տեղադրման համաձայնագրում հստակորեն թույլատրված ծավալից դուրս:",
        ],
      },
      {
        heading: "Պատասխանատվության սահմանափակում",
        body: [
          "iGovazd-ը տրամադրվում է «ինչպես կա» և «ինչպես հասանելի է» սկզբունքով՝ առանց առևտրայնության, կոնկրետ նպատակին համապատասխանության կամ իրավունքների չխախտման երաշխիքների: Մենք չենք երաշխավորում անընդհատ ծառայություն, անսխալ աշխատանք կամ տվյալների ճշգրտություն: Մենք պատասխանատվություն չենք կրում երրորդ կողմերի վարքագծի, նկարահանման որոշումների, բովանդակության փոփոխությունների կամ տեղադրման արդյունքների համար:",
          "Օրենքով թույլատրված առավելագույն չափով, iGovazd-ը և նրա պաշտոնյաները, տնօրենները, աշխատակիցները և ծառայություններ մատուցողները պատասխանատվություն չեն կրում որևէ անուղղակի, պատահական, հետևանքային կամ պատժիչ վնասների համար, ներառյալ եկամտի կորուստը, տվյալների կորուստը կամ բիզնեսի ընդհատումը, որոնք առաջանում են հարթակն օգտագործելուց կամ չկարողանալուց օգտագործել, նույնիսկ եթե մենք տեղեկացված ենք եղել նման վնասների հնարավորության մասին: Մեր ընդհանուր պատասխանատվությունը սահմանափակվում է նախորդ 12 ամիսների ընթացքում Ձեր վճարած գումարով: Որոշ իրավազորություններ չեն թույլատրում պատասխանատվության սահմանափակումներ. այդ դեպքերում մեր պատասխանատվությունը սահմանափակվում է օրենքով թույլատրված առավելագույն չափով:",
        ],
      },
      {
        heading: "Փոփոխություններ և դադարեցում",
        body: [
          "iGovazd-ը իրավունք է վերապահում ցանկացած պահի փոփոխել այս Պայմանները: Էական փոփոխությունների մասին կտեղեկացնենք էլ. փոստով կամ հարթակի վրա տեսանելի ծանուցումով: Հարթակի շարունակական օգտագործումը նշանակում է փոփոխված Պայմանների ընդունում: Եթե համաձայն չեք փոփոխություններին, պետք է դադարեցնեք iGovazd-ի օգտագործումը և ջնջեք Ձեր հաշիվը:",
          "Մենք կարող ենք կասեցնել կամ դադարեցնել Ձեր հաշիվը և հարթակին հասանելիությունը ցանկացած պահի, հիմքով կամ առանց հիմքի, ծանուցումով կամ առանց դրա: Դադարեցումից հետո Ձեր հարթակն օգտագործելու իրավունքն անմիջապես դադարում է: Մենք պահպանում ենք գործողություններ ձեռնարկելու իրավունքը չարտոնված օգտագործման դեմ: Դրույթները, որոնք պետք է շարունակեն գործել դադարեցումից հետո (պատասխանատվության սահմանափակումներ, փոխհատուցում, վճարային պարտավորություններ), մնում են ուժի մեջ:",
        ],
      },
    ],
  },
  ru: {
    updated: "Июль 2026",
    intro:
      "Настоящие Условия использования регулируют Ваш доступ к платформе iGovazd, нашему сайту, мобильным приложениям и услугам, а также их использование. Получая доступ к iGovazd или используя платформу, Вы соглашаетесь соблюдать данные Условия. Если Вы не согласны, пожалуйста, не используйте платформу. Просим внимательно ознакомиться.",
    sections: [
      {
        heading: "Описание услуг",
        body: [
          "iGovazd — это цифровая торговая площадка, которая соединяет режиссёров и продюсеров с брендами, ищущими возможности продакт-плейсмента в кино- и телепроизводстве. Платформа облегчает общение, переговоры и управление сделками между создателями контента (Продюсерами) и представителями брендов (Брендами). iGovazd самостоятельно не производит контент, не управляет съёмками и напрямую не размещает продукты. Мы предоставляем инфраструктуру для поиска, отчётности и коммуникации.",
          "Услуги включают: (1) доступный для поиска каталог производственных возможностей с подробной информацией о проектах; (2) защищённую переписку между Продюсерами и Брендами; (3) инструменты отчётности, показывающие информацию о размещении по сценам; (4) обработку платежей и услуги эскроу; (5) поддержку в разрешении споров. iGovazd предоставляется «как есть» без каких-либо гарантий относительно результатов производства, успешности размещения или действий третьих сторон.",
        ],
      },
      {
        heading: "Учётные записи пользователей и обязанности",
        body: [
          "Для использования iGovazd Вы должны создать учётную запись и предоставить точную и полную информацию. Вы несёте ответственность за сохранение конфиденциальности данных для входа и за все действия, совершённые под Вашей учётной записью. Вы обязуетесь незамедлительно уведомлять нас о несанкционированном доступе. Вы несёте ответственность за любые убытки, возникшие в результате несанкционированного использования Вашей учётной записи.",
          "Вы заявляете и гарантируете, что: (1) имеете право заключить настоящие Условия; (2) закон не запрещает Вам использовать платформу; (3) предоставленная Вами информация является правдивой и точной; (4) Вы владеете или имеете разрешение на использование любого загружаемого контента. Вы обязаны соблюдать все применимые законы и нормативные акты. iGovazd оставляет за собой право приостанавливать или удалять учётные записи, нарушающие настоящие Условия или злоупотребляющие платформой.",
        ],
      },
      {
        heading: "Заявки на размещение и соглашения",
        body: [
          "Бренды могут подавать заявки на размещение для конкретных производственных возможностей. Продюсеры рассматривают заявки и сообщают о принятии или отклонении. Соглашение о размещении заключается только тогда, когда обе стороны прямо и письменно согласовали условия, включая объём, вознаграждение, права на использование и сроки исполнения. iGovazd содействует этой коммуникации, но не является стороной соглашений о размещении.",
          "Все соглашения о размещении должны соответствовать применимому законодательству и отраслевым стандартам. iGovazd не гарантирует, что заявки будут приняты, что съёмки будут продолжены или что размещённые продукты появятся в итоговом смонтированном контенте. Споры по вознаграждению и вопросы исполнения являются ответственностью вовлечённых сторон. iGovazd предлагает услуги по разрешению споров, но не может гарантировать конкретные результаты.",
        ],
      },
      {
        heading: "Право собственности на контент и права",
        body: [
          "Продюсеры сохраняют все права на контент своих постановок. Размещая проект на iGovazd, Продюсеры предоставляют нам ограниченную лицензию на отображение информации о проекте, постеров и метаданных на площадке. Бренды не вправе использовать производственный контент за пределами согласованного объёма размещения без явного разрешения.",
          "Бренды сохраняют право собственности на изображения продуктов, логотипы и маркетинговые материалы, которые они загружают. Загружая материалы на iGovazd, Бренды предоставляют нам ограниченную лицензию на отображение материалов на площадке и в отчётах. Ни одна из сторон не вправе воспроизводить, изменять или распространять контент другой стороны за пределами объёма, прямо разрешённого в их соглашении о размещении.",
        ],
      },
      {
        heading: "Ограничение ответственности",
        body: [
          "iGovazd предоставляется «как есть» и «по мере доступности» без каких-либо гарантий товарной пригодности, соответствия конкретной цели или отсутствия нарушений прав. Мы не гарантируем бесперебойную работу сервиса, безошибочное функционирование или точность данных. Мы не несём ответственности за поведение третьих сторон, производственные решения, изменения контента или результаты размещения.",
          "В максимальной степени, разрешённой законом, iGovazd и её должностные лица, директора, сотрудники и поставщики услуг не несут ответственности за какие-либо косвенные, случайные, штрафные или последующие убытки, включая упущенную выгоду, потерю данных или прерывание деятельности, возникшие в результате использования или невозможности использования платформы, даже если мы были предупреждены о возможности таких убытков. Наша общая ответственность ограничена суммой сборов, уплаченных Вами за предшествующие 12 месяцев. В некоторых юрисдикциях ограничения ответственности не допускаются; в таких случаях наша ответственность ограничивается в максимальной степени, разрешённой законом.",
        ],
      },
      {
        heading: "Изменения и прекращение действия",
        body: [
          "iGovazd оставляет за собой право в любое время изменять настоящие Условия. Мы уведомим о существенных изменениях по электронной почте или заметным уведомлением на платформе. Продолжение использования платформы означает принятие изменённых Условий. Если Вы не согласны с изменениями, Вы обязаны прекратить использование iGovazd и удалить свою учётную запись.",
          "Мы можем приостановить или прекратить действие Вашей учётной записи и доступ к платформе в любое время, с указанием причины или без неё, с уведомлением или без него. После прекращения действия Ваше право использовать платформу немедленно прекращается. Мы сохраняем право предпринимать действия против несанкционированного использования. Положения, которые должны сохранять силу после прекращения действия (ограничения ответственности, возмещение убытков, платёжные обязательства), остаются в силе.",
        ],
      },
    ],
  },
  en: {
    updated: "July 2026",
    intro:
      "These Terms of Service govern your access to and use of iGovazd, our website, mobile applications, and services. By accessing or using iGovazd, you agree to be bound by these Terms. If you do not agree, you may not use the platform. Please read carefully.",
    sections: [
      {
        heading: "Service Description",
        body: [
          "iGovazd is a digital marketplace that connects filmmakers and producers with brands seeking product placement opportunities in film and television productions. The platform facilitates communication, negotiations, and transaction management between content creators (Filmmakers) and brand representatives (Brands). iGovazd does not itself produce content, manage productions, or directly place products. We provide infrastructure for discovery, reporting, and communication.",
          "Services include: (1) a searchable catalog of production opportunities with detailed project information; (2) secure messaging between Filmmakers and Brands; (3) reporting tools showing scene-specific placement information; (4) payment processing and escrow services; (5) dispute resolution support. iGovazd is provided 'as-is' without warranties of any kind regarding production outcomes, placement success, or third-party performance.",
        ],
      },
      {
        heading: "User Accounts and Responsibilities",
        body: [
          "To use iGovazd, you must create an account and provide accurate, complete information. You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account. You agree to notify us immediately of unauthorized access. You are liable for any losses resulting from unauthorized use of your account.",
          "You represent and warrant that: (1) you have the right to enter into these Terms; (2) you are not prohibited by law from using the platform; (3) information you provide is truthful and accurate; (4) you own or have authorization to use any content you upload. You must comply with all applicable laws and regulations. iGovazd reserves the right to suspend or terminate accounts that violate these Terms or misuse the platform.",
        ],
      },
      {
        heading: "Placement Applications and Agreements",
        body: [
          "Brands may submit placement applications for specific production opportunities. Filmmakers review applications and communicate acceptance or rejection. A placement agreement is formed only when both parties explicitly agree in writing to terms including scope, compensation, usage rights, and delivery timeline. iGovazd facilitates this communication but is not a party to placement agreements.",
          "All placement agreements must comply with applicable law and industry standards. iGovazd does not guarantee that applications will be accepted, that productions will proceed, or that placed products will appear in final edited content. Compensation disputes and performance issues are the responsibility of the parties involved. iGovazd offers dispute resolution services but cannot compel specific outcomes.",
        ],
      },
      {
        heading: "Content Ownership and Rights",
        body: [
          "Filmmakers retain all rights to their production content. By listing a project on iGovazd, Filmmakers grant us a limited license to display production information, posters, and metadata in the marketplace. Brands may not use production content for purposes beyond the agreed placement scope without explicit permission.",
          "Brands retain ownership of product images, logos, and marketing materials they upload. By uploading to iGovazd, Brands grant us a limited license to display materials in the marketplace and reports. Neither party may reproduce, modify, or distribute the other's content beyond the scope explicitly authorized in their placement agreement.",
        ],
      },
      {
        heading: "Limitation of Liability",
        body: [
          "iGovazd is provided 'as-is' and 'as-available' without warranties of merchantability, fitness for a particular purpose, or non-infringement. We do not guarantee uninterrupted service, error-free operation, or data accuracy. We assume no responsibility for third-party conduct, production decisions, content changes, or placement outcomes.",
          "To the maximum extent permitted by law, iGovazd and its officers, directors, employees, and service providers are not liable for any indirect, incidental, consequential, or punitive damages, including lost revenue, lost data, or business interruption, arising from your use of or inability to use the platform, even if we have been advised of the possibility of such damages. Our total liability is limited to the amount of fees paid by you in the preceding 12 months. Some jurisdictions do not allow liability limitations; in such cases, our liability is limited to the maximum extent permitted by law.",
        ],
      },
      {
        heading: "Modifications and Termination",
        body: [
          "iGovazd reserves the right to modify these Terms at any time. We will provide notice of material changes via email or prominent notice on the platform. Your continued use of the platform constitutes acceptance of modified Terms. If you do not agree to changes, you must cease using iGovazd and delete your account.",
          "We may suspend or terminate your account and access to the platform at any time, with or without cause, with or without notice. Upon termination, your right to use the platform ceases immediately. We retain the right to take action against unauthorized use. Provisions that should survive termination (liability limitations, indemnification, payment obligations) remain in effect.",
        ],
      },
    ],
  },
};

export default async function TermsPage() {
  const locale = await getLocale();
  const currency = await getCurrency();
  const t = makeUI(locale);
  const c = content[locale];
  return (
    <>
      <Header locale={locale} currency={currency} />
      <LegalPage
        title={t("legal.termsTitle")}
        updated={c.updated}
        intro={c.intro}
        sections={c.sections}
        locale={locale}
      />
      <Footer locale={locale} currency={currency} />
    </>
  );
}
