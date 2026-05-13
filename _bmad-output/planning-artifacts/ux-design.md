---
workflowType: 'ux-design'
project_name: 'Advertising Platform'
author: 'Sally (UX Designer)'
date: '2026-05-13'
inputDocuments:
  - 'prd.md'
  - 'architecture.md'
  - 'Advertising_Platform_TZ_v3.1.md'
  - 'Claude_Code_Kickoff.md'
status: 'COMPLETE'
---

# UX Design — Advertising Platform

**Author:** Sally (BMAD UX Designer)
**Date:** 2026-05-13
**Status:** v1, ready for implementation
**Companion docs:** `prd.md`, `architecture.md`

## 1. Design Principles

Five principles that resolve UX trade-offs through this project.

1. **Quiet by default, loud only on intent.** The interface should feel like a senior broker's office, not a marketplace bazaar. Lime accent appears 2–3 times per screen maximum. Whitespace is structural, not decorative.
2. **Confidence over reassurance.** No "Welcome back!" greetings. No "Don't worry, we'll help you find what you need." Users are professionals; treat them like it.
3. **Optimize for the workflow, not the screen.** The admin's day is not "open inquiry → close inquiry"; it's "handle 12 inquiries before lunch." UX should compress steps, not pad them.
4. **Show, don't ask.** If the platform already knows the user's role, company, current inquiry — never ask again. Pre-fill, pre-filter, default to context.
5. **One canonical layout per role.** Cabinet looks the same regardless of which page; admin looks the same regardless of which queue view. Visual stability lowers cognitive load.

## 2. Information Architecture

```
Public (anyone)
  ├─ Homepage (/)
  ├─ How It Works
  │    ├─ For Advertisers
  │    └─ For Publishers
  ├─ About
  ├─ FAQ
  ├─ Catalog (browse, no submit)
  ├─ Publisher Detail (read-only)
  ├─ Listing Detail (read-only, no submit button if not logged in)
  ├─ Terms of Service
  ├─ Privacy Policy
  └─ Contact

Auth
  ├─ Register (role selection → personal → verify → company)
  ├─ Login
  ├─ Forgot Password
  └─ Reset Password

Advertiser Cabinet (verified advertiser only)
  ├─ Dashboard (My Inquiries summary + activity)
  ├─ My Inquiries (list)
  │    └─ Inquiry Detail (chat widget + status + activity)
  ├─ Catalog (browse, with Save + Submit)
  │    └─ Publisher Detail (full, with Save + Inquire CTAs)
  │         └─ Listing Detail (full, with Request Information CTA)
  ├─ Wishlist
  └─ Profile & Company Settings

Publisher Cabinet (verified publisher only)
  ├─ Dashboard (My Listings summary + Incoming Inquiries)
  ├─ My Listings
  │    ├─ Create Listing
  │    └─ Edit / View Listing (with view + inquiry analytics)
  ├─ Incoming Inquiries
  │    └─ Inquiry Detail (chat widget + status + activity)
  ├─ Public Profile Editor
  │    ├─ Partners
  │    └─ Works (case studies)
  └─ Settings

Super Admin (admin subdomain)
  ├─ Dashboard (KPIs + My Queue + Team Queue + activity feed)
  ├─ Inquiries
  │    ├─ All Inquiries (queue with filters)
  │    └─ Inquiry Detail (3-column split-pane)
  ├─ Verifications
  │    ├─ Queue
  │    └─ Detail
  ├─ Users
  ├─ Companies
  ├─ Listings (all, admin-level)
  ├─ Taxonomy
  │    ├─ Industries
  │    ├─ Channel Types
  │    ├─ Source Channels
  │    └─ Regions
  ├─ Featured Publishers (curator)
  ├─ Announcements
  ├─ Analytics
  ├─ Audit Log
  ├─ Team (admin users + sub-roles)
  └─ Settings (email templates, SLA rules, brand)
```

## 3. Modern Dark Brand System

Authoritative source. All design decisions reference these tokens.

### 3.1 Color tokens

| Token | Hex | Tailwind class | Where to use |
|---|---|---|---|
| Primary background | `#0A0A0F` | `bg-background` | Page bg, nav, modal scrim |
| Surface | `#1A1A22` | `bg-surface` | Cards, list rows, dropdowns |
| Surface elevated | `#22222C` | `bg-surface-elevated` | Hover states, tooltips |
| Border subtle | `#2A2A35` | `border-subtle` | Default borders |
| Border strong | `#3A3A45` | `border-strong` | Focus rings, secondary buttons |
| Accent (lime) | `#BEFC42` | `bg-accent` / `text-accent` | Primary CTAs, brand mark, key data |
| Accent text-on | `#1A2A05` | `text-accent-on` | Text on lime fill |
| Text primary | `#F5F5F7` | `text-primary` | Body and headings |
| Text secondary | `#A8A8B0` | `text-secondary` | Captions, labels |
| Text tertiary | `#6A6A75` | `text-tertiary` | Disabled, placeholder |
| Success | `#34D399` | `text-success` / `bg-success/10` | Confirmation, positive trend |
| Warning | `#FBBF24` | `text-warning` / `bg-warning/10` | Caution, pending |
| Danger | `#F87171` | `text-danger` / `bg-danger/10` | Errors, destructive |
| Info | `#60A5FA` | `text-info` / `bg-info/10` | Neutral info |

