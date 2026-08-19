import { DEFAULT_LOCALE, makeUI, type Locale } from "@/lib/i18n";
import { mediaUrl } from "@/lib/media-url";

/** Normalize a YouTube/Vimeo watch URL into its embeddable form. Recognized
 *  providers are rewritten to their /embed player; any other http(s) URL is
 *  passed through as-is (so a direct embed link still works). Anything that
 *  isn't http(s) — e.g. a `javascript:` URI — returns null and is not embedded. */
export function toEmbedUrl(raw: string): string | null {
  const url = (raw || "").trim();
  if (!url) return null;

  // YouTube: watch?v=ID, youtu.be/ID, shorts/ID, or an existing /embed/ID.
  // Strip as much YouTube chrome as the embed allows: no control bar
  // (controls=0), no related-video overlay / "More videos" (rel=0), no
  // annotations (iv_load_policy=3), reduced logo (modestbranding=1), inline
  // playback, and the privacy-friendly nocookie host. YouTube still shows a
  // small logo — it can't be fully removed on an embed; a truly brand-free
  // player needs a self-hosted MP4.
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  if (yt) {
    return `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0&modestbranding=1&iv_load_policy=3&playsinline=1&controls=0&disablekb=1`;
  }

  // Vimeo: vimeo.com/ID or player.vimeo.com/video/ID — hide title/byline/portrait.
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}?title=0&byline=0&portrait=0`;

  // Any other embeddable http(s) URL — trust staff input, but reject non-http
  // schemes so a crafted value can't inject a javascript:/data: iframe src.
  if (/^https?:\/\//i.test(url)) return url;
  return null;
}

/** Video block for the report/detail page (#10). Prefers the embed link; falls
 *  back to an uploaded MP4; renders nothing when neither is set. Responsive 16:9. */
export function ReportVideo({
  embedUrl,
  file,
  title,
  locale = DEFAULT_LOCALE,
}: {
  embedUrl: string;
  file: string;
  title: string;
  locale?: Locale;
}) {
  const t = makeUI(locale);
  const embed = embedUrl ? toEmbedUrl(embedUrl) : null;
  if (!embed && !file) return null;

  return (
    <section className="pb-4">
      <div className="mx-auto w-full max-w-[1200px] px-6 max-sm:px-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.15em] text-primary">
          {t("report.video")}
        </h2>
        <div className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-black">
          {embed ? (
            <iframe
              src={embed}
              title={title}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
            />
          ) : (
            <video
              controls
              preload="metadata"
              src={mediaUrl(file)}
              className="absolute inset-0 h-full w-full"
            />
          )}
        </div>
      </div>
    </section>
  );
}
