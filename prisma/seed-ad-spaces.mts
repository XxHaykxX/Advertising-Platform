/* Demo inventory for the AD_SPACE channels that would otherwise show an empty
   state locally (VIDEO / RADIO / TV / BANNER / TRANSIT — 2026-08-14). One
   approved listing per channel with a couple of offers, so every /ads/<slug>
   page has something to render and the per-channel facets have data to build
   from.

   Idempotent: upsert by `code`, offers replaced. Unlike prisma/seed.ts this
   deletes nothing else — run it against a local DB any time:
     npx tsx prisma/seed-ad-spaces.mts
   Only fills channels that are still empty; pass --force to refresh anyway. */

import { PrismaClient } from "@prisma/client";
import { normalizeAttrs } from "../src/lib/ad-channel-attrs";

const prisma = new PrismaClient();
const force = process.argv.includes("--force");

type SeedOffer = {
  hy: string;
  ru: string;
  en: string;
  priceAmd: number | null;
  periodHy: string;
  periodRu: string;
  periodEn: string;
  totalSlots?: number;
  availableSlots?: number;
};

type SeedSpace = {
  code: string;
  channel: string;
  titleHy: string;
  titleRu: string;
  titleEn: string;
  descHy: string[];
  descRu: string[];
  descEn: string[];
  city: string;
  address: string;
  sizeFormat: string;
  reachPerDay?: number;
  sides?: number;
  attrs: Record<string, unknown>;
  offers: SeedOffer[];
};

