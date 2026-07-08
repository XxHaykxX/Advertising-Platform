import { Mail, MessageCircle, Phone, Send } from "lucide-react";
import { DEFAULT_LOCALE, makeUI, type Locale } from "@/lib/i18n";

const methods = [
  {
    icon: Mail,
    labelKey: "contactPage.methodEmail",
    value: "hello@igovazd.am",
    href: "mailto:hello@igovazd.am",
  },
  {
    icon: Phone,
    labelKey: "contactPage.methodPhone",
    value: "+374 00 000 000",
    href: "tel:+37400000000",
  },
  {
    icon: Send,
    labelKey: "contactPage.methodTelegram",
    value: "@igovazd",
    href: "https://t.me/igovazd",
  },
  {
    icon: MessageCircle,
    labelKey: "contactPage.methodWhatsApp",
    value: "+374 00 000 000",
    href: "https://wa.me/37400000000",
  },
];

export function ContactMethods({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const t = makeUI(locale);
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="mb-2 text-2xl font-bold text-foreground">{t("contactPage.methodsTitle")}</h2>
        <p className="text-muted-foreground">
          {t("contactPage.methodsSubtitle")}
        </p>
      </div>

      <div className="grid gap-4">
        {methods.map((method) => {
          const Icon = method.icon;
          return (
            <a
              key={method.labelKey}
              href={method.href}
              target={method.href.startsWith("http") ? "_blank" : undefined}
              rel={method.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-6 transition-all card-lift hover:border-primary/50"
            >
              <div className="mt-1 shrink-0 rounded-xl bg-primary/10 p-3">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground">{t(method.labelKey)}</h3>
                <p className="mt-1 break-all text-sm text-muted-foreground group-hover:text-primary transition-colors">
                  {method.value}
                </p>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
