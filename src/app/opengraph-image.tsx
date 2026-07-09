import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

// Branded social-share card (Telegram/FB/X/WhatsApp link unfurl). Rendered via
// next/og (Satori) — self-contained, no external asset fetch at runtime. The
// file-convention name auto-wires this into both og:image and twitter:image for
// every route that doesn't define its own.
//
// Copy is Armenian (site default locale hy), pulled from the real hero strings
// in src/lib/i18n.ts. Satori's default font has no Armenian glyphs, so both a
// Latin family (Noto Sans, for the "iGovazd" wordmark) and an Armenian family
// (Noto Sans Armenian, for the headline/subtitle) are loaded from public/fonts;
// Satori falls back per-glyph across the loaded fonts.
export const alt = "iGovazd — Բրենդային տեղադրման շուկա";
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
          justifyContent: "space-between",
          padding: "72px 80px",
          background:
            "radial-gradient(1000px 600px at 78% -10%, rgba(79,70,229,0.42), transparent 60%), linear-gradient(135deg, #0a0a12 0%, #101024 100%)",
          color: "#ffffff",
        }}
      >
        {/* Brand row */}
        <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "116px",
              height: "116px",
              borderRadius: "26px",
              background: INDIGO,
              fontSize: "60px",
              fontWeight: 700,
              boxShadow: "0 20px 60px rgba(79,70,229,0.55)",
            }}
          >
            iG
          </div>
          <div style={{ display: "flex", fontSize: "72px", fontWeight: 700, letterSpacing: "-2px" }}>
            iGovazd
          </div>
        </div>

        {/* Headline + subtitle (Armenian) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
          <div style={{ display: "flex", fontSize: "68px", fontWeight: 700, lineHeight: 1.12, letterSpacing: "-1px" }}>
            Բրենդային տեղադրման շուկա
          </div>
          <div style={{ display: "flex", fontSize: "34px", fontWeight: 400, color: "#c7d2fe", lineHeight: 1.35, maxWidth: "980px" }}>
            Կապում ենք բրենդներին կինոնախագծերի և սերիալների հետ
          </div>
        </div>

        {/* Footer strip */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ display: "flex", width: "56px", height: "6px", borderRadius: "3px", background: INDIGO }} />
          <div style={{ display: "flex", fontSize: "30px", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.5px" }}>
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
        { name: "NotoArm", data: font("NotoSansArmenian-Regular.ttf"), weight: 400, style: "normal" },
        { name: "NotoArm", data: font("NotoSansArmenian-Bold.ttf"), weight: 700, style: "normal" },
      ],
    },
  );
}
