import { redirect } from "next/navigation";
import { requireMember } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";
import { ProfileForm } from "./profile-form";

/** CREATOR "My Profile" — edit display name + avatar. Renders bare (the
 *  account/layout.tsx creator shell supplies the Container + sidebar). BRAND
 *  members have their own profile at /account/brand/profile — bounce them. */
export default async function CreatorProfilePage() {
  const user = await requireMember();
  if (user.role !== "CREATOR") redirect("/account/brand");

  const locale = await getLocale();
  const t = makeUI(locale);
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, email: true, avatar: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground md:text-3xl">{t("account.profile")}</h1>
      <p className="mt-2 text-muted-foreground">{t("account.profile.subtitle")}</p>

      <ProfileForm
        name={dbUser?.name ?? user.name}
        email={dbUser?.email ?? user.email}
        avatar={dbUser?.avatar ?? ""}
        locale={locale}
      />
    </div>
  );
}