### 3.2 Light mode (marketing only)

| Token | Hex |
|---|---|
| Background | `#F5F5F7` |
| Surface | `#FFFFFF` |
| Border | `#E5E5EA` |
| Accent (darkened for contrast) | `#3FB91A` |
| Text primary | `#0A0A0F` |
| Text secondary | `#5A5A65` |

### 3.3 Accent usage rules

- Lime appears at most **2–3 times per screen**. Reserve for: brand wordmark, single primary CTA per page, status pill that means "Available/Active/Confirmed".
- **Never** lime for destructive actions or errors. Danger color is the only acceptable signal for negative states.
- Status pills: lime at 10% opacity background + solid lime text for active/available states only.

### 3.4 Typography

| Element | Font | Size / Weight | Color |
|---|---|---|---|
| Display H1 | Inter | 48px / 500 | Text primary |
| Display H1 (compact) | Inter | 36px / 500 | Text primary |
| Page H2 | Inter | 28px / 500 | Text primary |
| Section H3 | Inter | 20px / 500 | Text primary |
| Body large | Inter | 16px / 400 | Text primary |
| Body default | Inter | 14px / 400 | Text primary |
| Caption / label | Inter | 12px / 500, uppercase, +0.05em tracking | Text secondary |
| Code / IDs | JetBrains Mono | 13px / 400 | Text secondary |

Rules: Inter only (no other fonts in MVP). Weights 400 and 500 only — no bold. Sentence case everywhere. Numbers in tables/data use tabular figures (`font-variant-numeric: tabular-nums`).

### 3.5 Spacing & layout

- **Base unit: 4px.** All spacing in multiples: 4, 8, 12, 16, 24, 32, 48, 64.
- **Radius:** 6px buttons/inputs, 8px cards, 10–12px large containers, 999px pills.
- **Max content width:** 1200px centered (marketing). 1440px (cabinet, admin) with sidebar.
- **Grid:** 12 columns, 24px gutters on marketing. Flex/grid as needed elsewhere.

### 3.6 Elevation

- Cards: 0.5px border (Border Subtle), no shadow.
- Modals: subtle backdrop blur + scrim at `bg-background/80`.
- Tooltips/popovers: 1px Border Strong + subtle shadow `0 4px 12px rgba(0,0,0,0.4)`.

## 4. Component Library

Mapping intended usage of shadcn/ui primitives to Modern Dark tokens.

| Component | Role | Tokens |
|---|---|---|
| `Button variant="default"` | Primary CTA | `bg-accent text-accent-on font-medium` |
| `Button variant="outline"` | Secondary CTA | `border-strong bg-transparent text-primary` |
| `Button variant="ghost"` | Tertiary / icon | `text-secondary hover:bg-surface-elevated` |
| `Button variant="destructive"` | Delete / reject | `bg-danger/10 text-danger border border-danger/30` |
| `Input` / `Textarea` | Form input | `bg-surface border-subtle text-primary focus:ring-accent/40` |
| `Card` | Listing tile, profile card | `bg-surface border border-subtle rounded-[10px] p-5` |
| `Badge` | Status pill | Variant per status (see §6) |
| `Dialog` | Modal | Scrim `bg-background/80 backdrop-blur-sm`, content `bg-surface border border-strong rounded-xl` |
| `DropdownMenu` | Context menus | `bg-surface-elevated border border-strong` |
| `NavigationMenu` | Top nav | Transparent over background |
| `Separator` | Divider | `bg-border-subtle h-px` |
| `Sheet` | Side panel | Same as Dialog, anchored right |
| `Toast` | Transient notifications | `bg-surface-elevated border border-strong`, accent stripe for success, danger stripe for error |
| `Avatar` | User photo | Circle, 32px default, fallback initials in Surface Elevated |
| `Table` | Inquiry queue, user list | Striped rows via `bg-surface-elevated` on hover only, not zebra |
| `Tabs` | Profile sections, taxonomy types | Underline on active (lime), text-secondary on inactive |
| `Form` (RHF + Zod) | All forms | Server-side validation echoed inline below inputs |
| `Select` | Channel filter etc | Same styling as Input |

**Icons:** lucide-react, outline style only. 16px inline with text, 20px in button slots, 24px decorative. Never filled icons.

## 5. Screen Inventory

