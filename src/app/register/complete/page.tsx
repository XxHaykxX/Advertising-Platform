import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { verifyPendingGoogle, G_PENDING_COOKIE } from "@/lib/auth/google";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";
import { CompleteForm } from "./complete-form";

/** Profile-completion step after a Google sign-up: the verified name/email come
   from the signed g_pending cookie; the user only picks an account type. */
export default async function CompleteRegisterPage() {
  const c = await cookies();
  const pending = await verifyPendingGoogle(c.get(G_PENDING_COOKIE)?.value);
  if (!pending) redirect("/register");

  const locale = await getLocale();
  const t = makeUI(locale);

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

          <h1 className="text-center text-2xl font-bold text-foreground">{t("register.completeTitle")}</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">{t("register.completeBody")}</p>

          <CompleteForm locale={locale} name={pending.name} email={pending.email} />
        </div>
      </Container>
    </section>
  );
}