const SPACES: SeedSpace[] = [
  {
    code: "#AS-2026-0101",
    channel: "VIDEO",
    titleHy: "«Երևան Live» YouTube ալիք",
    titleRu: "YouTube-канал «Երևան Live»",
    titleEn: "«Yerevan Live» YouTube channel",
    descHy: [
      "Շաբաթական երկու թողարկում քաղաքի մասին",
      "Լսարանի 70%-ը՝ 18–34 տարեկան",
      "Ինտեգրացիան համաձայնեցվում է նկարահանումից առաջ",
    ],
    descRu: [
      "Два выпуска в неделю о городе",
      "70% аудитории — 18–34 года",
      "Интеграция согласуется до съёмки",
    ],
    descEn: [
      "Two episodes a week about the city",
      "70% of the audience is 18–34",
      "Integration is agreed before the shoot",
    ],
    city: "Yerevan",
    address: "",
    sizeFormat: "30–60 сек",
    reachPerDay: 12000,
    attrs: {
      videoPlatform: "YOUTUBE",
      contentTopic: "LIFESTYLE",
      subscribers: 145000,
      integrationFormat: "INTEGRATION",
      spotLength: ["S30", "S60"],
      language: ["HY", "RU"],
    },
    offers: [
      {
        hy: "Ինտեգրացիա թողարկման մեջ",
        ru: "Интеграция в выпуск",
        en: "In-episode integration",
        priceAmd: 450000,
        periodHy: "թողարկում",
        periodRu: "выпуск",
        periodEn: "episode",
        totalSlots: 4,
        availableSlots: 2,
      },
      {
        hy: "Pre-roll 30 վրկ",
        ru: "Pre-roll 30 сек",
        en: "Pre-roll 30s",
        priceAmd: 180000,
        periodHy: "ամիս",
        periodRu: "месяц",
        periodEn: "month",
      },
    ],
  },
  {
    code: "#AS-2026-0102",
    channel: "RADIO",
    titleHy: "«Ռադիո Արև» — առավոտյան բլոկ",
    titleRu: "«Радио Арев» — утренний блок",
    titleEn: "«Radio Arev» — morning block",
    descHy: [
      "Ամենօրյա առավոտյան շոու 07:00–10:00",
      "Հեռարձակում՝ Երևան և Կոտայք",
      "Հնարավոր է հաղորդավարի ուղիղ ընթերցում",
    ],
    descRu: [
      "Ежедневное утреннее шоу 07:00–10:00",
      "Вещание: Ереван и Котайк",
      "Возможно живое чтение ведущим",
    ],
    descEn: [
      "Daily morning show 07:00–10:00",
      "Broadcast: Yerevan and Kotayk",
      "Live host read available",
    ],
    city: "Yerevan",
    address: "",
    sizeFormat: "15 / 30 сек",
    reachPerDay: 85000,
    attrs: {
      stationFormat: "POP",
      daypart: ["MORNING", "DRIVE_TIME"],
      spotLength: ["S15", "S30"],
      spotKind: "SPOT",
      language: ["HY", "RU"],
      weekPart: ["WEEKDAYS"],
    },
    offers: [
      {
        hy: "Փաթեթ՝ 20 ելույթ",
        ru: "Пакет 20 выходов",
        en: "Package of 20 spots",
        priceAmd: 320000,
        periodHy: "շաբաթ",
        periodRu: "неделя",
        periodEn: "week",
      },
      {
        hy: "Հաղորդավարի ուղիղ ընթերցում",
        ru: "Живое чтение ведущим",
        en: "Live host read",
        priceAmd: 65000,
        periodHy: "ելույթ",
        periodRu: "выход",
        periodEn: "spot",
        totalSlots: 10,
        availableSlots: 6,
      },
    ],
  },
  {
    code: "#AS-2026-0103",
    channel: "TV",
    titleHy: "Երեկոյան լրատվական՝ հանրապետական ալիք",
    titleRu: "Вечерние новости, республиканский канал",
    titleEn: "Evening news, national channel",
    descHy: [
      "Prime time 20:00–21:00, ամեն օր",
      "Ծածկույթ՝ ամբողջ հանրապետություն",
      "Հոլովակը տրամադրվում է 3 օր առաջ",
    ],
    descRu: [
      "Прайм-тайм 20:00–21:00, ежедневно",
      "Покрытие — вся республика",
      "Ролик сдаётся за 3 дня до эфира",
    ],
    descEn: ["Prime time 20:00–21:00, daily", "National coverage", "Creative due 3 days before air"],
    city: "Yerevan",
    address: "",
    sizeFormat: "20 / 30 сек",
    reachPerDay: 310000,
    attrs: {
      contentGenre: ["NEWS"],
      daypart: ["PRIME"],
      spotLength: ["S20", "S30"],
      spotKind: "SPOT",
      language: ["HY"],
      coverage: "NATIONAL",
    },
    offers: [
      {
        hy: "Prime time՝ 30 վրկ",
        ru: "Прайм-тайм, 30 сек",
        en: "Prime time, 30s",
        priceAmd: 240000,
        periodHy: "ելույթ",
        periodRu: "выход",
        periodEn: "spot",
      },
      {
        hy: "Հաղորդման հովանավորություն",
        ru: "Спонсорство программы",
        en: "Show sponsorship",
        priceAmd: 3800000,
        periodHy: "ամիս",
        periodRu: "месяц",
        periodEn: "month",
        totalSlots: 2,
        availableSlots: 1,
      },
    ],
  },
  {
    code: "#AS-2026-0104",
    channel: "BANNER",
    titleHy: "Նորությունների կայք՝ գլխավոր էջի բաններ",
    titleRu: "Новостной сайт — баннер на главной",
    titleEn: "News site — homepage banner",
    descHy: [
      "Օրական 90 հազար դիտում գլխավոր էջին",
      "Desktop և mobile՝ մեկ փաթեթում",
      "Վիճակագրությունը՝ շաբաթական հաշվետվությամբ",
    ],
    descRu: [
      "90 тысяч просмотров главной в день",
      "Desktop и mobile в одном пакете",
      "Статистика — еженедельный отчёт",
    ],
    descEn: ["90k homepage views a day", "Desktop and mobile in one package", "Weekly stats report"],
    city: "Yerevan",
    address: "",
    sizeFormat: "970×250",
    reachPerDay: 90000,
    attrs: {
      siteTopic: "NEWS",
      position: "HEADER",
      bannerSize: "S970X250",
      pricingModel: "FLAT_PERIOD",
      device: ["DESKTOP", "MOBILE"],
      inventoryType: "WEBSITE",
    },
    offers: [
      {
        hy: "Գլխավոր էջի բաններ",
        ru: "Баннер на главной",
        en: "Homepage banner",
        priceAmd: 280000,
        periodHy: "ամիս",
        periodRu: "месяц",
        periodEn: "month",
        totalSlots: 3,
        availableSlots: 2,
      },
      {
        hy: "In-feed բլոկ",
        ru: "Блок в ленте",
        en: "In-feed block",
        priceAmd: 140000,
        periodHy: "ամիս",
        periodRu: "месяц",
        periodEn: "month",
      },
    ],
  },
  {
    code: "#AS-2026-0105",
    channel: "TRANSIT",
    titleHy: "Ավտոբուսների ամբողջական բրենդավորում՝ 1-ին երթուղի",
    titleRu: "Полная брендировка автобусов, маршрут №1",
    titleEn: "Full bus wrap, route 1",
    descHy: [
      "Կենտրոնով անցնող երթուղի՝ օրական 14 ժամ գծում",
      "Փաթեթում՝ 5 ավտոբուս",
      "Փակցումը և հանումը՝ սեփականատիրոջ հաշվին",
    ],
    descRu: [
      "Маршрут через центр, 14 часов на линии в день",
      "В пакете 5 автобусов",
      "Оклейка и снятие — за счёт владельца",
    ],
    descEn: ["Route through the centre, 14 hours a day", "5 buses per package", "Wrap and removal included"],
    city: "Yerevan",
    address: "Երթուղի №1",
    sizeFormat: "12×3 м",
    reachPerDay: 60000,
    sides: 2,
    attrs: {
      transportType: "BUS",
      vehicleSide: "EXTERIOR",
      brandingFormat: "FULL_WRAP",
      route: "№1",
      surfaceKind: "STATIC",
    },
    offers: [
      {
        hy: "Ամբողջական բրենդավորում՝ 5 ավտոբուս",
        ru: "Полная брендировка, 5 автобусов",
        en: "Full wrap, 5 buses",
        priceAmd: 1650000,
        periodHy: "ամիս",
        periodRu: "месяц",
        periodEn: "month",
        totalSlots: 5,
        availableSlots: 3,
      },
      {
        hy: "Կողային բաններ",
        ru: "Боковой баннер",
        en: "Side banner",
        priceAmd: 320000,
        periodHy: "ամիս",
        periodRu: "месяц",
        periodEn: "month",
      },
    ],
  },
];

