import Link from "next/link";
import { Container } from "@/components/ui/container";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";
import { redirect } from "next/navigation";
import { googleConfigured } from "@/lib/auth/google";
import { loadCurrentMember } from "@/lib/auth/require";
import { safeMemberRedirect } from "@/lib/auth/member-paths";
import { RegisterForm } from "./register-form";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; from?: string }>;
}) {
  // ?role=creator comes from the "List your project" CTA — anything else falls
  // back to the brand tab, which is the default entry point.
  const { role, from } = await searchParams;
  // A signed-in member clicking "List your project" (/for-creators hero,
  // footer, final CTA — every one of them points here) used to land on the
  // registration form they had already filled in. Guarding the page instead of
  // each link keeps the CTAs to one href.
  //
  // ?from= is honoured for the same reason as on /login (see that page): the
  // register action sets the session cookie, Next re-renders this route, and
  // this gate would otherwise navigate to /account and beat the form's own
  // redirect — losing the offer the guest was signing up to apply for.
  if (await loadCurrentMember()) redirect(safeMemberRedirect(from ?? null) ?? "/account");

  const locale = await getLocale();
  const t = makeUI(locale);
  const googleEnabled = googleConfigured();
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden py-20">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute left-1/2 top-[-10%] h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <Container className="flex justify-center">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 card-lift">
          <Link href="/" className="mb-8 block text-center text-lg font-bold text-foreground">
            <span className="text-primary">i</span>Govazd
          </Link>

          <h1 className="text-center text-2xl font-bold text-foreground">{t("register.title")}</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {t("register.subtitle")}
          </p>

          <RegisterForm
            locale={locale}
            googleEnabled={googleEnabled}
            initialType={role === "creator" ? "creator" : "brand"}
            from={from}
          />

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("register.alreadyHaveAccess")}{" "}
            {/* Carries ?from= (2026-08-11) — this is also where the
                errEmailTaken message above sends someone whose address
                already has an account: straight to the sign-in they need,
                without losing the page they started from. */}
            <Link
              href={from ? `/login?from=${encodeURIComponent(from)}` : "/login"}
              className="font-medium text-primary hover:underline"
            >
              {t("register.signIn")}
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}