Detail level: each screen has purpose, key elements, primary interactions. Wireframes for critical screens are in §6.

### 5.1 Public

| Screen | Purpose | Key elements |
|---|---|---|
| Homepage | Pitch + funnel into registration | Hero with lime-period wordmark, value prop in sentence case, two CTAs (lime + outline), featured-listings grid, How-it-works strip, footer |
| How It Works — For Advertisers | Conversion content for buyers | 3-step illustration, advertiser-side benefits, CTA |
| How It Works — For Publishers | Conversion content for sellers | 3-step illustration, publisher-side benefits, CTA |
| About | Trust-builders | Team, mission, contact channel |
| Catalog (public) | Browse without commitment | Filters in left rail, listing grid 3-up, pagination |
| Publisher Detail (public) | Listing context | Profile card, listings strip, partners, works |
| Listing Detail (public) | Single-listing focus | Listing meta (no price), publisher card, "Request Information" CTA gated to logged-in advertisers |
| FAQ | Self-service answers | Accordion with categories |
| ToS, Privacy, Contact | Legal/contact | Standard layouts |

### 5.2 Auth

| Screen | Purpose | Key elements |
|---|---|---|
| Register — Step 1 (Role) | Choose lane | Two large cards: Advertiser / Publisher, each with one-line description |
| Register — Step 2 (Personal) | Capture user | Name, email, phone, password, ToS checkbox |
| Register — Step 3 (Verify) | Email verify | 6-digit input, resend after 60s, expires at 10:00 countdown |
| Register — Step 4 (Company) | Capture company | Legal name, tax ID, country, address, industry select, channels checkbox group, optional logo upload |
| Register — Done | Confirmation | "Account submitted for verification. You can browse but cannot submit inquiries yet." with CTA to catalog |
| Login | Authenticate | Email + password, "Forgot password" link, link to register |
| Forgot Password | Request reset link | Email input + submit |
| Reset Password | Set new password | New password + confirm |

### 5.3 Advertiser Cabinet

| Screen | Purpose | Key elements |
|---|---|---|
| Dashboard | Glance at activity | KPI row (open inquiries, awaiting reply, confirmed deals), recent activity, suggested listings |
| My Inquiries | Manage active conversations | Table (status, publisher, listing, last activity, age) with status filter chips |
| Inquiry Detail | Single inquiry workspace | Left context panel (publisher card, listing card, status), right embedded chat widget, status timeline below |
| Catalog (cabinet) | Same as public but with Save + Inquire actions in-grid | Filter rail, grid |
| Publisher Detail (cabinet) | Single publisher | Hero card, listings list, partners, works, Save publisher CTA |
| Listing Detail (cabinet) | Single listing | Listing meta, publisher card, big "Request Information" CTA |
| New Inquiry form | Capture inquiry details | Campaign goal, dates, optional budget range, notes, attached listing context |
| Wishlist | Saved publishers + listings | Grid of saved items with quick-inquiry CTA |
| Profile & Settings | Personal + company info | Tabs: Personal info / Company info / Notifications / Security |

### 5.4 Publisher Cabinet

