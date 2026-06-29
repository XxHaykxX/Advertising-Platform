/* Renders a JSON-LD <script> for structured data (schema.org). Server-safe.
   Pass a plain object (or @graph) and it is serialized verbatim. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  // Escape characters that could break out of the <script> context or be
  // interpreted as HTML (e.g. a literal "</script>" inside a content string).
  const json = JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
