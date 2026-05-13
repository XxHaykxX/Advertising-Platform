'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { consumeRateLimit } from '@/lib/rate-limit';
import {
  canTransitionInquiry,
  inquirySubmitSchema,
} from '@/lib/validation/inquiry';

const INQUIRY_RATE_LIMIT = 20;
const INQUIRY_WINDOW_MS = 60 * 60 * 1000; // 20/hr/advertiser per NFR-015
const SLA_HOURS = 4;

export type InquirySubmitActionState = {
  ok: boolean;
  formError?: string;
  fieldErrors?: Partial<
    Record<
      | 'campaignGoal'
      | 'desiredDateFrom'
      | 'desiredDateTo'
      | 'budgetRangeLow'
      | 'budgetRangeHigh'
      | 'notes',
      string
    >
  >;
};

async function getClientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]?.trim() ?? 'unknown';
  return h.get('x-real-ip')?.trim() ?? 'unknown';
}

async function requireVerifiedAdvertiser() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      role: true,
      company: { select: { id: true, canAdvertise: true } },
    },
  });
  if (!user) redirect('/login');
  if (!user.company) redirect('/company-profile');
  if (user.role !== 'ADVERTISER') redirect('/dashboard');
  if (!user.company.canAdvertise) redirect('/dashboard');
  return {
    userId: user.id,
    advertiserCompanyId: user.company.id,
  };
}

export async function submitInquiry(
  _prev: InquirySubmitActionState,
  formData: FormData
): Promise<InquirySubmitActionState> {
  const { userId, advertiserCompanyId } = await requireVerifiedAdvertiser();

  // Per-advertiser rate limit — keyed off the user, not IP, so it follows
  // a logged-in spammer across networks.
  const ip = await getClientIp();
  const rl = consumeRateLimit({
    key: `inquiry:${userId}:${ip}`,
    limit: INQUIRY_RATE_LIMIT,
    windowMs: INQUIRY_WINDOW_MS,
  });
  if (!rl.allowed) {
    return {
      ok: false,
      formError: `Too many inquiries. Try again in ${Math.ceil(rl.retryAfterSeconds / 60)} min.`,
    };
  }

  const parsed = inquirySubmitSchema.safeParse({
    listingId: formData.get('listingId') || undefined,
    publisherCompanyId: formData.get('publisherCompanyId'),
    campaignGoal: formData.get('campaignGoal'),
    desiredDateFrom: formData.get('desiredDateFrom') || undefined,
    desiredDateTo: formData.get('desiredDateTo') || undefined,
    budgetRangeLow: formData.get('budgetRangeLow') || undefined,
    budgetRangeHigh: formData.get('budgetRangeHigh') || undefined,
    notes: formData.get('notes') || undefined,
  });
  if (!parsed.success) {
    const fieldErrors: InquirySubmitActionState['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof NonNullable<
        InquirySubmitActionState['fieldErrors']
      >;
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, fieldErrors };
  }
  const input = parsed.data;

  // Resolve publisher company. If listingId provided, derive publisher from
  // the listing (and confirm listing is ACTIVE). Otherwise trust the
  // publisherCompanyId from the form but validate it points to a company.
  let publisherCompanyId: string;
  let listingId: string | null = null;
  if (input.listingId) {
    const listing = await prisma.listing.findUnique({
      where: { id: input.listingId },
      select: { id: true, status: true, companyId: true },
    });
    if (!listing || listing.status !== 'ACTIVE') {
      return { ok: false, formError: 'This listing is no longer available.' };
    }
    publisherCompanyId = listing.companyId;
    listingId = listing.id;
  } else {
    const publisher = await prisma.company.findUnique({
      where: { id: input.publisherCompanyId },
      select: { id: true, canPublish: true },
    });
    if (!publisher || !publisher.canPublish) {
      return { ok: false, formError: 'Publisher not available for inquiries.' };
    }
    publisherCompanyId = publisher.id;
  }

  if (publisherCompanyId === advertiserCompanyId) {
    return {
      ok: false,
      formError: 'You can\'t send an inquiry to your own company.',
    };
  }

  const slaDeadline = new Date(Date.now() + SLA_HOURS * 60 * 60 * 1000);

  const inquiry = await prisma.$transaction(async (tx) => {
    const created = await tx.inquiry.create({
      data: {
        advertiserUserId: userId,
        advertiserCompanyId,
        publisherCompanyId,
        listingId,
        campaignGoal: input.campaignGoal,
        desiredDateFrom: input.desiredDateFrom,
        desiredDateTo: input.desiredDateTo,
        budgetRangeLow: input.budgetRangeLow,
        budgetRangeHigh: input.budgetRangeHigh,
        notes: input.notes,
        slaDeadline,
        status: 'NEW',
      },
      select: { id: true },
    });
    await tx.inquiryAuditEntry.create({
      data: {
        inquiryId: created.id,
        actorUserId: userId,
        toStatus: 'NEW',
        action: 'SUBMITTED',
      },
    });
    if (listingId) {
      await tx.listing.update({
        where: { id: listingId },
        data: { inquiryCount: { increment: 1 } },
      });
    }
    return created;
  });

  revalidatePath('/inquiries');
  redirect(`/inquiries/${inquiry.id}?just=1`);
}

export async function cancelInquiry(
  inquiryId: string
): Promise<{ ok: boolean; error?: string }> {
  const { userId } = await requireVerifiedAdvertiser();

  const inquiry = await prisma.inquiry.findUnique({
    where: { id: inquiryId },
    select: { advertiserUserId: true, status: true },
  });
  if (!inquiry || inquiry.advertiserUserId !== userId) {
    return { ok: false, error: 'Inquiry not found' };
  }
  if (!canTransitionInquiry(inquiry.status, 'CANCELLED')) {
    return { ok: false, error: 'This inquiry can no longer be cancelled.' };
  }

  await prisma.$transaction([
    prisma.inquiry.update({
      where: { id: inquiryId },
      data: {
        status: 'CANCELLED',
        closedAt: new Date(),
      },
    }),
    prisma.inquiryAuditEntry.create({
      data: {
        inquiryId,
        actorUserId: userId,
        fromStatus: inquiry.status,
        toStatus: 'CANCELLED',
        action: 'ADVERTISER_CANCELLED',
      },
    }),
  ]);

  revalidatePath('/inquiries');
  revalidatePath(`/inquiries/${inquiryId}`);
  return { ok: true };
}