| Screen | Purpose | Key elements |
|---|---|---|
| Dashboard | Glance at activity | KPI row (active listings, total inquiries, conversion rate), Incoming Inquiries strip |
| My Listings | Manage inventory | Table (title, channel, status, views, inquiries, dates) with "New Listing" CTA |
| Create / Edit Listing | Capture listing | Title, channel type, source channel, dates (range picker), audience demographics (JSON-ish editor), description, attachments |
| Listing Detail (publisher's own) | Stats + edit | View count, inquiry count chart, edit/pause/archive buttons |
| Incoming Inquiries | Manage conversations | Table similar to My Inquiries on advertiser side; opens to inquiry detail |
| Inquiry Detail (publisher) | Single inquiry | Same shell as advertiser side but with publisher-side chat widget |
| Public Profile Editor | What's seen on /publishers/<id> | Tabs: Profile / Partners / Works |
| Add Partner | Capture partner | Name, logo, link |
| Add Work | Capture case study | Title, description, thumbnail, link |
| Settings | Personal + company | Same shell as advertiser |

### 5.5 Super Admin

| Screen | Purpose | Key elements |
|---|---|---|
| Admin Login | Auth + 2FA gate | Email + password, then 2FA prompt |
| Admin Dashboard | Situational awareness | 5 KPI cards top, My Queue + Team Queue middle, activity feed + announcements bottom |
| Inquiry Queue | Triage center | Big filterable table with row actions, bulk select, saved views |
| Inquiry Detail (admin) | Mediation workspace | **3-column split-pane** — see wireframe in §6.4 |
| Verification Queue | Onboarding triage | Table of pending companies with quick actions |
| Verification Detail | Single company review | Submitted info + uploaded docs preview + Approve/Reject/Need-Info |
| Users | User admin | Filterable table, row actions (suspend/reset/impersonate) |
| Users Detail | Single user | Profile, company, inquiries history, audit history, action panel |
| Companies | Company admin | Filterable table |
| Company Detail | Single company | Profile, employees, listings, inquiries, verification history |
| Listings (admin) | All listings | Filterable table with admin actions (edit, unpublish, flag) |
| Taxonomy | Editor | Tabs: Industries / Channel Types / Source Channels / Regions. Each is a list with add/edit/archive |
| Featured Publishers | Curation | Drag-and-drop ordered list with date-window pickers |
| Announcements | Broadcast | List of past + new announcement form (audience selector, scheduled window) |
| Analytics | Reports | Date-range picker top, multiple widget tabs, CSV export per widget |
| Audit Log | Compliance trail | Filterable table of admin actions |
| Team | Admin user mgmt | List of admins with sub-role chips, edit/disable, create new admin |
| Settings | Platform config | Tabs: Email Templates / Notification Rules / SLA Rules / Brand Assets / Legal Pages |

## 6. Critical Screen Wireframes (ASCII)

Wireframes for the five screens where the design carries the most weight. Other screens follow the patterns established here.

### 6.1 Marketing Homepage

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ADVERTISING.    How it works ▾   For Advertisers   For Publishers      │
│                                                       [Log in]  [Start]  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ⊙ Now onboarding Armenia's top media                                    │
│                                                                          │
│  Find your next ad slot.                                                 │
│  We handle the rest.                                                     │
│                                                                          │
│  Armenia's first brokered marketplace for TV, radio, outdoor,            │
│  video, and product placement. Tell us what you need; we come            │
│  back with options within 4 business hours.                              │
│                                                                          │
│  [Get started ──────]  [How it works ──]                                 │
│                                                                          │
│                          ─── ↓ scroll ───                                │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│  FEATURED OPPORTUNITIES                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │ RADIO           │  │ TV              │  │ PRODUCT PLAC.   │         │
│  │ Morning Drive   │  │ Prime-Time Spot │  │ Q3 Film         │         │
│  │ Yerevan, Aug 1- │  │ Shant TV, Aug 5 │  │ Studio Atlas    │         │
│  │ 35k daily        │  │ -Sep 5, evening  │  │ Mid-budget drama │         │
│  │                 │  │                 │  │                 │         │
│  │ ⊙ Active        │  │ ⊙ Active        │  │ ⊙ Active        │         │
│  │  240 views      │  │  189 views      │  │  87 views       │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│  HOW IT WORKS                                                            │
│  1. Browse Armenia's catalog                                             │
│  2. Tell us what you need                                                │
│  3. We negotiate. You confirm.                                           │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│ ADVERTISING.  Built in Armenia.  © 2026   ToS  Privacy  Contact          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Animation:** Hero text reveals on load (motion: stagger by line, 60ms apart). Featured cards stagger in on scroll-into-view (GSAP ScrollTrigger, opacity + 8px Y). Hover on card: lift 4px, border brightens to Border Strong (200ms cubic-bezier(0.16,1,0.3,1)).

### 6.2 Advertiser Inquiry Detail

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ADVERTISING.  Dashboard   My Inquiries   Catalog   Wishlist              │
│                                              🔔3   Anush ▾               │
├─────────────────────────────────────────────────────────────────────────┤
│ My Inquiries  ›  Inquiry #INQ-1042                                       │
│                                                                          │
│ ┌─────────────────────────────┐  ┌─────────────────────────────────────┐│
│ │ ⊙ AWAITING YOU              │  │ Conversation                        ││
│ │                              │  │                                      ││
│ │ Radio Van                    │  │ ┌─────────────────────────────────┐ ││
│ │ Morning Drive 7am–9am        │  │ │ ADVERTISING TEAM             ⏱  │ ││
│ │ Aug 1 – Aug 31               │  │ │ 12:34 yesterday                  │ ││
│ │ Audience: 35k daily          │  │ │                                  │ ││
│ │ 25–45 urban professionals    │  │ │ Hi Anush, thanks for the         │ ││
│ │                              │  │ │ inquiry. I'll check availabili-  │ ││
│ │ Created: 2 days ago          │  │ │ ty with Radio Van and get back   │ ││
│ │ Last activity: 2h ago        │  │ │ to you by EOD.                   │ ││
│ │ Assigned: Mariam K.          │  │ └─────────────────────────────────┘ ││
│ │                              │  │                                      ││
│ │ Status timeline:             │  │ ┌─────────────────────────────────┐ ││
│ │ ● New           Mar 11  9:02 │  │ │ ADVERTISING TEAM             ⏱  │ ││
│ │ ● Assigned      Mar 11  9:15 │  │ │ 14:12 today                      │ ││
│ │ ● In Progress   Mar 11 12:34 │  │ │                                  │ ││
│ │ ● Awaiting You  Mar 13 14:12 │  │ │ Radio Van has Aug 5–31 morning   │ ││
│ │   ↓                          │  │ │ drive at $5,500 for 30 spots.    │ ││
│ │ ○ Confirmed     —            │  │ │ Creative deadline: Jul 28. Want  │ ││
│ │                              │  │ │ two alternatives to compare?     │ ││
│ │ Quick links:                 │  │ └─────────────────────────────────┘ ││
│ │  → View listing              │  │                                      ││
│ │  → View publisher            │  │                                      ││
│ │  → Cancel inquiry            │  │ ┌─ Type a message ──────────────┐   ││
│ │                              │  │ │                                │   ││
│ │                              │  │ │                          [Send]│   ││
│ │                              │  │ └────────────────────────────────┘   ││
│ └─────────────────────────────┘  └─────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
```

**Notes:** chat widget on the right is the third-party provider's embedded React component. Our shell provides only the left context panel and the surrounding chrome. Message bubbles match the brand: Surface bg, lime accent stripe on platform-team messages, text-primary, 12px caption above. Composer is fixed at the bottom of the right column.

### 6.3 Admin Dashboard

```
┌─────────────────────────────────────────────────────────────────────────┐
│ admin.ADVERTISING.   🔔7   Mariam K.  ▾                                  │
├──────┬──────────────────────────────────────────────────────────────────┤
│ DASH │  Good morning, Mariam.                                            │
│ INQS │                                                                   │
│ VFY  │ ┌──────┬──────┬──────┬──────┬─────────────────────────────────┐ │
│ USR  │ │  5   │  12  │  2   │  7   │     3h 12m                       │ │
│ CO   │ │ NEW  │ACTIVE│PEND. │SIGN  │     Median first-response        │ │
│ LIST │ │TODAY │ INQS │VERIFY│TODAY │     (last 7 days)                │ │
│ TAX  │ └──────┴──────┴──────┴──────┴─────────────────────────────────┘ │
│ FEAT │                                                                   │
│ ANN  │ ┌─ MY QUEUE (5) ──────────────────┐ ┌─ TEAM QUEUE (3) ──────────┐│
│ ANA  │ │ ⚠ INQ-1042  Yer.Bev   2h 45m   │ │  INQ-1051  StarBistro    ││
│ AUD  │ │   Radio Van    Awaiting You    │ │   Outdoor (Yerevan)       ││
│ TEAM │ │                                 │ │                  [Claim]  ││
│ STG  │ │ ⚠ INQ-1039  GreenCo   3h 10m   │ │                            ││
│      │ │   Shant TV     New             │ │  INQ-1052  TechBranch     ││
│      │ │                                 │ │   Banner (multiple)       ││
│      │ │   INQ-1037  Kavkaz   18h ago   │ │                  [Claim]  ││
│      │ │   Kinodaran    In Progress     │ │                            ││
│      │ │                                 │ │  INQ-1053  AmStudio       ││
│      │ │   INQ-1031  Volt     21h ago   │ │   Product placement       ││
│      │ │   YouTube ch.  Aw. Publisher   │ │                  [Claim]  ││
│      │ │                                 │ │                            ││
│      │ │   INQ-1028  AyValor  35h ago   │ │                            ││
│      │ │   Radio Liberty  Awaiting Adv. │ │                            ││
│      │ └─────────────────────────────────┘ └───────────────────────────┘│
│      │                                                                   │
│      │ ┌─ RECENT ACTIVITY ───────────────────────────────────────────┐ │
│      │ │  • 14:12  Mariam sent message in INQ-1042                    │ │
│      │ │  • 13:48  Aram closed INQ-1019 (Confirmed)                   │ │
│      │ │  • 13:31  New signup: David S. (Publisher, Studio Granat)    │ │
│      │ │  • 13:20  Mariam claimed INQ-1042                            │ │
│      │ │  • 12:55  Aram approved verification for Kavkaz Media        │ │
│      │ └──────────────────────────────────────────────────────────────┘ │
│      │                                                                   │
│      │ ┌─ ANNOUNCEMENTS ─────────────────────────────────────────────┐ │
│      │ │ 📌 Owner: SLA target updated to 4h for all open inquiries.   │ │
│      │ └──────────────────────────────────────────────────────────────┘ │
└──────┴──────────────────────────────────────────────────────────────────┘
```

**SLA indicators:** `⚠` icon in lime when inquiry has < 1h to SLA breach, in danger when breached. Age column uses live ticker (motion: useInterval every 60s).

### 6.4 Admin Inquiry Detail — the 3-column split-pane

The most complex screen in the product. Mediation happens here.

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ admin.ADVERTISING.        Inquiries › INQ-1042                  🔔7   Mariam K. ▾    │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ ┌─ CONTEXT ────────┐ ┌─ ADVERTISER CHAT ────────┐ ┌─ PUBLISHER CHAT ─────────────┐ │
│ │                  │ │ Anush K. — Yerevan Bev.   │ │ Davit M. — Radio Van         │ │
│ │ INQ-1042         │ │ ✓ verified, food & bev    │ │ ✓ verified, radio + web      │ │
│ │ ⊙ Awaiting Adv.  │ │ 1 inquiry total           │ │ 4 listings active            │ │
│ │ SLA: 2h 45m left │ │ +374 91 234 567           │ │ +374 11 123 456              │ │
│ │ Mar 11 → ...     │ │ anush@yerevan-bev.am      │ │ davit@radiovan.am            │ │
│ │                  │ │                            │ │                              │ │
│ │ Status: ▼        │ │ ─────────────────────────  │ │ ─────────────────────────    │ │
│ │ ┌─────────────┐  │ │                            │ │                              │ │
│ │ │AWAITING ADV.│  │ │ ┌─ MARIAM 12:34 yest. ──┐ │ │ ┌─ DAVIT 09:48 today ─────┐  │ │
│ │ └─────────────┘  │ │ │Hi Anush, thanks for     │ │ │ │ Pitch the evening block. │  │ │
│ │  ╰─ change ─╮    │ │ │the inquiry. I'll check  │ │ │ │ I can do $6,800 for 30   │  │ │
│ │             │    │ │ │availability with Radio  │ │ │ │ spots across Aug + Sep.  │  │ │
│ │  Mark as:   │    │ │ │Van and get back to you  │ │ │ └──────────────────────────┘  │ │
│ │  [Confirmed]│    │ │ │by EOD.                  │ │ │                              │ │
│ │  [Lost]     │    │ │ └─────────────────────────┘ │ │ ┌─ MARIAM 14:00 today ────┐  │ │
│ │  [Cancelled]│    │ │                            │ │ │ │ Got it. Pitching evening │  │ │
│ │             │    │ │ ┌─ MARIAM 14:12 today ──┐ │ │ │ │ block now. Will reply    │  │ │
│ │             │    │ │ │Radio Van has Aug 5–31  │ │ │ │ │ once they confirm.       │  │ │
│ │ ───────     │    │ │ │morning drive at $5,500  │ │ │ │ └──────────────────────────┘  │ │
│ │             │    │ │ │for 30 spots. Or, even   │ │ │                              │ │
│ │ LISTING     │    │ │ │better — Radio Van has   │ │ │ ─────────────────────────    │ │
│ │ Morning     │    │ │ │an evening block better  │ │ │                              │ │
│ │ Drive       │    │ │ │for your youth target.   │ │ │ ┌─ Type a message ──────┐    │ │
│ │ 7am–9am     │    │ │ │$6,500. Want to switch?  │ │ │ │                        │    │ │
│ │ Aug 1–31    │    │ │ └─────────────────────────┘ │ │ │ Templates ▾    [Send] │    │ │
│ │             │    │ │                            │ │ └────────────────────────┘    │ │
│ │ → switch    │    │ │ ┌─ Type a message ─────┐ │ │                              │ │
│ │   listing   │    │ │ │                        │ │ │ [📞 Log a call]              │ │
│ │             │    │ │ │ Templates ▾  [Send]   │ │ │                              │ │
│ │             │    │ │ └────────────────────────┘ │ │                              │ │
│ │ [📞 Log call]│    │ │                            │ │                              │ │
│ └──────────────┘ └────────────────────────────┘ └──────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ ─ ACTIVITY TIMELINE & INTERNAL NOTES ─────────────────────────────────────────────  │
│                                                                                      │
│ ⏱ 14:12  Mariam sent message to advertiser                                          │
│ 📞 13:45  Mariam logged 12-min call with Radio Van                                  │
│ ⊙  09:48  Davit replied: "Pitch the evening block. $6,800 for 30 spots."            │
│ 📝 09:30  Mariam: "Could upsell to prime-time TV after this. @Aram check Shant TV"  │
│ 🔃 09:15  Status: New → Assigned (Mariam)                                            │
│ ⊙  Mar 11 9:02  Anush created inquiry on Radio Van Morning Drive                    │
│                                                                                      │
│ [+ Add internal note]                                                                │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

**Interaction notes:**

- The three columns can be resized via drag handles between them. Default split: 25% / 37.5% / 37.5%.
- Both chat columns are scrollable independently. New messages auto-scroll to bottom.
- **Quick-response templates dropdown** opens above the composer with categorized templates (Greeting, Pricing follow-up, Awaiting publisher, Closing).
- **Status dropdown** in the left column shows next valid transitions only (Awaiting Adv. → Confirmed / Awaiting Publisher / Lost / Cancelled).
- **Log a call buttons** under each chat side trigger a small dialog (date, duration, party, notes) — does not call out, just logs the metadata.
- **Activity timeline** at the bottom is collapsible (Sheet on smaller viewports). Internal notes show with the 📝 icon and are admin-only.
- **@-mentions in notes** trigger a live suggestion dropdown of admin teammates. Mentioned users receive in-app notifications.

### 6.5 Publisher Dashboard

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ADVERTISING.  Dashboard   My Listings   Inquiries   Profile             │
│                                              🔔1   Davit M.  ▾           │
├─────────────────────────────────────────────────────────────────────────┤
│ Good morning, Davit.                                                     │
│                                                                          │
│ ┌─────────┬─────────┬─────────┬───────────────────────────────────────┐│
│ │   4     │   18    │  3 / 18 │  → Submit a new listing               ││
│ │ ACTIVE  │ TOTAL   │CONVERS. │                                       ││
│ │LISTINGS │ INQUIRIES │ RATE   │                                       ││
│ └─────────┴─────────┴─────────┴───────────────────────────────────────┘│
│                                                                          │
│ INCOMING INQUIRIES (1 new)                                               │
│ ┌──────────────────────────────────────────────────────────────────────┐│
│ │ ⊙ NEW   Mariam K. (Advertising team)                                  ││
│ │         Yerevan Beverages, food & beverage                            ││
│ │         Looking for Aug morning drive slot, ~$5,500 budget signaled   ││
│ │         Listing: Morning Drive 7am–9am Aug 1–31                       ││
│ │                                                       [Open inquiry → ]││
│ └──────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│ MY LISTINGS                                                              │
│ ┌──────────────────────────────────────────────────────────────────────┐│
│ │ ⊙ Morning Drive 7am–9am          Aug 1–31      35k     5 inquiries   ││
│ │ ⊙ Prime-Time Evening 7pm–9pm     Aug 5–Sep 5   42k     3 inquiries   ││
│ │ ⊙ News Segment 8pm                Jul 15–ongoing 28k     0 inquiries   ││
│ │ — Late Night Talk 11pm           PAUSED        18k     8 inquiries   ││
│ │                                                       [+ New Listing] ││
│ └──────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
```

## 7. Interaction Patterns

State variants every component must implement, when relevant.

### 7.1 Loading

- **Initial page load:** Skeleton shapes in Border Subtle on Surface bg. Match the structure of the loaded content. Avoid generic "Loading…" spinners.
- **In-place loading (form submit):** Button enters loading state — disabled, label replaced with "Working…", small inline spinner.
- **Pagination / load more:** Bottom of list reveals a thin lime progress bar.

### 7.2 Empty

Every list and grid has a tailored empty state with: an outline icon (24px, Text Tertiary), a clear sentence in brand voice, and a primary CTA where relevant.

| List | Empty copy |
|---|---|
| Advertiser My Inquiries | "No inquiries yet. Browse opportunities." [Browse opportunities → ] |
| Wishlist | "Nothing saved. Browse the catalog to save listings." [Browse → ] |
| Publisher Incoming Inquiries | "No inquiries yet. Our team will reach out when an advertiser is interested." |
| Publisher My Listings | "No listings yet. Tell the market what you have." [New listing → ] |
| Admin Team Queue | "No unassigned inquiries. Nice." (lime-tinted) |
| Search results | "No matches. Try removing a filter." |

### 7.3 Error

- **Field-level (form):** Inline below the input, danger color, no icon (the red text is enough).
- **Page-level (loading failed):** Centered card with danger icon, brand-voice message ("That didn't go through. Try again."), [Retry] button.
- **Toast (transient):** Top-right, Surface Elevated bg, 4px danger stripe on the left, 5-second auto-dismiss.

### 7.4 Success / confirmation

- **Inline (form saved):** Subtle 🗸 mark in success color next to the field, fades after 2s.
- **Toast (action completed):** Top-right, Surface Elevated bg, 4px lime stripe on the left, 4-second auto-dismiss.
- **Page-level (registration complete):** Big confirmation card with next-step CTAs.

### 7.5 Confirmation dialogs

Used only for destructive or irreversible actions. Pattern: clear question as H3, body explains consequence, two buttons — primary destructive (danger color) on the right, ghost cancel on the left.

### 7.6 Blocked actions

When an unverified user clicks a verification-gated action: tooltip appears with friendly explanation and a soft inline link to "Resubmit verification" or "Check status."

## 8. Animation Choreography

### 8.1 Motion (component-level)

- Default duration: 200ms. Anything over 400ms feels slow.
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` for most transitions; `ease-out` for entrances.
- Entrance: 8px Y offset + opacity 0 → 1.
- Hover lifts: 4px translateY-, 200ms.
- Modal: scrim fade in + content scale 0.96 → 1, 200ms.

### 8.2 GSAP (scroll-driven)

- Homepage hero parallax: background shifts at half scroll speed.
- Featured cards: ScrollTrigger reveal, stagger 60ms.
- Listing detail page hero: pinned title with progress indicator until 80% scroll.

### 8.3 @formkit/auto-animate

Applied to:

- Admin inquiry queue (rows appear/disappear when filters change).
- Notification drawer.
- Internal notes list on inquiry detail.

### 8.4 Reduced motion

All animations check `prefers-reduced-motion` via CSS media query and Motion's `useReducedMotion` hook. When true: animations disabled, only instant state changes.

## 9. Accessibility (WCAG 2.1 AA)

- **Color contrast:** All text/bg pairs verified at 4.5:1 (body) and 3:1 (large text). Tokens pre-checked.
- **Focus visible:** Every interactive element has a visible 1.5px lime focus ring on keyboard focus.
- **Keyboard navigation:** Every action reachable via keyboard. Tab order matches visual order. No focus traps.
- **Screen reader:** Semantic HTML throughout. ARIA labels on icon-only buttons. ARIA-live regions for toasts and dynamic SLA indicators.
- **No color-only signals:** Status pills always include text + lime/danger/warning color. Activity timeline icons always paired with text labels.
- **Reduced motion:** Honored (see §8.4).
- **Forms:** Labels associated with inputs. Error messages associated via `aria-describedby`. Field validation announced on blur.

## 10. Responsive Strategy

**MVP is desktop-first.** Mobile is read-only browse and inquiry-status check; transactional flows are optimized for desktop.

| Breakpoint | Behaviour |
|---|---|
| `< 768px` (mobile) | Marketing pages fully responsive. Cabinet pages render with simplified layout (sidebar collapses to bottom nav, tables stack as cards, chat fills viewport). Admin panel shows desktop-only banner ("Open this in desktop browser for full functionality"). |
| `768–1024px` (tablet) | Marketing fully usable. Cabinet sidebar collapses to icon strip. Admin queue table scrolls horizontally. Admin Inquiry Detail (3-column) becomes tabbed (Context / Advertiser / Publisher tabs). |
| `≥ 1024px` (desktop) | Full layouts as designed. |
| `≥ 1440px` (wide desktop) | Centered content with max-width caps. Sidebars don't expand further. |

## 11. Microcopy Guidelines

Source of truth: `CLAUDE.md` § Tone of Voice. Reinforced here:

- **Confidence over warmth.** Skip greetings like "Hi there!"; skip apologies like "Sorry for the inconvenience."
- **Brief over chatty.** A button label is "Submit inquiry" not "Click here to submit your inquiry to our team."
- **Specific over vague.** Error: "That didn't go through. Try again." not "Something went wrong."
- **Active over passive.** "Update your password" not "Your password should be updated."
- **No emoji in product copy.** Status icons (⊙ ✓ ⚠) are acceptable, but no 🎉/👍/😊.
- **Sentence case everywhere.** "Create listing" not "Create Listing", not "CREATE LISTING."

### Reference table

| Context | Don't say | Do say |
|---|---|---|
| Successful inquiry submit | "We're excited! Your inquiry has been submitted! 🎉" | "Inquiry submitted. We'll be in touch within 4 hours." |
| Form validation | "Oops! Please check your input." | "Email format is wrong." |
| Empty wishlist | "Sorry, your wishlist is empty!" | "Nothing saved. Browse the catalog to save listings." |
| Server error | "An unexpected error occurred. Please try again." | "That didn't go through. Try again." |
| Search no results | "Sorry, we couldn't find any matches!" | "No matches. Try removing a filter." |
| Verification pending | "Please be patient while we review your account!" | "Submitted for verification. We'll come back within 1 business day." |

## 12. Onboarding Cues

Not a separate flow; cues are sprinkled in the regular UI.

- **First login (just-verified user):** Toast at top: "You're verified. Catalog is open." with link.
- **First-time visiting Catalog:** A subtle inline hint above the filter rail: "Filter by channel or date to narrow the catalog." Dismissible.
- **First inquiry created:** After submit, redirect to inquiry detail with a one-time inline tip on the right of the chat widget: "The platform team responds within 4 business hours. We'll email when there's news." Dismissible.
- **First admin login:** 2FA setup flow integrated into post-login redirect. Cannot skip.

## 13. Open UX Questions

To resolve before specific implementation phases:

1. **Catalog sort default** — newest first, or soonest-availability first? Defaulted to newest in this design; can A/B test post-launch.
2. **Inquiry status pill colors** — currently: lime for Confirmed, info for In Progress, warning for Awaiting You / Awaiting Publisher, danger for Lost, neutral text for Cancelled. Acceptable to project owner?
3. **Mobile admin** — current decision is desktop-only banner. Phase 2 may need a mobile-friendly Inquiry Queue at minimum, since admins might triage on phone.
4. **Logo placeholder** — final logo TBD. Wordmark "ADVERTISING." with lime period is the design-stable placeholder.

---

**End of UX design document.**
