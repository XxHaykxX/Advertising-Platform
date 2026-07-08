export function parseStringArray(json: string | null): string[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function splitCountries(s: string): string[] {
  if (!s) return [];
  return s
    .split(", ")
    .map((c) => c.trim())
    .filter(Boolean);
}

export function moneyShort(n: number): string {
  return `$${n.toLocaleString("en-US")}`;
}

export function sumExposure(opps: { estValue: number }[]): number {
  return opps.reduce((sum, o) => sum + o.estValue, 0);
}
