# FP Placement — Phase 1 (Full-Stack) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan. This plan is organized into **WAVES**; tasks within a wave are **parallel-safe** (disjoint files) and can be dispatched to concurrent agents. Between waves, run a review (`architect`) before starting the next. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Stand up the marketplace as a separate, full-stack Next.js app in `placement/` — its own MySQL database, auth + publisher accounts, admin CRUD, and public pages (landing / catalog / report) rendering **real seeded data**.

**Architecture:** Standalone Next 16 app in `placement/` (port 3001), isolated from the existing `src/…` site. Own Prisma schema → separate MySQL database `placement` on the existing local container (port 3307). Backend patterns (auth/session/guards/seed/data-layer/admin-CRUD) are **copied and adapted** from the existing app (see pattern map below). Public UI cloned from filmustageplacement.com, light indigo theme. Placeholder content becomes **seed rows**.

**Tech Stack:** Next 16.2.9 (App Router, RSC, server actions), React 19, Prisma 6 + MySQL 8, jose (JWT), bcryptjs, Tailwind v4, framer-motion, lenis, lucide-react.

**Spec:** `docs/FP-Placement-Spec.md`. **Reference screenshots:** repo root `filmustage.jpeg`, `catalog.jpeg`, `report*.jpeg`.

**MANDATORY for every code agent:** before writing framework-specific code, query **Context7** (`mcp__claude_ai_Context7__resolve-library-id` → `query-docs`) for the exact surface you touch (Next 16 App Router / server actions / middleware, Tailwind v4 `@theme`, Prisma schema+migrate, framer-motion, lenis, jose). AGENTS.md warns the framework differs from training data — do not assume APIs.

## Orchestration: agent · model · skills

Orchestrator (dispatches waves, reviews between them): **Fable 5**. Model per task by complexity/risk:

| Wave / packet | subagent_type | **model** | skills / MCP |
|---|---|---|---|
| W0 Foundation (schema/prisma/seed) | `coder` | **sonnet** | Context7 (Prisma, Next 16) |
| W0 gate review | `architect` | **opus** | — |
| W1-A Auth (security-sensitive) | `coder` | **sonnet** | Context7 (jose, Next middleware/actions) |
| W1-B Tokens + UI primitives | `coder` | **sonnet** | `frontend-design`, `ui-ux-pro-max`, Context7 (Tailwind v4) |
| W1-C Data layer | `coder` | **sonnet** | Context7 (Prisma) |
| W1 gate review (auth/DTO) | `architect` | **opus** | — |
| W2 Public — simple presentational (Stats, Trust, GetStarted, Why, Footer, HowItWorks) | `coder` | **haiku** | `frontend-design` |
| W2 Public — data-bound / complex (Header, Hero, ProjectCard, Featured, Faq, Contact, report sections 2P-13) | `coder` | **sonnet** | `frontend-design`, Context7 (framer-motion) |
| W2 Admin CRUD (server actions, authz) | `coder` | **sonnet** | Context7 (Next server actions) |
| W2 gate review (authz, field coverage) | `architect` | **opus** | — |
| W3 Compose pages + Playwright verify | `coder` | **sonnet** | Context7 (Next), Playwright MCP |

Rule of thumb: **haiku** = mechanical/presentational single-file; **sonnet** = logic, data, auth, server actions, complex UI; **opus** = review gates + any tricky architectural call; **Fable 5** = orchestrator only.

---

## Reusable backend pattern map (from existing `src/`)

Copy-and-adapt these into `placement/src/` (change import roots, drop trilingual project-data fields → single-language):

- **`src/lib/prisma.ts`** — PrismaClient singleton (globalThis guard).
- **`src/lib/auth/session.ts`** — jose JWT. `SESSION_COOKIE="adm_session"`, `createSessionToken(uid,role)`, `verifySessionToken`, `sessionCookieOptions`, `SessionPayload`. Secret `SESSION_SECRET` (≥16). Cookie `{httpOnly, secure(prod), sameSite:lax, path:/, maxAge:7d}`.
- **`src/lib/auth/require.ts`** (`server-only`) — `loadCurrentUser()` re-checks `user.isActive` in DB each request. `requireUser()` → redirect `/admin/login`; `requireSuperadmin()` → `notFound()`; `isAuthed()`.
- **`src/lib/auth/password.ts`** — bcryptjs rounds 10. `verifyUserPassword(email,plain)`→`{ok,user}|{ok:false,reason:"invalid"|"deactivated"}`, `setUserPassword`.
- **`src/middleware.ts`** — edge JWT guard, `matcher:["/admin/:path*"]`.
- **`src/app/admin/actions.ts`** — `login`(per-IP rate limit 5/10min)→set cookie→redirect; `logout`; `changePassword`.
- **`src/app/admin/login/{page,login-form}.tsx`** — `useActionState(login)`, `from` param validated `startsWith("/admin")`.
- **`src/app/admin/(panel)/{layout,admin-nav}.tsx`** — `requireUser()`, sidebar, role-filtered nav, logout form.
- **projects CRUD quartet** — `page.tsx`(list, owner-scoped), `new/`, `[id]/edit/`, `project-form.tsx`(`useActionState`, returns `{error,values}`), `row-actions.tsx`(`useTransition`), `actions.ts`(FormData parse helpers, validate, `prisma.*.create/update` nested, `revalidatePath`, ownership authz, `ownerId=user.id` forced).
- **`src/lib/data/*`** — `projects.ts`, `applications.ts`, `format.ts` (`parseStringArray`, date fmt). Return DTOs.

