import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { LegalPage, type LegalSection } from "@/components/legal-page";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Privacy Policy — iGovazd",
  description:
    "Privacy Policy for iGovazd marketplace. Learn how we collect, use, and protect your data.",
};

const privacySections: LegalSection[] = [
  {
    heading: "Data We Collect",
    body: [
      "iGovazd collects personal information to facilitate brand placement in film and television productions. This includes contact information (name, email, phone), company details, project information, payment data, and usage analytics. When you create an account, we collect authentication credentials and profile information. For filmmakers, we gather production details, budget information, and filming schedules. For brands, we collect product information, placement preferences, and budget allocations. We use cookies and similar technologies to collect information about your browsing behavior and device information.",
      "All personally identifiable information is handled in accordance with applicable data protection regulations. We collect only the minimum data necessary to provide our services and fulfill legal obligations.",
    ],
  },
  {
    heading: "How We Use Your Data",
    body: [
      "Your personal data is used to operate and improve the iGovazd marketplace. Specifically, we use it to: (1) authenticate users and maintain account security; (2) facilitate connections between brands and filmmakers; (3) process transactions and manage payments; (4) generate reports and analytics on placement performance; (5) communicate service updates, policy changes, and marketing information; (6) provide customer support; (7) comply with legal obligations and enforce our Terms of Service.",
      "We use aggregated, anonymized data for trend analysis and service improvement. We will not sell your personal information to third parties. Data processing is limited to what is necessary for the stated purposes.",
    ],
  },
  {
    heading: "Cookies and Tracking Technologies",
    body: [
      "iGovazd uses cookies, local storage, and similar technologies to enhance user experience. Essential cookies are necessary for authentication and security. Functional cookies remember user preferences and settings. Analytical cookies help us understand how users interact with the platform, using services such as Google Analytics. Marketing cookies may be used to display relevant advertising and track campaign effectiveness.",
      "You can control cookie settings through your browser preferences. Disabling certain cookies may limit functionality. We do not track users across third-party websites unless they explicitly opt into marketing services.",
    ],
  },
  {
    heading: "Third-Party Sharing and Service Providers",
    body: [
      "iGovazd may share data with trusted service providers who assist in operating the platform, including payment processors (Stripe), analytics providers (Google Analytics), email delivery services, and hosting providers. These service providers are contractually obligated to use your data only for the purposes we specify and to maintain confidentiality.",
      "We do not share personal information with third parties for their marketing purposes without your explicit consent. We may disclose information when required by law, court order, or government request. If we become aware of illegal activity or violations of our Terms of Service, we may report to relevant authorities.",
    ],
  },
  {
    heading: "Data Retention and Security",
    body: [
      "Personal information is retained as long as necessary to provide services and fulfill legal obligations. Account data is generally retained for the duration of the account and for a reasonable period thereafter to resolve disputes. Transaction records are kept for accounting and compliance purposes. You may request deletion of your account and associated data, subject to legal retention requirements.",
      "We implement industry-standard security measures including encryption (SSL/TLS), secure password hashing, firewalls, and regular security audits. Access to sensitive data is restricted to authorized personnel. However, no system is completely secure, and we cannot guarantee absolute security of your information.",
    ],
  },
  {
    heading: "Your Rights and Contact",
    body: [
      "Depending on your jurisdiction, you may have rights including access to your data, correction of inaccuracies, deletion requests, data portability, and withdrawal of consent. To exercise these rights, contact our privacy team at privacy@igovazd.am. We will respond to verified requests within 30 days. If you believe we have mishandled your data, you may lodge a complaint with your local data protection authority.",
      "For privacy inquiries or concerns, please contact: iGovazd Privacy Team, privacy@igovazd.am. We update this privacy policy periodically. Significant changes will be communicated via email or prominent notice on the platform. Your continued use of iGovazd constitutes acceptance of the updated policy.",
    ],
  },
];

export default async function PrivacyPage() {
  const locale = await getLocale();
  const t = makeUI(locale);
  return (
    <>
      <Header locale={locale} />
      <LegalPage
        title={t("legal.privacyTitle")}
        updated="July 2026"
        intro="This Privacy Policy explains how iGovazd collects, uses, and protects your personal information. We are committed to transparency and compliance with applicable data protection laws. By using iGovazd, you agree to the practices outlined below."
        sections={privacySections}
        locale={locale}
      />
      <Footer locale={locale} />
    </>
  );
}
