import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

// Branded social-share card (Telegram/FB/X/WhatsApp link unfurl). Rendered via
// next/og (Satori) — self-contained, no external asset fetch at runtime. The
// file-convention name auto-wires this into both og:image and twitter:image for
// every route that doesn't define its own. Copy is English; the "Armenian"
// eyebrow anchors the positioning. Noto Sans (Latin) is bundled in public/fonts
// and read via fs so the type renders consistently.
export const alt = "iGovazd — Armenian Brand Placement Marketplace";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INDIGO = "#4f46e5";
const FONT_DIR = join(process.cwd(), "public/fonts");
const font = (file: string) => readFileSync(join(FONT_DIR, file));

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "62px 80px",
          background:
            "radial-gradient(1000px 600px at 78% -10%, rgba(79,70,229,0.42), transparent 60%), linear-gradient(135deg, #0a0a12 0%, #101024 100%)",
          color: "#ffffff",
        }}
      >
        {/* Brand row (top) */}
        <div style={{ display: "flex", alignItems: "center", gap: "26px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "104px",
              height: "104px",
              borderRadius: "24px",
              background: INDIGO,
              fontSize: "54px",
              fontWeight: 700,
              boxShadow: "0 20px 60px rgba(79,70,229,0.55)",
            }}
          >
            iG
          </div>
          <div style={{ display: "flex", fontSize: "58px", fontWeight: 700, letterSpacing: "-1.5px" }}>
            iGovazd
          </div>
        </div>

        {/* Main text block — anchored under the brand with a fixed gap; footer
            is pushed to the bottom, so the vertical rhythm is deliberate rather
            than distributed. Eyebrow hugs the headline (they read as one unit);
            the subtitle gets a clearly larger gap. */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: "64px",
          }}
        >
          <div style={{ display: "flex", fontSize: "68px", fontWeight: 700, lineHeight: 1.06, letterSpacing: "-1.5px", maxWidth: "1010px" }}>
            Armenian Brand Placement Marketplace
          </div>
          <div
            style={{
              display: "flex",
              marginTop: "28px",
              fontSize: "30px",
              fontWeight: 400,
              color: "#c7d2fe",
              lineHeight: 1.4,
              maxWidth: "960px",
            }}
          >
            Place your brand in film &amp; TV productions — scene-level insights, transparent pricing, direct access to filmmakers.
          </div>
        </div>

        {/* Footer strip (bottom) */}
        <div style={{ display: "flex", alignItems: "center", gap: "18px", marginTop: "auto" }}>
          <div style={{ display: "flex", width: "52px", height: "6px", borderRadius: "3px", background: INDIGO }} />
          <div style={{ display: "flex", fontSize: "29px", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.5px" }}>
            igovazd.am
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "NotoSans", data: font("NotoSans-Regular.ttf"), weight: 400, style: "normal" },
        { name: "NotoSans", data: font("NotoSans-Bold.ttf"), weight: 700, style: "normal" },
      ],
    },
  );
}
