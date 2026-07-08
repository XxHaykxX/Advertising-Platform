// Escape characters that could break out of the <script> context or be
// interpreted as HTML (e.g. a literal "</script>" inside a content string).
function escapeJsonLd(json: string): string {
  return json
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "iGovazd",
    url: "https://igovazd.am",
    description:
      "Brand placement marketplace connecting brands with film & TV productions through scene-level, brand-safe placement reports.",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: escapeJsonLd(JSON.stringify(data)) }}
    />
  );
}
