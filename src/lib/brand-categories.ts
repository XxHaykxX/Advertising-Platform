/** Master category list for the BRAND profile's "Brand Categories" multi-
 *  select (#23 — brand cabinet). Mirrors the pattern of src/lib/genres.ts:
 *  a free-text-friendly closed list, not a DB-level enum. Values are stored
 *  as a JSON string[] on User.brandCategories.
 *
 *  Deliberately matches the "category.*" keys already sitting unused in
 *  src/lib/i18n.ts (UI dict) — those were pre-seeded for exactly this list,
 *  so every value here is already localized via
 *  `localizeValue(locale, "category", value)` with zero new i18n.ts edits. */
export const BRAND_CATEGORIES: string[] = [
  "Automotive",
  "Beverages",
  "Food & Beverages",
  "Footwear",
  "Home & Living",
  "Kids Apparel",
  "Media",
  "Sportswear",
  "Technology",
  "Travel & Luggage",
];

export type BudgetRangeOption = { value: string; label: string };

/** Budget-range options for the BRAND profile's "Budget Range" select.
 *  Stored verbatim as User.budgetRange (free string, not an enum). */
export const BUDGET_RANGES: BudgetRangeOption[] = [
  { value: "<1M", label: "< 1,000,000 AMD" },
  { value: "1-5M", label: "1,000,000 – 5,000,000 AMD" },
  { value: "5-20M", label: "5,000,000 – 20,000,000 AMD" },
  { value: "20M+", label: "20,000,000+ AMD" },
];