**Bootstrap creds/env:** `SESSION_SECRET`, `ADMIN_PASSWORD`, `DATABASE_URL=mysql://user:pass@host:3307/placement`.

---

# WAVE 0 — Foundation (SEQUENTIAL, 1 agent: `coder`)

Everything downstream needs the schema, generated Prisma types, and a seeded DB. Do this wave alone, in order, then review before Wave 1.

## Task 0.1 — Configs + deps

**Files (create/modify):** `placement/package.json` (exists — extend deps), `placement/next.config.ts`, `placement/tsconfig.json`, `placement/postcss.config.mjs`, `placement/next-env.d.ts`, `placement/.gitignore`, `placement/.env`, `placement/.env.example`

- [ ] **Step 1:** Context7 — query Next 16 project config + Prisma setup.
- [ ] **Step 2:** Overwrite `placement/package.json` to add backend deps + prisma scripts:

```json
{
  "name": "placement",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001",
    "lint": "eslint",
    "db:push": "prisma db push",
    "db:seed": "tsx prisma/seed.ts",
    "postinstall": "prisma generate"
  },
  "prisma": { "seed": "tsx prisma/seed.ts" },
  "dependencies": {
    "@prisma/client": "^6.19.3",
    "@radix-ui/react-slot": "^1.2.5",
    "bcryptjs": "^3.0.3",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "framer-motion": "^12.40.0",
    "jose": "^6.2.3",
    "lenis": "^1.3.23",
    "lucide-react": "^1.17.0",
    "next": "16.2.9",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "server-only": "^0.0.1",
    "tailwind-merge": "^3.6.0",
    "tw-animate-css": "^1.4.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.2.9",
    "prisma": "^6.19.3",
    "tailwindcss": "^4",
    "tsx": "^4.19.2",
    "typescript": "^5"
  }
}
```

- [ ] **Step 3:** `placement/next.config.ts`:

```ts
import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  output: "standalone",
  images: { remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }] },
};
export default nextConfig;
```

- [ ] **Step 4:** `placement/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 5:** `placement/postcss.config.mjs`:

```js
const config = { plugins: { "@tailwindcss/postcss": {} } };
export default config;
```

- [ ] **Step 6:** `placement/next-env.d.ts`:

```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />
```

- [ ] **Step 7:** `placement/.gitignore`:

```
/.next/
/node_modules/
/out/
*.tsbuildinfo
.env
```

- [ ] **Step 8:** `placement/.env.example` (and copy to `.env`, fill real values from repo-root `.env` for DB host/creds; use DB name `placement`):

```
DATABASE_URL="mysql://USER:PASSWORD@127.0.0.1:3307/placement"
SESSION_SECRET="change-me-min-16-chars-long-secret"
ADMIN_PASSWORD="admin1234"
```

- [ ] **Step 9:** Install placement deps (needed for `prisma`, `tsx`, `@prisma/client` binaries local to this app):

Run: `cd placement && npm install`
Expected: installs without error. (This app gets its own node_modules — Wave 0 needs prisma/tsx binaries.)

- [ ] **Step 10: Commit** `chore(placement): configs + backend deps + env`.

## Task 0.2 — Prisma schema (extended)

**Files:** `placement/prisma/schema.prisma`

- [ ] **Step 1:** Context7 — query Prisma 6 schema syntax (enums, relations, `@db` types, `onDelete`).
- [ ] **Step 2:** Write `placement/prisma/schema.prisma`. Single-language project data (per spec: UI i18n, data one language). New marketplace models.

```prisma
generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "debian-openssl-1.1.x", "debian-openssl-3.0.x"]
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model Setting {
  key   String @id
  value String
}

enum Role {
  SUPERADMIN
  PUBLISHER
}

