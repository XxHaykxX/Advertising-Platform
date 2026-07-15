import { notFound, redirect } from "next/navigation";
import { requireMember } from "@/lib/auth/require";
import { getLocale } from "@/lib/data/locale";
import { getBrandProfile } from "@/lib/data/brand-profile";
import { makeUI } from "@/lib/i18n";
import { ProfileForm } from "./profile-form";
import { DownloadDataButton } from "./download-data-button";

/** "My Profile" — the BRAND member's editable profile (#23): company,
 *  website, brand categories, budget range, plus a JSON data export. */
export default async function BrandProfilePage() {
  const user = await requireMember();
  if (user.role !== "BRAND") redirect("/account");

  const locale = await getLocale();
  const t = makeUI(locale);
  const profile = await getBrandProfile(user.id);
  if (!profile) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground md:text-3xl">{t("account.brand.navProfile")}</h1>
      <p className="mt-2 text-muted-foreground">{t("account.brand.profileSubtitle")}</p>

      <ProfileForm profile={profile} locale={locale} />

      <div className="mt-6 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">{t("account.brand.yourDataSection")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("account.brand.yourDataBody")}</p>
        <div className="mt-4">
          <DownloadDataButton label={t("account.brand.downloadData")} />
        </div>
      </div>
    </div>
  );
}
