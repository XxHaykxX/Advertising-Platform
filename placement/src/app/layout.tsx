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

export const metadata: Metadata = {
  metadataBase: new URL("https://igovazd.am"),
  title: "iGovazd — Brand Placement Marketplace",
  description:
    "Discover and place your brand in film and TV productions — scene-level placement insights, transparent pricing, direct access to filmmakers.",
  alternates: { canonical: "/" },
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
