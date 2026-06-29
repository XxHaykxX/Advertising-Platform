import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — AD PLACEMENT",
  robots: { index: false, follow: false },
};

/* Bare admin wrapper (no marketing header/footer/smooth-scroll). The
   authenticated panel shell with navigation lives in (panel)/layout.tsx. */
export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="min-h-screen bg-[#0b0b0b] text-foreground">{children}</div>;
}
