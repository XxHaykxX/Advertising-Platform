import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/components/footer";
import { PageHero } from "@/components/ui/page-hero";
import { ContactForm } from "@/components/contact-page/contact-form";
import { ContactMethods } from "@/components/contact-page/contact-methods";
import { getProjects } from "@/lib/data/projects";
import { getLocale } from "@/lib/data/locale";
import { getCurrency } from "@/lib/data/currency";
import { makeUI } from "@/lib/i18n";

export const metadata = {
  title: "Contact — iGovazd",
  description: "Get in touch with iGovazd. We're here to help with your brand placement needs.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const locale = await getLocale();
  const currency = await getCurrency();
  const projects = await getProjects(locale, currency);
  const t = makeUI(locale);

  return (
    <>
      <SiteHeader />

      <PageHero title={t("contactPage.title")} subtitle={t("contactPage.subtitle")} locale={locale} />

      <main className="relative min-h-screen bg-background">
        {/* Subtle decorative background */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-gradient-to-br from-primary/5 to-transparent blur-3xl" />
          <div className="absolute top-1/2 -left-32 h-80 w-80 rounded-full bg-gradient-to-tr from-primary/3 to-transparent blur-3xl" />
        </div>

        <div className="relative z-10">
          {/* Two-column layout */}
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2">
              {/* Left: Contact Methods */}
              <ContactMethods locale={locale} />

              {/* Right: Contact Form */}
              <ContactForm projects={projects} locale={locale} />
            </div>
          </div>
        </div>
      </main>
      <Footer locale={locale} currency={currency} />
    </>
  );
}
