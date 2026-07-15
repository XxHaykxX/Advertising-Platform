import Link from "next/link";
import { redirect } from "next/navigation";
import { FileUp, FolderKanban, LogOut } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { requireMember } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";
import { logout } from "./actions";

/* #16: for CREATOR members the two placeholder cards below became live links
   into the "submit project" / "my projects" flow (account/projects/*). BRAND
   members are unaffected — they still get the catalog-browse card. */

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

export default async function AccountPage() {
  const user = await requireMember();
  // F13: BRAND members have a full cabinet at /account/brand (browse / interests /
  // profile) that was otherwise unreachable — no nav link pointed to it. Send them
  // straight there so express-interest & recommendations are actually usable.
  if (user.role === "BRAND") redirect("/account/brand");
  const [locale, dbUser, projectsCount] = await Promise.all([
    getLocale(),
    prisma.user.findUnique({ where: { id: user.id }, select: { company: true } }),
    user.role === "CREATOR" ? prisma.project.count({ where: { ownerId: user.id } }) : Promise.resolve(0),
  ]);
  const t = makeUI(locale);
  // BRAND is redirected to /account/brand above, so this page is CREATOR-only.
  const roleLabel = t("account.roleCreator");

  return (
    <Section>
      <Container>
        <Reveal>
          <h1 className="text-3xl font-bold text-foreground md:text-4xl">{t("account.title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("account.welcome", { name: user.name })}</p>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Profile card */}
          <Reveal className="lg:col-span-1">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">{t("account.profile")}</h2>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {t("account.statusApproved")}
                </span>
              </div>
              <div className="mt-4">
                <ProfileRow label={t("form.name")} value={user.name} />
                <ProfileRow label={t("form.email")} value={user.email} />
                <ProfileRow label={t("account.company")} value={dbUser?.company || "—"} />
                <ProfileRow label={t("register.accountType")} value={roleLabel} />
              </div>

              <form action={logout} className="mt-6">
                <Button type="submit" variant="secondary" size="md" className="w-full gap-2">
                  <LogOut className="h-4 w-4" />
                  {t("account.logout")}
                </Button>
              </form>
            </div>
          </Reveal>

          {/* Creator content (BRAND is redirected to /account/brand above) */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:col-span-2">
            {(
              <>
                <Reveal delay={0.05}>
                  <div className="flex h-full flex-col items-start rounded-2xl border border-border bg-card p-6">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                      <FileUp className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-foreground">
                      {t("account.submitProject")}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t("account.submitProjectSubtitle")}
                    </p>
                    <Button asChild variant="primary" size="md" className="mt-6">
                      <Link href="/account/projects/new">{t("account.submitProject")}</Link>
                    </Button>
                  </div>
                </Reveal>
                <Reveal delay={0.1}>
                  <div className="flex h-full flex-col items-start rounded-2xl border border-border bg-card p-6">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                      <FolderKanban className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-foreground">
                      {t("account.myProjects")}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {projectsCount > 0
                        ? t("account.projectsCount", { count: projectsCount })
                        : t("account.noProjects")}
                    </p>
                    <Button asChild variant="secondary" size="md" className="mt-6">
                      <Link href="/account/projects">{t("account.myProjects")}</Link>
                    </Button>
                  </div>
                </Reveal>
              </>
            )}
          </div>
        </div>
      </Container>
    </Section>
  );
}