model User {
  id           Int      @id @default(autoincrement())
  email        String   @unique
  passwordHash String
  role         Role     @default(PUBLISHER)
  name         String
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())

  projects Project[]
}

/// UI translation strings (ru/en/hy) — interface i18n only
model Content {
  key String @id
  ru  String @db.Text
  en  String @db.Text
  hy  String @db.Text
}

enum ProjectStatus {
  PRE_PRODUCTION
  FILMING
  POST_PRODUCTION
  RELEASED
}

enum BrandSafety {
  SAFE
  REVIEW
  RISK
}

/// A film/series project listed for product placement
model Project {
  id             Int           @id @default(autoincrement())
  code           String        @unique // "#PP-2026-8540"
  title          String
  genre          String
  synopsis       String        @db.Text
  poster         String?
  gallery        String        @default("[]") @db.VarChar(2048) // JSON string[]
  format         String        @default("") // "50 ep × 1m 15s"
  studio         String        @default("")
  status         ProjectStatus @default(PRE_PRODUCTION)
  releaseLabel   String        @default("") // "Q1 2027"
  countries      String        @default("") // "US, UK, …"
  audienceGender String        @default("All") // All | Male | Female
  audienceAge    String        @default("") // "16-30"
  projViews      String        @default("") // "2.4M"
  cpmRange       String        @default("") // "$3.60-$5.40"
  budgetRange    String        @default("") // "$6,000,000 — $10,000,000"
  safetyScore    Int           @default(0) // 0-100
  safety         BrandSafety   @default(REVIEW)
  isActive       Boolean       @default(true)
  sortOrder      Int           @default(0)
  createdAt      DateTime      @default(now())
  ownerId        Int

  owner         User                  @relation(fields: [ownerId], references: [id])
  safetyCats    SafetyCategory[]
  opportunities PlacementOpportunity[]

  @@index([ownerId])
}

/// GARM brand-safety category score for a project
model SafetyCategory {
  id        Int    @id @default(autoincrement())
  projectId Int
  name      String // "Crime", "Drugs", …
  score     Int    @default(0) // 0-100
  aiText    String @db.Text
  sortOrder Int    @default(0)

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId])
}

/// A scene-level placement opportunity
model PlacementOpportunity {
  id          Int    @id @default(autoincrement())
  projectId   Int
  sceneNo     Int    @default(1)
  description String @db.Text
  mood        String @default("")
  rationale   String @db.Text
  type        String @default("visual") // visual | audio
  prominence  String @default("background") // background | active
  category    String @default("") // "Beverages", "Technology", …
  estValue    Int    @default(0) // dollars
  durationSec Int    @default(0)
  safety      Int    @default(100) // 0-100
  sortOrder   Int    @default(0)

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId])
}

/// Lead applications (Express Interest + contact form)
model Application {
  id           Int      @id @default(autoincrement())
  name         String
  email        String?
  company      String?
  projectId    Int?
  projectTitle String?
  budget       String?
  message      String?  @db.Text
  status       String   @default("new") // new | in_progress | closed
  note         String?  @db.Text
  createdAt    DateTime @default(now())
}
```

- [ ] **Step 3: Commit** `feat(placement): prisma schema (marketplace models)`.

## Task 0.3 — Prisma client singleton

**Files:** `placement/src/lib/prisma.ts`

- [ ] **Step 1:** Copy the singleton pattern verbatim:

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 2: Commit** `feat(placement): prisma client singleton`.

## Task 0.4 — Create DB + push schema

- [ ] **Step 1:** Create database `placement` on the running MySQL container (port 3307). Use the same creds as repo-root `.env`. Example (adapt creds):

Run: `docker exec adplatform-mysql mysql -uroot -p"$MYSQL_ROOT_PW" -e "CREATE DATABASE IF NOT EXISTS placement CHARACTER SET utf8mb4;"`
(If container name/creds differ, read repo-root `.env` `DATABASE_URL` for host/port/user/pass; create `placement` DB there.)

- [ ] **Step 2:** Push schema + generate client:

Run: `cd placement && npm run db:push`
Expected: "Your database is now in sync with your Prisma schema" + client generated.

- [ ] **Step 3:** No commit (DB state). Proceed.

## Task 0.5 — Seed (admin + demo projects with safety + opportunities)

**Files:** `placement/prisma/seed.ts`, `placement/prisma/seed-data.ts`

- [ ] **Step 1:** Create `placement/prisma/seed-data.ts` — port the 6 projects from the (now-deleted) draft `src/fp/data.ts` content, each augmented with `safetyScore`, `safety`, `status`, `releaseLabel`, plus a small `safetyCats` array (11 GARM categories) and a few `opportunities`. Provide the full array. (Use the project fields from Task 0.2 schema.) For brevity each project gets the same 11 GARM category names with varied scores, and 4 sample opportunities. Full content:

```ts
export const GARM_CATEGORIES = [
  "Adult Content", "Arms & Ammunition", "Crime", "Drugs", "Hate Speech",
  "Military Conflict", "Profanity", "Sensitive Issues", "Spam", "Terrorism", "Tobacco",
] as const;

