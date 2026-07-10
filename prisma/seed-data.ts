type SeedProject = {
  code: string;
  title: string;
  titleHy: string;
  titleRu: string;
  titleEn: string;
  genre: string;
  synopsis: string;
  synopsisHy: string;
  synopsisRu: string;
  synopsisEn: string;
  poster: string;
  gallery: string[];
  format: string;
  studio: string;
  status: "PRE_PRODUCTION" | "FILMING" | "POST_PRODUCTION" | "RELEASED";
  releaseLabel: string;
  countries: string;
  audienceGender: string;
  audienceAge: string;
  projViews: string;
  // Money — AMD only. Budget/CPM are context; price is optional (undefined
  // -> the site shows the "on request" label).
  budgetMinAmd: number;
  budgetMaxAmd: number;
  cpmMinAmd: number;
  cpmMaxAmd: number;
  priceMinAmd?: number;
  priceMaxAmd?: number;
  applicationDeadline: string; // ISO date
  releaseDate: string; // ISO date
  platforms: string[];
  placementType: "In-Frame" | "Story Integration" | "Mention";
  priceNote: string;
  actors: { name: string; role: string }[];
};

export type SeedPortfolio = {
  title: string;
  brand: string;
  description: string;
  image: string | null;
  metrics: Record<string, string>;
};

export type SeedPartner = {
  name: string;
  logo: string | null;
  url: string | null;
};

