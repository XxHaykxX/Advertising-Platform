import { SmoothScroll } from "@/components/smooth-scroll";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getContacts } from "@/lib/data/settings";
import { getContent } from "@/lib/data/content";
import { getLocale } from "@/lib/data/locale";

/* Public marketing site chrome: smooth scroll + header + footer. */
export default async function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const [contacts, t] = await Promise.all([getContacts(), getContent(locale)]);

  return (
    <SmoothScroll>
      <SiteHeader contacts={contacts} locale={locale} />
      {children}
      <SiteFooter contacts={contacts} tagline={t["footer.tagline"]} locale={locale} />
    </SmoothScroll>
  );
}