type SeedProject = {
  code: string; title: string; genre: string; synopsis: string; poster: string;
  format: string; studio: string; status: "PRE_PRODUCTION" | "FILMING" | "POST_PRODUCTION" | "RELEASED";
  releaseLabel: string; countries: string; audienceGender: string; audienceAge: string;
  projViews: string; cpmRange: string; budgetRange: string; safetyScore: number;
  safety: "SAFE" | "REVIEW" | "RISK"; catScores: number[]; // 11 scores aligned to GARM_CATEGORIES
  opps: { sceneNo: number; description: string; mood: string; rationale: string; type: string; prominence: string; category: string; estValue: number; durationSec: number; safety: number }[];
};

export const SEED_PROJECTS: SeedProject[] = [
  {
    code: "#PP-2026-8540", title: "Bandwidth", genre: "Coming-of-age",
    synopsis: "A small-town high-school senior with twelve million followers signs with a powerhouse LA talent agency and discovers a hidden file that turns every future decision into leverage.",
    poster: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=800&q=70",
    format: "50 ep × 1m 15s", studio: "Verita Vertical", status: "PRE_PRODUCTION", releaseLabel: "Q1 2027",
    countries: "US, UK, Australia, Canada, Mexico", audienceGender: "All", audienceAge: "16-30",
    projViews: "2.4M", cpmRange: "$3.60-$5.40", budgetRange: "$6,000,000 — $10,000,000",
    safetyScore: 80, safety: "SAFE", catScores: [88, 90, 70, 88, 92, 88, 81, 76, 96, 92, 88],
    opps: [
      { sceneNo: 1, description: "The protagonist navigates the chaotic high school cafeteria, recording a vlog while snacking.", mood: "youthful energy, authenticity", rationale: "Positions tech and jewelry at the forefront of Gen Z authenticity.", type: "visual", prominence: "background", category: "Beverages", estValue: 114, durationSec: 75, safety: 100 },
      { sceneNo: 1, description: "Signature necklace catches the light as she speaks to camera.", mood: "aspirational", rationale: "Jewelry as identity marker.", type: "visual", prominence: "active", category: "Jewelry", estValue: 114, durationSec: 75, safety: 100 },
      { sceneNo: 2, description: "She edits footage on a sleek laptop in her bedroom studio.", mood: "focused, creative", rationale: "Consumer tech in an authentic creator workflow.", type: "visual", prominence: "active", category: "Technology", estValue: 132, durationSec: 60, safety: 100 },
      { sceneNo: 3, description: "Morning routine — coffee and phone notifications pile up.", mood: "relatable", rationale: "Everyday beverage moment.", type: "visual", prominence: "background", category: "Home & Living", estValue: 98, durationSec: 45, safety: 95 },
    ],
  },
  // NOTE for implementer: repeat the same object shape for the remaining 5 projects using
  // the data from spec §4/§5b (Code Bracelet, Cold Case Files Active, The Longest Night,
  // Saffron Road, Ironwood County). Vary catScores, safety label, and give each ≥4 opps.
  // Full field values for those 5 are in docs/FP-Placement-Spec.md and the reference snapshots.
];
```

> **Implementer note:** the array above shows ONE complete project as the exact template. Fill the other 5 with the values already captured in `docs/FP-Placement-Spec.md` (§5b lists title/genre/format/countries/audience/budget/views/opps-count for all 10 catalog rows). Give each project 11 `catScores` and ≥4 `opps`. This is data entry, not logic — no ambiguity in shape.

- [ ] **Step 2:** Create `placement/prisma/seed.ts`:

```ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { GARM_CATEGORIES, SEED_PROJECTS } from "./seed-data";

const prisma = new PrismaClient();

