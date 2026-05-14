import { prisma } from '@/lib/prisma';

export interface ContentSnapshot {
  title: string;
  body: string;
  updatedAt: Date | null;
  /** True when the content came from the DB rather than the static fallback. */
  fromDb: boolean;
}

/** Static defaults — render these when admin hasn't customised the page yet. */
const STATIC: Record<'terms' | 'privacy' | 'faq', { title: string; body: string }> = {
  terms: {
    title: 'Terms of Service',
    body: `Placeholder. This document is a working draft. Final terms will be reviewed by counsel before public launch. By using the platform during the closed pilot you agree to act in good faith and use it for legitimate commercial purposes only.

1. The service
The Advertising Platform is a brokered marketplace connecting advertisers and publishers of advertising inventory. The platform team mediates all conversations between the parties; advertisers and publishers do not contact each other directly.

2. Accounts
You must register an account to submit inquiries or publish listings. You are responsible for keeping your password confidential and for the activity that occurs under your account.

3. Acceptable use
You may not use the platform for illegal content, harassment, fraud, or activity that breaches Armenian advertising regulations. We reserve the right to suspend accounts that violate these rules.

4. Termination
You may close your account at any time. We may suspend or terminate accounts for breach of these terms, with reasonable notice except where immediate action is required.

5. Liability
The platform is provided as-is during the MVP phase. We are not party to the underlying advertising contracts between advertisers and publishers and accept no liability for those agreements.`,
  },
  privacy: {
    title: 'Privacy Policy',
    body: `Placeholder. We collect the minimum data needed to run the brokered marketplace: account email, company info you provide, inquiry content, and audit trails of platform actions.

We do not sell your data. We share it with publishers / advertisers only through the brokered inquiry flow — and only the fields you intend to share.

For deletion, write to the platform team. Account closure removes login access; audit trails are retained for compliance.`,
  },
  faq: {
    title: 'Frequently asked questions',
    body: `What is this platform?
A brokered marketplace for ad inventory. Advertisers find listings, send inquiries; the platform team mediates the conversation; publishers respond. No direct chats.

Who can list?
Verified publishers — companies that have completed verification with our team.

How does verification work?
Submit your company documents from the dashboard. We review within 1 business day.

How are prices set?
Prices aren't shown publicly. They're agreed on a per-inquiry basis during the brokered conversation.`,
  },
};

export async function getContent(slug: 'terms' | 'privacy' | 'faq'): Promise<ContentSnapshot> {
  const row = await prisma.platformContent.findUnique({
    where: { slug },
    select: { title: true, body: true, updatedAt: true },
  });
  if (row) {
    return { title: row.title, body: row.body, updatedAt: row.updatedAt, fromDb: true };
  }
  const fallback = STATIC[slug];
  return { title: fallback.title, body: fallback.body, updatedAt: null, fromDb: false };
}
