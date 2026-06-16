import type { Metadata } from "next";
import { Inter, Noto_Sans_Armenian } from "next/font/google";
import "./globals.css";
import { getLocale } from "@/lib/data/locale";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const notoArmenian = Noto_Sans_Armenian({
  variable: "--font-armenian",
  subsets: ["armenian"],
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "AD PLACEMENT — product placement в фильмах",
    template: "%s — AD PLACEMENT",
  },
  description:
    "Витрина будущих фильмов и проектов для размещения рекламы. Забронируйте product placement заранее.",
  openGraph: {
    type: "website",
    siteName: "AD PLACEMENT",
    title: "AD PLACEMENT — product placement в фильмах",
    description:
      "Витрина будущих фильмов и проектов для размещения рекламы. Забронируйте product placement заранее.",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "AD PLACEMENT — product placement в фильмах",
    description:
      "Витрина будущих фильмов для размещения рекламы. Забронируйте placement заранее.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      className={`dark ${inter.variable} ${notoArmenian.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
