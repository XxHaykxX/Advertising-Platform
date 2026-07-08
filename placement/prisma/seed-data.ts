export const GARM_CATEGORIES = [
  "Adult Content",
  "Arms & Ammunition",
  "Crime",
  "Drugs",
  "Hate Speech",
  "Military Conflict",
  "Profanity",
  "Sensitive Issues",
  "Spam",
  "Terrorism",
  "Tobacco",
] as const;

type SeedProject = {
  code: string;
  title: string;
  genre: string;
  synopsis: string;
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
  cpmRange: string;
  budgetRange: string;
  safetyScore: number;
  safety: "SAFE" | "REVIEW" | "RISK";
  catScores: number[]; // 11 scores aligned to GARM_CATEGORIES
  opps: {
    sceneNo: number;
    description: string;
    mood: string;
    rationale: string;
    type: string;
    prominence: string;
    category: string;
    estValue: number;
    durationSec: number;
    safety: number;
  }[];
  slotsTotal: number;
  slotsTaken: number;
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
    genre: "Comedy Film",
    synopsis:
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
    cpmRange: "$1.20-$2.10",
    budgetRange: "$150,000 — $300,000",
    safetyScore: 92,
    safety: "SAFE",
    catScores: [95, 96, 90, 94, 97, 95, 92, 88, 98, 96, 94],
    opps: [
      {
        sceneNo: 1,
        description: "The family scrambles through the airport terminal chasing a runaway suitcase, kids in tow.",
        mood: "chaotic, comic energy",
        rationale: "Travel/luggage brand visibility in a high-energy chase gag.",
        type: "visual",
        prominence: "active",
        category: "Travel & Luggage",
        estValue: 60,
        durationSec: 40,
        safety: 100,
      },
      {
        sceneNo: 3,
        description: "Dad fumbles with his phone trying to book last-minute tickets at the gate.",
        mood: "frantic humor",
        rationale: "Telecom/app placement during a relatable travel-stress beat.",
        type: "visual",
        prominence: "background",
        category: "Technology",
        estValue: 55,
        durationSec: 35,
        safety: 100,
      },
      {
        sceneNo: 5,
        description: "The whole family squeezes into the kitchen for a celebratory homecoming breakfast.",
        mood: "warm, chaotic joy",
        rationale: "Food & beverage brand featured in the film's signature reunion scene.",
        type: "visual",
        prominence: "background",
        category: "Food & Beverages",
        estValue: 48,
        durationSec: 45,
        safety: 100,
      },
      {
        sceneNo: 7,
        description: "Grandma's new espresso machine becomes the center of a slapstick mishap in the finale.",
        mood: "comic mishap, joyful",
        rationale: "Home appliance brand showcased in the film's biggest laugh.",
        type: "visual",
        prominence: "active",
        category: "Home & Living",
        estValue: 62,
        durationSec: 50,
        safety: 98,
      },
    ],
    slotsTotal: 5,
    slotsTaken: 2,
    applicationDeadline: "2026-08-10",
    releaseDate: "2026-10-25",
    platforms: ["Kinodaran"],
    placementType: "In-Frame",
    priceNote: "Price on request",
    actors: [
      { name: "Aram Petrosyan", role: "Lead — Family Patriarch" },
      { name: "Lilit Hakobyan", role: "Matriarch" },
      { name: "Narek Sargsyan", role: "Mischievous Son" },
    ],
  },
  {
    code: "#PP-2026-5657",
    title: "Святой 3",
    genre: "Drama Series",
    synopsis:
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
    cpmRange: "$1.40-$2.60",
    budgetRange: "$180,000 — $350,000",
    safetyScore: 64,
    safety: "REVIEW",
    catScores: [70, 55, 38, 60, 68, 52, 58, 45, 88, 55, 72],
    opps: [
      {
        sceneNo: 4,
        description: "The detective reviews evidence files on a rugged laptop in a dimly lit precinct office.",
        mood: "tense focus",
        rationale: "Tech brand placement in a gritty investigative moment.",
        type: "visual",
        prominence: "background",
        category: "Technology",
        estValue: 70,
        durationSec: 45,
        safety: 82,
      },
      {
        sceneNo: 6,
        description: "A tense stakeout in an unmarked sedan outside a suspect's apartment block.",
        mood: "gritty suspense",
        rationale: "Automotive brand visible in a signature procedural sequence.",
        type: "visual",
        prominence: "active",
        category: "Automotive",
        estValue: 95,
        durationSec: 55,
        safety: 72,
      },
      {
        sceneNo: 9,
        description: "He grabs a quick energy drink before a late-night interrogation.",
        mood: "adrenaline",
        rationale: "Beverage placement tied to procedural urgency.",
        type: "visual",
        prominence: "background",
        category: "Beverages",
        estValue: 50,
        durationSec: 30,
        safety: 85,
      },
      {
        sceneNo: 12,
        description: "Running shoes pound the pavement as the detective chases a suspect through a night market.",
        mood: "kinetic tension",
        rationale: "Athletic footwear brand visibility during the season's signature chase sequence.",
        type: "visual",
        prominence: "active",
        category: "Footwear",
        estValue: 88,
        durationSec: 40,
        safety: 90,
      },
    ],
    slotsTotal: 6,
    slotsTaken: 3,
    applicationDeadline: "2026-08-20",
    releaseDate: "2026-11-05",
    platforms: ["Kinodaran", "TV"],
    placementType: "In-Frame",
    priceNote: "Price on request",
    actors: [
      { name: "Vahan Grigoryan", role: "Lead — Detective" },
      { name: "Karen Avetisyan", role: "Rival Crime Boss" },
      { name: "Anahit Manukyan", role: "Prosecutor / Love Interest" },
    ],
  },
  {
    code: "#PP-2026-2384",
    title: "Валдакар",
    genre: "Family Series",
    synopsis:
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
    cpmRange: "$0.90-$1.60",
    budgetRange: "$90,000 — $180,000",
    safetyScore: 99,
    safety: "SAFE",
    catScores: [99, 99, 99, 99, 99, 99, 98, 99, 99, 99, 99],
    opps: [
      {
        sceneNo: 1,
        description: "The young hero packs a colorful backpack before setting off on a new forest quest.",
        mood: "playful wonder",
        rationale: "Kids' apparel/accessory brand visibility in the show's recurring quest ritual.",
        type: "visual",
        prominence: "active",
        category: "Kids Apparel",
        estValue: 40,
        durationSec: 25,
        safety: 100,
      },
      {
        sceneNo: 2,
        description: "A friendly forest spirit shares a snack with the hero at a woodland picnic.",
        mood: "warm, whimsical",
        rationale: "Kids' snack brand featured in a gentle friendship moment.",
        type: "visual",
        prominence: "background",
        category: "Food & Beverages",
        estValue: 35,
        durationSec: 20,
        safety: 100,
      },
      {
        sceneNo: 4,
        description: "The hero splashes through puddles in bright rain boots on the way to a new adventure.",
        mood: "joyful, energetic",
        rationale: "Footwear brand visibility in a signature outdoor sequence.",
        type: "visual",
        prominence: "active",
        category: "Footwear",
        estValue: 38,
        durationSec: 22,
        safety: 100,
      },
    ],
    slotsTotal: 4,
    slotsTaken: 0,
    applicationDeadline: "2026-09-15",
    releaseDate: "2027-01-10",
    platforms: ["Kinodaran"],
    placementType: "Mention",
    priceNote: "Price on request",
    actors: [
      { name: "Ani Vardanyan", role: "Voice of Valdakar" },
      { name: "Davit Ghazaryan", role: "Voice of Forest Guide" },
      { name: "Mari Poghosyan", role: "Voice of Forest Spirit" },
    ],
  },
  {
    code: "#PP-2026-9012",
    title: "Мхитарян. Эксклюзив",
    genre: "Documentary",
    synopsis:
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
    cpmRange: "$1.60-$2.90",
    budgetRange: "$120,000 — $220,000",
    safetyScore: 96,
    safety: "SAFE",
    catScores: [97, 98, 95, 97, 98, 97, 94, 90, 99, 98, 96],
    opps: [
      {
        sceneNo: 2,
        description: "Mkhitaryan laces up his boots in the locker room before a training session.",
        mood: "focused, authentic",
        rationale: "Football boot/apparel brand visibility in a genuine pre-training ritual.",
        type: "visual",
        prominence: "active",
        category: "Sportswear",
        estValue: 140,
        durationSec: 35,
        safety: 100,
      },
      {
        sceneNo: 5,
        description: "A GPS performance tracker vest is fitted before a high-intensity drill.",
        mood: "clinical precision",
        rationale: "Sports tech brand placement reinforcing elite training authenticity.",
        type: "visual",
        prominence: "background",
        category: "Technology",
        estValue: 110,
        durationSec: 30,
        safety: 98,
      },
      {
        sceneNo: 8,
        description: "He rehydrates on the sideline between drills, towel over his shoulders.",
        mood: "candid, human",
        rationale: "Sports beverage brand visibility in a relatable athlete moment.",
        type: "visual",
        prominence: "background",
        category: "Beverages",
        estValue: 75,
        durationSec: 25,
        safety: 100,
      },
      {
        sceneNo: 11,
        description: "Archive footage of his childhood academy is intercut with a modern stadium interview.",
        mood: "reflective, proud",
        rationale: "Brand-neutral archival sequence with high emotional engagement.",
        type: "visual",
        prominence: "background",
        category: "Media",
        estValue: 90,
        durationSec: 40,
        safety: 100,
      },
    ],
    slotsTotal: 5,
    slotsTaken: 3,
    applicationDeadline: "2026-07-28",
    releaseDate: "2026-09-05",
    platforms: ["Kinodaran", "YouTube"],
    placementType: "Story Integration",
    priceNote: "Price on request",
    actors: [
      { name: "Henrikh Mkhitaryan", role: "Himself" },
      { name: "Vardan Petrosyan", role: "Childhood Coach" },
    ],
  },
  {
    code: "#PP-2026-3345",
    title: "Артист КомедЯан",
    genre: "Comedy Series",
    synopsis:
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
    cpmRange: "$1.10-$2.00",
    budgetRange: "$70,000 — $140,000",
    safetyScore: 85,
    safety: "SAFE",
    catScores: [88, 80, 72, 78, 90, 85, 60, 70, 95, 88, 86],
    opps: [
      {
        sceneNo: 2,
        description: "The host sips coffee backstage in the green room before going on.",
        mood: "candid, relaxed",
        rationale: "Beverage brand placement in a recurring backstage character beat.",
        type: "visual",
        prominence: "background",
        category: "Beverages",
        estValue: 45,
        durationSec: 30,
        safety: 100,
      },
      {
        sceneNo: 4,
        description: "A sketch parodies a delivery app mix-up gone hilariously wrong.",
        mood: "absurd, playful",
        rationale: "App/tech brand referenced within a comedic sketch premise.",
        type: "visual",
        prominence: "active",
        category: "Technology",
        estValue: 58,
        durationSec: 50,
        safety: 92,
      },
      {
        sceneNo: 6,
        description: "The ensemble grabs snacks between takes during a rapid-fire sketch marathon.",
        mood: "energetic camaraderie",
        rationale: "Snack brand visibility in a behind-the-scenes style segment.",
        type: "visual",
        prominence: "background",
        category: "Food & Beverages",
        estValue: 40,
        durationSec: 25,
        safety: 96,
      },
    ],
    slotsTotal: 5,
    slotsTaken: 4,
    applicationDeadline: "2026-07-20",
    releaseDate: "2026-07-25",
    platforms: ["Kinodaran", "YouTube"],
    placementType: "Mention",
    priceNote: "Price on request",
    actors: [
      { name: "Tigran Hovhannisyan", role: "Host / Stand-up Lead" },
      { name: "Suren Baghdasaryan", role: "Sketch Ensemble" },
      { name: "Nare Sahakyan", role: "Sketch Ensemble" },
    ],
  },
  {
    code: "#PP-2026-7788",
    title: "Закрытая улица",
    genre: "Thriller",
    synopsis:
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
    cpmRange: "$1.00-$1.80",
    budgetRange: "$40,000 — $90,000",
    safetyScore: 58,
    safety: "REVIEW",
    catScores: [65, 48, 30, 55, 60, 42, 50, 38, 85, 50, 60],
    opps: [
      {
        sceneNo: 1,
        description: "A resident barricades his door as tension mounts, phone flashlight cutting through the dark.",
        mood: "claustrophobic dread",
        rationale: "Consumer tech brand visibility in a high-tension survival beat.",
        type: "visual",
        prominence: "background",
        category: "Technology",
        estValue: 62,
        durationSec: 30,
        safety: 78,
      },
      {
        sceneNo: 3,
        description: "An SUV blocks the dead-end street as the standoff begins under flickering streetlights.",
        mood: "gritty suspense",
        rationale: "Automotive brand visible in the film's central confrontation.",
        type: "visual",
        prominence: "active",
        category: "Automotive",
        estValue: 85,
        durationSec: 40,
        safety: 70,
      },
      {
        sceneNo: 5,
        description: "A neighbor nervously checks a home security camera feed on her tablet.",
        mood: "paranoid tension",
        rationale: "Home security brand placement tied directly to the film's premise.",
        type: "visual",
        prominence: "background",
        category: "Technology",
        estValue: 70,
        durationSec: 35,
        safety: 75,
      },
    ],
    slotsTotal: 4,
    slotsTaken: 1,
    applicationDeadline: "2026-09-05",
    releaseDate: "2026-11-20",
    platforms: ["Kinodaran"],
    placementType: "In-Frame",
    priceNote: "Price on request",
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