async function main() {
  // 1. Superadmin (idempotent — never overwrite existing password)
  const existing = await prisma.user.findUnique({ where: { email: "admin@admin.com" } });
  const passwordHash =
    existing?.passwordHash ??
    (await bcrypt.hash(process.env.ADMIN_PASSWORD || "admin1234", 10));
  const admin = await prisma.user.upsert({
    where: { email: "admin@admin.com" },
    update: { role: "SUPERADMIN", name: "Admin" },
    create: { email: "admin@admin.com", passwordHash, role: "SUPERADMIN", name: "Admin" },
  });

  // 2. Projects (+ nested safety cats + opportunities)
  await prisma.project.deleteMany();
  for (const [i, p] of SEED_PROJECTS.entries()) {
    await prisma.project.create({
      data: {
        code: p.code, title: p.title, genre: p.genre, synopsis: p.synopsis,
        poster: p.poster, format: p.format, studio: p.studio, status: p.status,
        releaseLabel: p.releaseLabel, countries: p.countries,
        audienceGender: p.audienceGender, audienceAge: p.audienceAge,
        projViews: p.projViews, cpmRange: p.cpmRange, budgetRange: p.budgetRange,
        safetyScore: p.safetyScore, safety: p.safety, sortOrder: i, ownerId: admin.id,
        safetyCats: {
          create: GARM_CATEGORIES.map((name, idx) => ({
            name, score: p.catScores[idx] ?? 90, aiText: "", sortOrder: idx,
          })),
        },
        opportunities: {
          create: p.opps.map((o, idx) => ({ ...o, sortOrder: idx })),
        },
      },
    });
  }

  // 3. Settings (default locale + admin hash marker)
  await prisma.setting.upsert({
    where: { key: "default_lang" }, update: {}, create: { key: "default_lang", value: "en" },
  });

  console.log(`Seeded: admin + ${SEED_PROJECTS.length} projects`);
}

main().then(() => prisma.$disconnect()).catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
```

- [ ] **Step 3:** Run seed:

Run: `cd placement && npm run db:seed`
Expected: "Seeded: admin + 6 projects". Verify: `npx prisma studio` optional, or a quick count query.

- [ ] **Step 4: Commit** `feat(placement): seed (admin + demo projects, GARM, opportunities)`.

**WAVE 0 GATE (review before Wave 1):** dispatch `architect` to review schema design + seed correctness (types match, FK cascades, no data leaks). Fix findings.

---

# WAVE 1 — Auth · UI foundation · Data layer (PARALLEL, 3 agents)

All three depend ONLY on Wave 0 (schema/client/types). Their files are disjoint → run concurrently.

## Task 1-A — Auth (agent: `coder`; Context7: jose, Next middleware/server-actions)

**Files (exclusive):** `placement/src/lib/auth/session.ts`, `require.ts`, `password.ts`; `placement/src/middleware.ts`; `placement/src/app/admin/actions.ts`; `placement/src/app/admin/login/page.tsx`, `login-form.tsx`.

- [ ] **Step 1:** Context7 — jose `SignJWT`/`jwtVerify`, Next 16 middleware + `cookies()` in server actions.
- [ ] **Step 2:** Copy `src/lib/auth/session.ts`, `require.ts`, `password.ts` from the existing app **verbatim**, then delete the legacy Setting-based helpers in `password.ts` (`verifyAdminPassword`/`setAdminPassword`) — not needed. `require.ts` `AuthedUser` keeps `{id,email,role,name,isActive}`.
- [ ] **Step 3:** Copy `src/middleware.ts` verbatim (matcher `/admin/:path*`).
- [ ] **Step 4:** Copy `src/app/admin/actions.ts` (`login`/`logout`/`changePassword`) verbatim — keep the per-IP rate limiter.
- [ ] **Step 5:** Copy `src/app/admin/login/page.tsx` + `login-form.tsx` verbatim (indigo restyle happens via shared globals from 1-B; keep markup, adjust classes to neutral utility classes if the source used red tokens — replace any `bg-primary` red assumptions with the shared token, which 1-B makes indigo).
- [ ] **Step 6:** Type-check: `cd placement && npx tsc --noEmit`. Expected: no errors (note: pages that import UI primitives from 1-B may error until 1-B lands — acceptable; re-check at Wave-1 gate).
- [ ] **Step 7: Commit** `feat(placement): auth (session, guards, login, middleware)`.

## Task 1-B — Design tokens + UI primitives + layout (agent: `coder`; skills: `frontend-design`, `ui-ux-pro-max`; Context7: Tailwind v4, lenis)

**Files (exclusive):** `placement/src/app/globals.css`, `placement/src/app/layout.tsx`, `placement/src/lib/utils.ts`, `placement/src/components/smooth-scroll.tsx`, `placement/src/components/ui/{container,section,button,badge,reveal,gauge,score-bar}.tsx`.

- [ ] **Step 1:** Context7 — Tailwind v4 `@import "tailwindcss"` + `@theme inline`; lenis React usage.
- [ ] **Step 2:** `placement/src/lib/utils.ts` — `cn()` (clsx + tailwind-merge). [code identical to standard cn helper]

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
```

