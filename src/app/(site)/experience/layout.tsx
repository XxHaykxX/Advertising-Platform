import type { Metadata } from "next";

// Demo/experimental 3D route — keep it out of search indexes.
export const metadata: Metadata = {
  title: "Experience",
  robots: { index: false, follow: false },
};

export default function ExperienceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