async function main() {
  // Owner: the existing demo CREATOR, falling back to the superadmin so the
  // script also works on a DB seeded only by prisma/seed.ts.
  const owner =
    (await prisma.user.findFirst({ where: { role: "CREATOR" }, orderBy: { id: "asc" } })) ??
    (await prisma.user.findFirstOrThrow({ where: { role: "SUPERADMIN" } }));

  let written = 0;
  for (const [i, s] of SPACES.entries()) {
    const already = await prisma.adSpace.count({ where: { channel: s.channel } });
    if (already > 0 && !force) {
      console.log(`skip ${s.channel}: ${already} listing(s) already there`);
      continue;
    }

    const data = {
      channel: s.channel,
      ownerId: owner.id,
      title: s.titleHy,
      titleHy: s.titleHy,
      titleRu: s.titleRu,
      titleEn: s.titleEn,
      description: JSON.stringify(s.descHy),
      descriptionHy: JSON.stringify(s.descHy),
      descriptionRu: JSON.stringify(s.descRu),
      descriptionEn: JSON.stringify(s.descEn),
      city: s.city,
      address: s.address,
      sizeFormat: s.sizeFormat,
      reachPerDay: s.reachPerDay ?? null,
      sides: s.sides ?? null,
      // Same gate the form uses — a typo in a token here is dropped, not stored.
      attrs: normalizeAttrs(s.channel, s.attrs),
      moderationStatus: "APPROVED" as const,
      isActive: true,
      sortOrder: i,
    };

    const space = await prisma.adSpace.upsert({
      where: { code: s.code },
      update: data,
      create: { code: s.code, ...data },
    });

    await prisma.adSpaceOffer.deleteMany({ where: { adSpaceId: space.id } });
    await prisma.adSpaceOffer.createMany({
      data: s.offers.map((o, idx) => ({
        adSpaceId: space.id,
        name: o.hy,
        nameHy: o.hy,
        nameRu: o.ru,
        nameEn: o.en,
        priceAmd: o.priceAmd,
        totalSlots: o.totalSlots ?? null,
        availableSlots: o.availableSlots ?? null,
        periodHy: o.periodHy,
        periodRu: o.periodRu,
        periodEn: o.periodEn,
        sortOrder: idx,
      })),
    });
    written++;
    console.log(`${s.channel}: ${s.code} + ${s.offers.length} offers`);
  }
  console.log(`done — ${written} channel(s) filled`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