- [ ] **Step 3:** `placement/src/app/globals.css` — light indigo tokens (see spec §3.1). Full file:

```css
@import "tailwindcss";
@import "tw-animate-css";

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-section: var(--section);
  --color-card: var(--card);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-success: var(--success);
  --color-warn: var(--warn);
  --color-danger: var(--danger);
  --font-sans: var(--font-sans);
}
:root {
  --background: #ffffff; --foreground: #111827; --section: #f4f5fa; --card: #ffffff;
  --primary: #4f46e5; --primary-hover: #4338ca; --primary-foreground: #ffffff;
  --muted: #f4f5fa; --muted-foreground: #6b7280; --border: #e5e7eb;
  --success: #16a34a; --warn: #f59e0b; --danger: #dc2626;
  --grad: linear-gradient(120deg, #4f46e5 0%, #6366f1 50%, #818cf8 100%);
}
@layer base {
  * { border-color: var(--border); }
  html { color-scheme: light; scroll-behavior: smooth; -webkit-font-smoothing: antialiased; }
  body { background: var(--background); color: var(--foreground); }
  ::selection { background: var(--primary); color: #fff; }
}
.grad-text { background: var(--grad); -webkit-background-clip: text; background-clip: text; color: transparent; }
.card-lift { transition: transform .35s cubic-bezier(.2,.8,.2,1), box-shadow .35s ease, border-color .35s ease; }
.card-lift:hover { transform: translateY(-6px); box-shadow: 0 12px 32px -12px rgba(79,70,229,.25); border-color: rgba(79,70,229,.35); }
.btn-glow { box-shadow: 0 8px 24px -8px rgba(79,70,229,.4); transition: box-shadow .3s ease, transform .2s ease, background .2s ease; }
.btn-glow:hover { box-shadow: 0 12px 32px -6px rgba(79,70,229,.55); transform: translateY(-2px); }
html.lenis, html.lenis body { height: auto; }
.lenis.lenis-smooth { scroll-behavior: auto !important; }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
```

- [ ] **Step 4:** `smooth-scroll.tsx`, `layout.tsx` — as in the prior landing plan (Inter font, `<SmoothScroll>` wrapper). Verify `lenis/react` resolves; else use the raf-loop fallback. [Provide the two files from spec/prior plan Task 3.]
- [ ] **Step 5:** UI primitives — `container.tsx`, `section.tsx`, `button.tsx` (cva primary/secondary/ghost), `badge.tsx` (`SafetyBadge` mapping DB enum SAFE/REVIEW/RISK → green/amber/red, `GenreBadge`), `reveal.tsx` (framer-motion fade-up). PLUS two new report primitives:
  - `gauge.tsx` — semicircle 0-100 safety gauge (SVG arc, color by score: ≥80 success, 60-79 warn, else danger).
  - `score-bar.tsx` — horizontal GARM bar (label + value + colored fill by score).
  [Provide complete code for each — button/badge/reveal/container/section per prior plan Task 5; gauge/score-bar as new SVG components.]
- [ ] **Step 6:** Type-check `npx tsc --noEmit` (UI files only). Commit `feat(placement): tokens + ui primitives + layout`.

## Task 1-C — Data layer (agent: `coder`; Context7: Prisma queries)

**Files (exclusive):** `placement/src/lib/types.ts`, `placement/src/lib/data/projects.ts`, `applications.ts`, `format.ts`.

- [ ] **Step 1:** Context7 — Prisma `findMany`/`include`/`orderBy`.
- [ ] **Step 2:** `types.ts` — DTOs: `ProjectListDTO` (card fields), `ProjectDetailDTO` (+ `safetyCats[]`, `opportunities[]`, computed `exposureTotal`, `opportunitiesCount`), `SafetyCatDTO`, `OpportunityDTO`, `ApplicationDTO`.
- [ ] **Step 3:** `format.ts` — `parseStringArray(json)`, `splitCountries(s)`, `moneyShort(n)` ("$114"), `sumExposure(opps)`.
- [ ] **Step 4:** `projects.ts` (`import "server-only"`):

