import type { PortfolioDTO } from "@/lib/types";

// Escape characters that could break out of the <script> context or be
// interpreted as HTML (e.g. a literal "</script>" inside a content string).
function escapeJsonLd(json: string): string {
  return json
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

export function PortfolioJsonLd({ cases }: { cases: PortfolioDTO[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "FP Placement Case Studies",
    itemListElement: cases.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "CreativeWork",
        name: c.title,
        description: c.description,
        ...(c.image ? { image: c.image } : {}),
        brand: { "@type": "Brand", name: c.brand },
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: escapeJsonLd(JSON.stringify(data)) }}
    />
  );
}