export const SEED_PROJECTS: SeedProject[] = [
  {
    code: "#PP-2026-8540",
    title: "Фул Хаус։ Посадка",
    titleHy: "Ֆուլ Հաուս․ Վայրէջք",
    titleRu: "Фул Хаус: Посадка",
    titleEn: "Full House: Landing",
    genre: "Comedy Film",
    synopsis:
      "The chaotic family from Armenia's hit comedy touches down for a new misadventure when a routine flight turns into an unplanned family reunion at 30,000 feet. One house, one plane, zero peace and quiet.",
    synopsisHy:
      "Հայկական հիթ կատակերգության քաոսային ընտանիքը նոր արկածի մեջ է ընկնում, երբ սովորական չվերթը վերածվում է չնախատեսված ընտանեկան հանդիպման 10 000 մետր բարձրության վրա։ Մեկ տուն, մեկ ինքնաթիռ, զրո հանգստություն։",
    synopsisRu:
      "Хаотичная семья из хитовой армянской комедии отправляется в новое приключение, когда обычный рейс превращается в незапланированное семейное воссоединение на высоте 10 000 метров. Один дом, один самолёт, ноль покоя.",
    synopsisEn:
      "The chaotic family from Armenia's hit comedy touches down for a new misadventure when a routine flight turns into an unplanned family reunion at 30,000 feet. One house, one plane, zero peace and quiet.",
    poster: "/kino/proj-01-hero.jpg",
    gallery: [
      "/kino/frame-01.jpg",
      "/kino/frame-02.jpg",
      "/kino/frame-03.jpg",
      "/kino/frame-04.jpg",
      "/kino/frame-05.jpg",
    ],
    format: "Feature · 95 min · 12+",
    studio: "Kinodaran Studios",
    status: "POST_PRODUCTION",
    releaseLabel: "Q4 2026",
    countries: "Armenia, Russia, Georgia, Diaspora (US, France)",
    audienceGender: "All",
    audienceAge: "12-45",
    projViews: "420K",
    cpmMinAmd: 460,
    cpmMaxAmd: 810,
    budgetMinAmd: 58_000_000,
    budgetMaxAmd: 116_000_000,
    applicationDeadline: "2026-08-10",
    releaseDate: "2026-10-25",
    platforms: ["Kinodaran"],
    placementType: "In-Frame",
    priceMinAmd: 9_600_000,
    priceMaxAmd: 12_000_000,
    priceNote: "/ scene",
    actors: [
      { name: "Aram Petrosyan", role: "Lead — Family Patriarch" },
      { name: "Lilit Hakobyan", role: "Matriarch" },
      { name: "Narek Sargsyan", role: "Mischievous Son" },
    ],
  },
  {
    code: "#PP-2026-5657",
    title: "Святой 3",
    titleHy: "Սուրբը 3",
    titleRu: "Святой 3",
    titleEn: "The Saint 3",
    genre: "Drama Series",
    synopsis:
      "The third season of Armenia's acclaimed crime drama pulls a weary detective back into the underworld he thought he'd left behind. Old debts and new betrayals blur the line between saint and sinner.",
    synopsisHy:
      "Հայկական ճանաչված կրիմինալ դրամայի երրորդ եթերաշրջանը հոգնած դետեկտիվին վերադարձնում է հանցավոր աշխարհ, որը նա կարծում էր՝ թողել է անցյալում։ Հին պարտքերն ու նոր դավաճանությունները ջնջում են սրբի ու մեղավորի սահմանը։",
    synopsisRu:
      "Третий сезон признанной армянской криминальной драмы возвращает уставшего детектива в преступный мир, который он считал оставленным позади. Старые долги и новые предательства стирают грань между святым и грешником.",
    synopsisEn:
      "The third season of Armenia's acclaimed crime drama pulls a weary detective back into the underworld he thought he'd left behind. Old debts and new betrayals blur the line between saint and sinner.",
    poster: "/kino/proj-02-hero.jpg",
    gallery: [
      "/kino/frame-06.jpg",
      "/kino/frame-07.jpg",
      "/kino/frame-08.jpg",
      "/kino/frame-09.jpg",
      "/kino/frame-10.jpg",
    ],
    format: "Series · 18+",
    studio: "Kinodaran Studios",
    status: "FILMING",
    releaseLabel: "Q1 2027",
    countries: "Armenia, Russia, Georgia",
    audienceGender: "All",
    audienceAge: "25-55",
    projViews: "310K",
    cpmMinAmd: 540,
    cpmMaxAmd: 1_000,
    budgetMinAmd: 69_000_000,
    budgetMaxAmd: 135_000_000,
    applicationDeadline: "2026-08-20",
    releaseDate: "2026-11-05",
    platforms: ["Kinodaran", "TV"],
    placementType: "In-Frame",
    priceMinAmd: 15_400_000,
    priceMaxAmd: 15_400_000,
    priceNote: "/ episode",
    actors: [
      { name: "Vahan Grigoryan", role: "Lead — Detective" },
      { name: "Karen Avetisyan", role: "Rival Crime Boss" },
      { name: "Anahit Manukyan", role: "Prosecutor / Love Interest" },
    ],
  },
  {
    code: "#PP-2026-2384",
    title: "Валдакар",
    titleHy: "Վալդակար",
    titleRu: "Валдакар",
    titleEn: "Valdakar",
    genre: "Family Series",
    synopsis:
      "A gentle animated adventure for the youngest viewers follows a curious young hero through a colorful fantasy world of friendly creatures and small lessons. Every episode is a new quest about kindness and courage.",
    synopsisHy:
      "Բարի անիմացիոն արկած ամենափոքր դիտողների համար՝ հետևելով հետաքրքրասեր փոքրիկ հերոսին գունեղ ֆանտաստիկ աշխարհով, ընկերասեր արարածներով և փոքրիկ դասերով։ Յուրաքանչյուր դրվագ բարության և քաջության մասին նոր արկած է։",
    synopsisRu:
      "Добрая анимационная история для самых маленьких зрителей следует за любопытным юным героем сквозь красочный фэнтезийный мир дружелюбных существ и маленьких уроков. Каждая серия — новое приключение о доброте и смелости.",
    synopsisEn:
      "A gentle animated adventure for the youngest viewers follows a curious young hero through a colorful fantasy world of friendly creatures and small lessons. Every episode is a new quest about kindness and courage.",
    poster: "/kino/proj-03-hero.jpg",
    gallery: [
      "/kino/frame-11.jpg",
      "/kino/frame-12.jpg",
      "/kino/frame-13.jpg",
      "/kino/frame-14.jpg",
      "/kino/frame-15.jpg",
    ],
    format: "Series · 4+",
    studio: "Kinodaran Studios",
    status: "PRE_PRODUCTION",
    releaseLabel: "Q2 2027",
    countries: "Armenia, Georgia, Diaspora (US, France)",
    audienceGender: "All",
    audienceAge: "4-9",
    projViews: "150K",
    cpmMinAmd: 350,
    cpmMaxAmd: 620,
    budgetMinAmd: 35_000_000,
    budgetMaxAmd: 69_000_000,
    applicationDeadline: "2026-09-15",
    releaseDate: "2027-01-10",
    platforms: ["Kinodaran"],
    placementType: "Mention",
    priceNote: "",
    actors: [
      { name: "Ani Vardanyan", role: "Voice of Valdakar" },
      { name: "Davit Ghazaryan", role: "Voice of Forest Guide" },
      { name: "Mari Poghosyan", role: "Voice of Forest Spirit" },
    ],
  },
  {
    code: "#PP-2026-9012",
    title: "Мхитарян. Эксклюзив",
    titleHy: "Մխիթարյան․ Էքսկլյուզիվ",
    titleRu: "Мхитарян. Эксклюзив",
    titleEn: "Mkhitaryan. Exclusive",
    genre: "Documentary",
    synopsis:
      "An intimate documentary portrait of football star Henrikh Mkhitaryan, tracing his journey from Armenian academy fields to Europe's biggest stages. Rare access reveals the discipline and heart behind a national icon.",
    synopsisHy:
      "Ֆուտբոլի աստղ Հենրիխ Մխիթարյանի անձնական վավերագրական դիմանկարը՝ նրա ճանապարհը հայկական ակադեմիայի դաշտերից մինչև Եվրոպայի խոշորագույն ասպարեզները։ Հազվագյուտ մատչելիությունը բացահայտում է ազգային խորհրդանիշի կարգապահությունն ու սիրտը։",
    synopsisRu:
      "Личный документальный портрет футбольной звезды Генриха Мхитаряна, прослеживающий его путь от полей армянской академии до крупнейших арен Европы. Редкий доступ раскрывает дисциплину и сердце национального символа.",
    synopsisEn:
      "An intimate documentary portrait of football star Henrikh Mkhitaryan, tracing his journey from Armenian academy fields to Europe's biggest stages. Rare access reveals the discipline and heart behind a national icon.",
    poster: "/kino/proj-04-hero.jpg",
    gallery: [
      "/kino/frame-16.jpg",
      "/kino/frame-17.jpg",
      "/kino/frame-18.jpg",
      "/kino/frame-19.jpg",
      "/kino/frame-20.jpg",
    ],
    format: "Documentary · 44 min",
    studio: "Kinodaran Studios",
    status: "POST_PRODUCTION",
    releaseLabel: "Q3 2026",
    countries: "Armenia, Russia, Italy, Diaspora (US, France)",
    audienceGender: "All",
    audienceAge: "16-55",
    projViews: "540K",
    cpmMinAmd: 620,
    cpmMaxAmd: 1_120,
    budgetMinAmd: 46_000_000,
    budgetMaxAmd: 85_000_000,
    applicationDeadline: "2026-07-28",
    releaseDate: "2026-09-05",
    platforms: ["Kinodaran", "YouTube"],
    placementType: "Story Integration",
    priceNote: "",
    actors: [
      { name: "Henrikh Mkhitaryan", role: "Himself" },
      { name: "Vardan Petrosyan", role: "Childhood Coach" },
    ],
  },
  {
    code: "#PP-2026-3345",
    title: "Артист КомедЯан",
    titleHy: "Արտիստ ԿոմեդՅան",
    titleRu: "Артист КомедЯан",
    titleEn: "Artist KomedYan",
    genre: "Comedy Series",
    synopsis:
      "A fast-paced stand-up and sketch comedy show built around the sharp, offbeat humor of Armenia's rising comic voices. Each episode mixes live sets with original sketches for a new kind of laugh.",
    synopsisHy:
      "Դինամիկ սթենդափ և սքեթչ շոու՝ կառուցված Հայաստանի ծագող կատակերգակների սուր, ոչ ստանդարտ հումորի շուրջ։ Յուրաքանչյուր թողարկում կենդանի ելույթները խառնում է օրիգինալ սքեթչների հետ՝ նոր ծիծաղի համար։",
    synopsisRu:
      "Динамичное стендап- и скетч-шоу, построенное на остром, нестандартном юморе восходящих комиков Армении. Каждый выпуск сочетает живые выступления с оригинальными скетчами ради нового смеха.",
    synopsisEn:
      "A fast-paced stand-up and sketch comedy show built around the sharp, offbeat humor of Armenia's rising comic voices. Each episode mixes live sets with original sketches for a new kind of laugh.",
    poster: "/kino/proj-05-hero.jpg",
    gallery: [
      "/kino/frame-21.jpg",
      "/kino/frame-22.jpg",
      "/kino/frame-23.jpg",
      "/kino/frame-24.jpg",
      "/kino/frame-25.jpg",
    ],
    format: "Series · 16+",
    studio: "Kinodaran Studios",
    status: "RELEASED",
    releaseLabel: "Streaming now",
    countries: "Armenia, Russia, Georgia",
    audienceGender: "All",
    audienceAge: "16-40",
    projViews: "260K",
    cpmMinAmd: 420,
    cpmMaxAmd: 770,
    budgetMinAmd: 27_000_000,
    budgetMaxAmd: 54_000_000,
    applicationDeadline: "2026-07-20",
    releaseDate: "2026-07-25",
    platforms: ["Kinodaran", "YouTube"],
    placementType: "Mention",
    priceNote: "",
    actors: [
      { name: "Tigran Hovhannisyan", role: "Host / Stand-up Lead" },
      { name: "Suren Baghdasaryan", role: "Sketch Ensemble" },
      { name: "Nare Sahakyan", role: "Sketch Ensemble" },
    ],
  },
  {
    code: "#PP-2026-7788",
    title: "Закрытая улица",
    titleHy: "Փակ փողոց",
    titleRu: "Закрытая улица",
    titleEn: "Dead-End Street",
    genre: "Thriller",
    synopsis:
      "On one dead-end street, a single tense night spirals into a standoff nobody saw coming. A tight, unforgiving thriller about the neighbors you thought you knew.",
    synopsisHy:
      "Մի փակուղի փողոցում մեկ լարված գիշերը վերածվում է դիմակայության, որը ոչ ոք չէր սպասում։ Կոշտ, անողոք թրիլլեր հարևանների մասին, որոնց կարծում էիք՝ ճանաչում եք։",
    synopsisRu:
      "На одной тупиковой улице напряжённая ночь оборачивается противостоянием, которого никто не ожидал. Жёсткий, беспощадный триллер о соседях, которых вы думали, что знаете.",
    synopsisEn:
      "On one dead-end street, a single tense night spirals into a standoff nobody saw coming. A tight, unforgiving thriller about the neighbors you thought you knew.",
    poster: "/kino/proj-06-hero.jpg",
    gallery: [
      "/kino/frame-26.jpg",
      "/kino/frame-27.jpg",
      "/kino/frame-28.jpg",
      "/kino/frame-29.jpg",
      "/kino/frame-30.jpg",
    ],
    format: "Film · 23 min · 18+",
    studio: "Kinodaran Studios",
    status: "FILMING",
    releaseLabel: "Q4 2026",
    countries: "Armenia, Russia",
    audienceGender: "All",
    audienceAge: "18-45",
    projViews: "95K",
    cpmMinAmd: 385,
    cpmMaxAmd: 690,
    budgetMinAmd: 15_000_000,
    budgetMaxAmd: 35_000_000,
    applicationDeadline: "2026-09-05",
    releaseDate: "2026-11-20",
    platforms: ["Kinodaran"],
    placementType: "In-Frame",
    priceNote: "",
    actors: [
      { name: "Gor Martirosyan", role: "Lead — Resident" },
      { name: "Sona Grigoryan", role: "The Stranger" },
      { name: "Armen Poghosyan", role: "Detective" },
    ],
  },
];