```ts
import "server-only";
import { prisma } from "@/lib/prisma";
import type { ProjectListDTO, ProjectDetailDTO } from "@/lib/types";

export async function getProjects(activeOnly = true): Promise<ProjectListDTO[]> {
  const rows = await prisma.project.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { opportunities: true } } },
  });
  return rows.map((p) => ({
    id: p.id, code: p.code, title: p.title, genre: p.genre, synopsis: p.synopsis,
    poster: p.poster ?? "", format: p.format, studio: p.studio, countries: p.countries,
    audienceGender: p.audienceGender, audienceAge: p.audienceAge, projViews: p.projViews,
    budgetRange: p.budgetRange, safety: p.safety, safetyScore: p.safetyScore,
    opportunitiesCount: p._count.opportunities,
  }));
}

export async function getProject(id: number): Promise<ProjectDetailDTO | null> {
  const p = await prisma.project.findUnique({
    where: { id },
    include: {
      safetyCats: { orderBy: { sortOrder: "asc" } },
      opportunities: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!p) return null;
  const exposureTotal = p.opportunities.reduce((s, o) => s + o.estValue, 0);
  return {
    id: p.id, code: p.code, title: p.title, genre: p.genre, synopsis: p.synopsis,
    poster: p.poster ?? "", gallery: p.gallery, format: p.format, studio: p.studio,
    status: p.status, releaseLabel: p.releaseLabel, countries: p.countries,
    audienceGender: p.audienceGender, audienceAge: p.audienceAge, projViews: p.projViews,
    cpmRange: p.cpmRange, budgetRange: p.budgetRange, safety: p.safety, safetyScore: p.safetyScore,
    safetyCats: p.safetyCats.map((c) => ({ name: c.name, score: c.score, aiText: c.aiText })),
    opportunities: p.opportunities.map((o) => ({
      sceneNo: o.sceneNo, description: o.description, mood: o.mood, rationale: o.rationale,
      type: o.type, prominence: o.prominence, category: o.category, estValue: o.estValue,
      durationSec: o.durationSec, safety: o.safety,
    })),
    exposureTotal, opportunitiesCount: p.opportunities.length,
  };
}

export async function getProjectIds() {
  return (await prisma.project.findMany({ select: { id: true } })).map((r) => r.id);
}
```

- [ ] **Step 5:** `applications.ts` — `createApplication(data)`, `listApplications(status?)`, `statusCounts()`.
- [ ] **Step 6:** Type-check. Commit `feat(placement): data layer (projects, applications, format)`.

**WAVE 1 GATE:** `cd placement && npx tsc --noEmit` across whole app must pass. `architect` review of auth copy correctness (secret handling, active-user gate) + DTO shapes. Fix.

---

# WAVE 2 — Public sections · Admin CRUD (PARALLEL, many agents)

Depends on Wave 1 (primitives + data types + auth). Two independent tracks; within each, files are disjoint.

## Track 2P — Public section components (agents: `coder` ×N; skill: `frontend-design`; Context7: framer-motion)

Each is ONE file → one agent each, fully parallel. All are presentational, receive data via props (page does the query in Wave 3). Full code for Header/Hero/Stats/Trust/HowItWorks/GetStarted/Why/Faq/Contact/Footer/ProjectCard/Featured is in the reference (prior landing plan) — adapt `ProjectCard`/`Featured` to take `ProjectListDTO[]` props and map DB enum safety.

- [ ] **2P-1** `components/header.tsx`
- [ ] **2P-2** `components/hero.tsx`
- [ ] **2P-3** `components/stats.tsx` (static copy from spec §4.3 — the 4 stats can stay hardcoded marketing copy)
- [ ] **2P-4** `components/project-card.tsx` (props: `project: ProjectListDTO`; SafetyBadge from enum)
- [ ] **2P-5** `components/featured.tsx` (props: `projects: ProjectListDTO[]`)
- [ ] **2P-6** `components/trust.tsx`
- [ ] **2P-7** `components/how-it-works.tsx`
- [ ] **2P-8** `components/get-started.tsx`
- [ ] **2P-9** `components/why.tsx` (founders — static marketing copy)
- [ ] **2P-10** `components/faq.tsx` (static copy)
- [ ] **2P-11** `components/contact.tsx` (form posts to `createApplication` server action — wire the action)
- [ ] **2P-12** `components/footer.tsx`
- [ ] **2P-13 Report sections** (own files): `components/report/{report-hero,roi-snapshot,safety-assessment,investment,deep-dive,opportunity-item}.tsx` — render `ProjectDetailDTO`. Use `gauge`/`score-bar` primitives. Cover all spec §5 fields (minus theme-toggle).

Each: build the component, `npx tsc --noEmit`, commit `feat(placement): <name> component`.

## Track 2A — Admin CRUD (agents: `coder` ×N; Context7: Next server actions)

Copy-and-adapt the existing admin patterns. Disjoint file groups → parallel.

