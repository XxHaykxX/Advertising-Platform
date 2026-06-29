import type { Metadata } from "next";

// Demo/experimental sequence-scrub route — keep it out of search indexes.
export const metadata: Metadata = {
  title: "Hero scroll",
  robots: { index: false, follow: false },
};

export default function HeroScrollLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
