import Link from "next/link";
import { Container } from "@/components/ui/container";
import { redirect } from "next/navigation";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";
import { googleConfigured } from "@/lib/auth/google";
import { loadCurrentMember } from "@/lib/auth/require";
import { safeMemberRedirect } from "@/lib/auth/member-paths";
import { LoginForm } from "./login-form";

/* Own canonical: without it every auth screen inherited the root layout's
   `alternates: { canonical: "/" }` (QA pass, 2026-08-14). */
export const metadata = {
  title: "Sign in — iGovazd",
  alternates: { canonical: "/login" },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; error?: string; from?: string }>;
}) {
  const { status, error, from } = await searchParams;

  // Already signed in as a member → the sign-in form is a dead end; /account
  // routes each side to its own cabinet. loadCurrentMember (not
  // loadCurrentUser) on purpose: a staff session in the same browser must
  // still be able to reach this form and open the member cabinet next to it.
  //
  // ?from= is honoured here, not just by the action (IA-32 + IA-53, 2026-08-12).
  // Signing in RE-RENDERS this page — the action sets the session cookie, Next
  // revalidates the route it was called from, and this gate then fires with a
  // live member session and navigates to /account, beating the form's own
  // `window.location.assign(state.redirect)`. So a guest who clicked "sign in"
  // from a project page landed in the cabinet after all, exactly the bug IA-32
  // closed. Both paths now resolve the same destination, so whichever wins the
  // race is the right one.
  if (await loadCurrentMember()) redirect(safeMemberRedirect(from ?? null) ?? "/account");

  const locale = await getLocale();
  const t = makeUI(locale);
  const notice =
    error === "google"
      ? t("login.errGoogle")
      : status === "pending"
        ? t("login.errPending")
        : status === "blocked"
          ? t("login.errBlocked")
          : status === "rejected"
            ? t("login.errRejected")
            : undefined;
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

          <h1 className="text-center text-2xl font-bold text-foreground">{t("login.title")}</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {t("login.subtitle")}
          </p>

          <LoginForm locale={locale} googleEnabled={googleConfigured()} notice={notice} from={from} />

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("login.noAccount")}{" "}
            {/* Carry ?from= into sign-up too: a guest who clicked Apply on an
                offer card has no account yet more often than not, and this
                link used to drop their destination on the floor — they
                registered and landed in the cabinet with the offer lost. */}
            <Link
              href={from ? `/register?from=${encodeURIComponent(from)}` : "/register"}
              className="font-medium text-primary hover:underline"
            >
              {t("login.registerLink")}
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}