- [ ] **2A-1** Admin shell: `app/admin/(panel)/layout.tsx` (`requireUser()` + sidebar + logout form) + `admin-nav.tsx` (role-filtered: SUPERADMIN all, PUBLISHER → projects only) + dashboard `page.tsx`. Copy from source, restyle to light theme.
- [ ] **2A-2** Projects CRUD: `app/admin/(panel)/projects/{page,new/page,[id]/edit/page,project-form,row-actions,actions}.tsx`. Owner-scoped list, `ownerId` forced, `revalidatePath("/","/catalog","/reports/[id]")`. Form covers all new Project fields + status/safety selects.
- [ ] **2A-3** Safety + Opportunities sub-editors (own files under projects edit): manage `SafetyCategory[]` (11 rows) and `PlacementOpportunity[]` for a project via nested server actions (`deleteMany` + `create` on save).
- [ ] **2A-4** Users CRUD (SUPERADMIN): `app/admin/(panel)/users/{page,new,user-form,actions}.tsx` — `createPublisher` (bcrypt, P2002 handling), `setUserActive` (no self-lockout), `resetUserPassword`.
- [ ] **2A-5** Applications (leads): `app/admin/(panel)/applications/{page,actions}.tsx` — list + status change.

Each group: build, `npx tsc --noEmit`, commit.

**WAVE 2 GATE:** full `npx tsc --noEmit` + `npm run build` pass. `architect` review of admin authz (owner scoping, superadmin gates, no `ownerId` trust from form) + report field coverage vs spec §5.

---

# WAVE 3 — Compose pages + verify (SEQUENTIAL, 1 agent)

- [ ] **3.1 Landing** `app/page.tsx` — `const projects = await getProjects()`; compose Header/Hero/Stats/`<Featured projects={projects.slice(0,6)} />`/Trust/HowItWorks/GetStarted/Why/Faq/Contact/Footer.
- [ ] **3.2 Catalog** `app/catalog/page.tsx` — sidebar filters (genre/gender/budget/safety/status) + toolbar (search/sort/grid-list) + card grid from `getProjects()`. Filters can be client-side over the fetched list for Phase 1 (note this; server-side filtering later).
- [ ] **3.3 Report** `app/reports/[id]/page.tsx` — `getProject(Number(id))` → `notFound()` if null; render report sections (2P-13). `generateStaticParams` from `getProjectIds()` optional.
- [ ] **3.4 Auth stubs** `app/login/page.tsx`, `app/register/page.tsx` — brand-facing placeholders (form UI, Express-Interest→lead messaging; real brand auth deferred). Admin login stays at `/admin/login`.
- [ ] **3.5 Build gate:** `cd placement && npm run build` — 0 errors, routes `/`, `/catalog`, `/reports/[id]`, `/login`, `/register`, `/admin/*` listed.
- [ ] **3.6 Playwright smoke:** dev on 3001 → navigate `/` (assert real seeded titles like "Bandwidth" render from DB), `/catalog` (6 cards), `/reports/1` (gauge + GARM bars + opportunities), `/admin/login` → log in as `admin@admin.com` → edit a project → verify change on public page. Screenshot each; compare to reference. 0 console errors.
- [ ] **3.7 Cleanup:** `git rm -r src/fp src/app/fp` (if any drafts remain). Verify root app still builds (`cd .. && npm run build`).
- [ ] **3.8 Commit** `feat(placement): compose public pages + auth stubs`.

---

## Self-Review

**Spec coverage:** §1 isolation → W0.1; §2 pages → W3; §2a data model (Project+SafetyCategory+PlacementOpportunity+Application) → W0.2; reports filled by publisher → W2A-3; auth/publishers → W1-A + W2A; i18n UI infra (`Content`) → schema present, wiring deferred (noted); design system §3 → W1-B; landing §4 → 2P; catalog §5b → 3.2; report §5 → 2P-13 + 3.3; reuse §5c → copy tasks.

**Parallelism map:** W0 sequential (schema blocks all). W1 = 3 parallel (A/B/C disjoint). W2 = up to ~13 public + ~5 admin agents parallel (all disjoint files). W3 sequential (pages import everything). Gates between waves via `architect`.

**Skills/MCP per agent:** table in the plan intro + per-task. Every code agent MUST hit Context7 first for its framework surface.

**Deferred (later plans):** brand auth/role, real anonymization gate, AI report pipeline, escrow, PDF export, server-side catalog filtering, full UI i18n wiring, deploy.

**Placeholder scan:** seed-data shows one full project as exact template + explicit fill instruction for 5 more (data entry, unambiguous shape) — not a logic placeholder. All logic/code steps have complete code.

**Type consistency:** `BrandSafety` enum (SAFE/REVIEW/RISK) consistent schema↔badge↔DTO. `ProjectListDTO`/`ProjectDetailDTO` fields produced by `data/projects.ts` match consumer components. `ownerId` forced server-side everywhere.
