// Tiny, safe markdown-ish renderer for the project Description (#11). The admin
// About block stores Description as PLAIN TEXT with a minimal markdown subset;
// the public report page renders it through this helper.
//
// Security: the input is HTML-escaped FIRST, so no raw HTML (or <script>) can
// ever reach the DOM. Only a fixed, closed set of transforms then runs on the
// already-escaped text — bold, italic, links (http/https only, which blocks
// javascript: URIs) and line breaks. The result is safe to hand to
// dangerouslySetInnerHTML.
export function renderRichText(input: string): string {
  if (!input) return "";

  // 1. Escape every HTML-significant character up front.
  const escaped = input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  let out = escaped;

  // 2. Links: [text](url) — only http(s) URLs are accepted, so javascript:/data:
  //    can never slip through. `text` is already escaped.
  out = out.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    (_m, text: string, url: string) =>
      `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-primary underline underline-offset-2 hover:opacity-80">${text}</a>`,
  );

  // 3. Bold (**…**) before italic (*…*) so the double markers win.
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");

  // 4. Line breaks.
  out = out.replace(/\r?\n/g, "<br />");

  return out;
}
