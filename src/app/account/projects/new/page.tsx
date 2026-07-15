import { redirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { requireMember } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";
import { ProjectSubmitForm } from "./project-submit-form";

/** "Подать проект" — a CREATOR's lightweight submission form. BRAND members
 *  have no reason to be here — bounce them back to /account (same guard as
 *  the "My projects" list at /account/projects). */
export default async function NewProjectPage() {
  const user = await requireMember();
  if (user.role !== "CREATOR") redirect("/account");

  const locale = await getLocale();
  const t = makeUI(locale);

  // Gates the "logo" checkbox in the poster generator panel (#26).
  const me = await prisma.user.findUnique({ where: { id: user.id }, select: { avatar: true } });

  return (
    <Section>
      <Container className="max-w-2xl">
        <Reveal>
          <h1 className="text-3xl font-bold text-foreground md:text-4xl">
            {t("account.submitProject")}
          </h1>
          <p className="mt-2 text-muted-foreground">{t("account.submitProjectSubtitle")}</p>
        </Reveal>

        <Reveal delay={0.05}>
          <ProjectSubmitForm locale={locale} hasAvatar={!!me?.avatar} />
        </Reveal>
      </Container>
    </Section>
  );
}