export const SEED_PORTFOLIO: SeedPortfolio[] = [
  {
    title: "Sneakers Front and Center in a Crime-Drama Chase",
    brand: "Voltrun Athletics",
    description:
      "A hero sneaker was woven into three foot-chase sequences of the crime drama Святой 3, with the product visible in every close-up of the detective's pursuit through the night market.",
    image: "/kino/frame-01.jpg",
    metrics: { views: "310K", recall: "+34%", ctr: "3.8%" },
  },
  {
    title: "Coffee Brand Becomes a Backstage Character Beat",
    brand: "Ember Roasters",
    description:
      "A recurring green-room coffee moment turned into a running gag across the comedy show Артист КомедЯан, driving a measurable lift in brand recognition among younger viewers.",
    image: "/kino/frame-21.jpg",
    metrics: { views: "260K", recall: "+27%", storeVisits: "+11%" },
  },
  {
    title: "SUV Hero Shot in a Street-Level Standoff",
    brand: "Ridgemont Motors",
    description:
      "A tense confrontation scene in the thriller Закрытая улица placed the client's flagship SUV at the center of the film's most-shared clip, generating outsized organic reach.",
    image: "/kino/frame-26.jpg",
    metrics: { views: "95K", recall: "+31%", shares: "9.2K" },
  },
  {
    title: "Performance Tech in a Football Documentary",
    brand: "Halcyon Devices",
    description:
      "GPS tracker vests and training wearables were built into real training footage for Мхитарян. Эксклюзив, embedding the brand into an authentic elite-athlete routine.",
    image: "/kino/frame-16.jpg",
    metrics: { views: "540K", recall: "+29%", sentiment: "94% positive" },
  },
  {
    title: "Espresso Machine Steals the Family Finale",
    brand: "Marchetti Home",
    description:
      "A single appliance reveal at the comic climax of Фул Хаус: Посадка became the most-replayed moment of the film, boosting brand search volume overnight.",
    image: "/kino/frame-05.jpg",
    metrics: { views: "420K", recall: "+33%", searchLift: "+48%" },
  },
  {
    title: "Kids' Apparel Woven Into a Fantasy Adventure",
    brand: "Sunview Kids",
    description:
      "A backpack and rain-boot line worn by the young hero across every quest in Валдакар became a staple recognized by preschool viewers, driving strong recall among parents.",
    image: "/kino/frame-11.jpg",
    metrics: { views: "150K", recall: "+22%", recallDurability: "+40%" },
  },
];

export const SEED_PARTNERS: SeedPartner[] = [
  { name: "Verita Vertical", logo: null, url: null },
  { name: "Helix Stories", logo: null, url: null },
  { name: "Echo Microdrama", logo: null, url: null },
  { name: "Nova Frame", logo: null, url: null },
  { name: "Amber Lane", logo: null, url: null },
  { name: "Ridgeline", logo: null, url: null },
  { name: "Kinodaran Studios", logo: null, url: null },
  { name: "Prism Vertical Network", logo: null, url: null },
];
