// Portfolio case metrics are stored as a free-form JSON object (see
// PortfolioDTO.metrics). Keys vary per case (views, recall, ctr, ...), so we
// parse defensively and derive a human label from the key instead of hardcoding.

export function parseMetrics(json: string): Record<string, string> {
  try {
    const parsed: unknown = JSON.parse(json);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return Object.fromEntries(
        Object.entries(parsed as Record<string, unknown>).filter(
          (entry): entry is [string, string] => typeof entry[1] === "string",
        ),
      );
    }
  } catch {
    // malformed metrics JSON — treat as empty
  }
  return {};
}

export function formatMetricLabel(key: string): string {
  const words = key.replace(/([A-Z])/g, " $1").trim().split(" ");
  return words
    .map((w) => (w.length <= 3 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}
