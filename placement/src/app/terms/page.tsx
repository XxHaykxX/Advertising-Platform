import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { LegalPage, type LegalSection } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service — FP Placement",
  description:
    "Terms of Service for FP Placement marketplace. Understand the rules and conditions for using our platform.",
};

const termsSections: LegalSection[] = [
  {
    heading: "Service Description",
    body: [
      "FP Placement is a digital marketplace that connects filmmakers and producers with brands seeking product placement opportunities in film and television productions. The platform facilitates communication, negotiations, and transaction management between content creators (Filmmakers) and brand representatives (Brands). FP Placement does not itself produce content, manage productions, or directly place products. We provide infrastructure for discovery, reporting, and communication.",
      "Services include: (1) a searchable catalog of production opportunities with detailed project information; (2) secure messaging between Filmmakers and Brands; (3) reporting tools showing scene-specific placement information and safety analysis; (4) payment processing and escrow services; (5) dispute resolution support. FP Placement is provided 'as-is' without warranties of any kind regarding production outcomes, placement success, or third-party performance.",
    ],
  },
  {
    heading: "User Accounts and Responsibilities",
    body: [
      "To use FP Placement, you must create an account and provide accurate, complete information. You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account. You agree to notify us immediately of unauthorized access. You are liable for any losses resulting from unauthorized use of your account.",
      "You represent and warrant that: (1) you have the right to enter into these Terms; (2) you are not prohibited by law from using the platform; (3) information you provide is truthful and accurate; (4) you own or have authorization to use any content you upload. You must comply with all applicable laws and regulations. FP Placement reserves the right to suspend or terminate accounts that violate these Terms or misuse the platform.",
    ],
  },
  {
    heading: "Placement Applications and Agreements",
    body: [
      "Brands may submit placement applications for specific production opportunities. Filmmakers review applications and communicate acceptance or rejection. A placement agreement is formed only when both parties explicitly agree in writing to terms including scope, compensation, usage rights, and delivery timeline. FP Placement facilitates this communication but is not a party to placement agreements.",
      "All placement agreements must comply with applicable law and industry standards. FP Placement does not guarantee that applications will be accepted, that productions will proceed, or that placed products will appear in final edited content. Compensation disputes and performance issues are the responsibility of the parties involved. FP Placement offers dispute resolution services but cannot compel specific outcomes.",
    ],
  },
  {
    heading: "Content Ownership and Rights",
    body: [
      "Filmmakers retain all rights to their production content. By listing a project on FP Placement, Filmmakers grant us a limited license to display production information, posters, and metadata in the marketplace. Brands may not use production content for purposes beyond the agreed placement scope without explicit permission.",
      "Brands retain ownership of product images, logos, and marketing materials they upload. By uploading to FP Placement, Brands grant us a limited license to display materials in the marketplace and reports. Neither party may reproduce, modify, or distribute the other's content beyond the scope explicitly authorized in their placement agreement.",
    ],
  },
  {
    heading: "Limitation of Liability",
    body: [
      "FP Placement is provided 'as-is' and 'as-available' without warranties of merchantability, fitness for a particular purpose, or non-infringement. We do not guarantee uninterrupted service, error-free operation, or data accuracy. We assume no responsibility for third-party conduct, production decisions, content changes, or placement outcomes.",
      "To the maximum extent permitted by law, FP Placement and its officers, directors, employees, and service providers are not liable for any indirect, incidental, consequential, or punitive damages, including lost revenue, lost data, or business interruption, arising from your use of or inability to use the platform, even if we have been advised of the possibility of such damages. Our total liability is limited to the amount of fees paid by you in the preceding 12 months. Some jurisdictions do not allow liability limitations; in such cases, our liability is limited to the maximum extent permitted by law.",
    ],
  },
  {
    heading: "Modifications and Termination",
    body: [
      "FP Placement reserves the right to modify these Terms at any time. We will provide notice of material changes via email or prominent notice on the platform. Your continued use of the platform constitutes acceptance of modified Terms. If you do not agree to changes, you must cease using FP Placement and delete your account.",
      "We may suspend or terminate your account and access to the platform at any time, with or without cause, with or without notice. Upon termination, your right to use the platform ceases immediately. We retain the right to take action against unauthorized use. Provisions that should survive termination (liability limitations, indemnification, payment obligations) remain in effect.",
    ],
  },
];

export default function TermsPage() {
  return (
    <>
      <Header />
      <LegalPage
        title="Terms of Service"
        updated="July 2026"
        intro="These Terms of Service govern your access to and use of FP Placement, our website, mobile applications, and services. By accessing or using FP Placement, you agree to be bound by these Terms. If you do not agree, you may not use the platform. Please read carefully."
        sections={termsSections}
      />
      <Footer />
    </>
  );
}
