import { SiteHeader } from "@/components/site-header";
import { OrganizationJsonLd } from "@/components/organization-json-ld";
import { Hero } from "@/components/hero";
import { AdTypes } from "@/components/ad-types";
import { WhyUs } from "@/components/why-us";
import { HomePartners } from "@/components/home-partners";
import { HomeTestimonials } from "@/components/home-testimonials";
import { HomeGoals } from "@/components/home-goals";
import { HomeCta } from "@/components/home-cta";
import { Footer } from "@/components/footer";
import { getPartners } from "@/lib/data/partners";
import { getTestimonials } from "@/lib/data/testimonials";
import { getLocale } from "@/lib/data/locale";
import { getCurrency } from "@/lib/data/currency";
import { signupCtaHref } from "@/lib/auth/signup-cta";

/* The homepage, rebuilt 2026-08-18 to the brief: say what the site is for,
 * show the four ways to advertise, argue why here, prove it with the channels
 * and the campaigns that ran, then ask.
 *
 * What left, and where it went — none of it was deleted, all of it has a page:
 *   Trust (two stat tiles)  — the brief has no numbers section, and the claims
 *                             ("50+ partners") sat directly above a logo strip
 *                             that shows the real count.
 *   HowItWorks              — /how-it-works
 *   Featured (six projects) — the four type cards are the way into inventory
 *                             now; a films-only shelf on a page selling
 *                             billboards was answering a question nobody asked
 *                             here.
 *   GetStarted              — the hero's own sign-up button, and the closing
 *                             CTA below, both did this already.
 *   Faq                     — /faq, which the footer already links to.
 *   HomeCases (3 cases)     — replaced by the video testimonials below it
 *                             (2026-08-18): two proof blocks back to back read
 *                             as one long shelf, and a client saying it beats a
 *                             metric tile. The cases themselves live on
 *                             /portfolio and keep their admin section.
 */
export default async function Home() {
  const locale = await getLocale();
  const currency = await getCurrency();
  // Both are small tables staff edits by hand; neither is cached, same as
  // /about and /portfolio, which read them the same way. The page is dynamic
  // regardless — it reads the locale cookie.
  const [partners, testimonials, signupHref] = await Promise.all([
    getPartners(),
    getTestimonials(locale),
    signupCtaHref("brand"),
  ]);

  return (
    <>
      <OrganizationJsonLd />
      <SiteHeader />
      <main>
        <Hero locale={locale} signupHref={signupHref} />
        <AdTypes locale={locale} />
        <WhyUs locale={locale} />
        {/* Both of these render nothing until staff has filled them in, so the
            page closes on the CTA either way rather than on an empty frame. */}
        <HomePartners partners={partners} locale={locale} />
        <HomeTestimonials items={testimonials} locale={locale} />
        {/* The goals and the CTA are one section of the brief: name the task,
            then send the brief. The CTA's heading covers both. */}
        <HomeGoals locale={locale} />
        <HomeCta locale={locale} />
      </main>
      <Footer locale={locale} currency={currency} />
    </>
  );
}
