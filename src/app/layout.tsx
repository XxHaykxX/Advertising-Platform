import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SmoothScroll } from "@/components/smooth-scroll";
import { getLocale } from "@/lib/data/locale";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  // Armenian glyphs fall back to system fonts; latin+cyrillic cover en/ru.
  subsets: ["latin", "cyrillic"],
});

// Armenian (hy) share copy, matching the site's default locale and the hero
// strings in src/lib/i18n.ts. The og:image / twitter:image are supplied
// automatically by app/opengraph-image.tsx (Next file convention).
const OG_TITLE = "iGovazd — Բրենդային տեղադրման շուկա";
const OG_DESCRIPTION =
  "Կապում ենք բրենդներին կինոնախագծերի և սերիալների հետ՝ տեսարան առ տեսարան տեղադրման հաշվետվությունների միջոցով։";

export const metadata: Metadata = {
  metadataBase: new URL("https://igovazd.am"),
  title: "iGovazd — Brand Placement Marketplace",
  description:
    "Discover and place your brand in film and TV productions — scene-level placement insights, transparent pricing, direct access to filmmakers.",
  alternates: { canonical: "/" },
  // Site-wide noindex — kept OFF the index until the owner explicitly says to
  // enable it. Remove this (and app/robots.ts disallow) to go public. noindex
  // does not affect social link unfurl — Telegram/FB/X still read OG tags.
  robots: { index: false, follow: false },
  openGraph: {
    type: "website",
    siteName: "iGovazd",
    locale: "hy_AM",
    url: "https://igovazd.am",
    title: OG_TITLE,
    description: OG_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: OG_TITLE,
    description: OG_DESCRIPTION,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <body className={`${inter.variable} font-sans antialiased`}>
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
