import { Mail, MessageCircle, Phone, Send } from "lucide-react";

const methods = [
  {
    icon: Mail,
    label: "Email",
    value: "hello@fpplacement.com",
    href: "mailto:hello@fpplacement.com",
  },
  {
    icon: Phone,
    label: "Phone",
    value: "+374 00 000 000",
    href: "tel:+37400000000",
  },
  {
    icon: Send,
    label: "Telegram",
    value: "@fpplacement",
    href: "https://t.me/fpplacement",
  },
  {
    icon: MessageCircle,
    label: "WhatsApp",
    value: "+374 00 000 000",
    href: "https://wa.me/37400000000",
  },
];

export function ContactMethods() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="mb-2 text-2xl font-bold text-foreground">Contact Methods</h2>
        <p className="text-muted-foreground">
          Reach out to us through any of these channels. We typically respond within 24 hours.
        </p>
      </div>

      <div className="grid gap-4">
        {methods.map((method) => {
          const Icon = method.icon;
          return (
            <a
              key={method.label}
              href={method.href}
              target={method.href.startsWith("http") ? "_blank" : undefined}
              rel={method.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-6 transition-all card-lift hover:border-primary/50"
            >
              <div className="mt-1 shrink-0 rounded-xl bg-primary/10 p-3">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground">{method.label}</h3>
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
