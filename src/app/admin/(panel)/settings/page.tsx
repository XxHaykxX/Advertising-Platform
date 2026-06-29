import { getSettings } from "@/lib/data/settings";
import { PasswordForm } from "./password-form";
import { ContactsForm } from "./contacts-form";
import { LangForm } from "./lang-form";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>
      <p className="mt-1 text-sm text-white/55">Contacts, social links, language and password.</p>

      <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="mb-5 text-sm font-semibold uppercase tracking-[0.15em] text-primary">
          Site language
        </h2>
        <LangForm current={settings["default_lang"] ?? "ru"} />
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="mb-5 text-sm font-semibold uppercase tracking-[0.15em] text-primary">
          Contacts &amp; socials
        </h2>
        <ContactsForm values={settings} />
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="mb-5 text-sm font-semibold uppercase tracking-[0.15em] text-primary">
          Password
        </h2>
        <PasswordForm />
      </section>
    </div>
  );
}
