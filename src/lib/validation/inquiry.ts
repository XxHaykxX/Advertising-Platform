import { z } from 'zod';

export const inquiryStatusEnum = z.enum([
  'NEW',
  'ASSIGNED',
  'IN_PROGRESS',
  'AWAITING_PUBLISHER',
  'AWAITING_ADVERTISER',
  'CONFIRMED',
  'LOST',
  'CANCELLED',
]);
export type InquiryStatusInput = z.infer<typeof inquiryStatusEnum>;

export const inquiryStatusLabels: Record<InquiryStatusInput, string> = {
  NEW: 'New',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In progress',
  AWAITING_PUBLISHER: 'Awaiting publisher',
  AWAITING_ADVERTISER: 'Awaiting you',
  CONFIRMED: 'Confirmed',
  LOST: 'Lost',
  CANCELLED: 'Cancelled',
};

// Open / closed grouping for filter chips on /inquiries.
export const inquiryOpenStatuses: InquiryStatusInput[] = [
  'NEW',
  'ASSIGNED',
  'IN_PROGRESS',
  'AWAITING_PUBLISHER',
  'AWAITING_ADVERTISER',
];
export const inquiryClosedStatuses: InquiryStatusInput[] = [
  'CONFIRMED',
  'LOST',
  'CANCELLED',
];

export const inquirySubmitSchema = z
  .object({
    listingId: z.string().min(1).optional(),
    publisherCompanyId: z.string().min(1),
    campaignGoal: z
      .string()
      .trim()
      .min(20, 'Tell us a bit more about the campaign — at least 20 characters')
      .max(3000, 'Campaign goal is too long'),
    desiredDateFrom: z.coerce.date().optional(),
    desiredDateTo: z.coerce.date().optional(),
    budgetRangeLow: z
      .union([z.string(), z.number()])
      .optional()
      .transform((v) => {
        if (v === undefined || v === '' || v === null) return undefined;
        const n = typeof v === 'number' ? v : Number(v);
        return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
      }),
    budgetRangeHigh: z
      .union([z.string(), z.number()])
      .optional()
      .transform((v) => {
        if (v === undefined || v === '' || v === null) return undefined;
        const n = typeof v === 'number' ? v : Number(v);
        return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
      }),
    notes: z.string().trim().max(3000).optional(),
  })
  .refine(
    (d) =>
      d.desiredDateFrom === undefined ||
      d.desiredDateTo === undefined ||
      d.desiredDateTo >= d.desiredDateFrom,
    {
      message: 'End date cannot be before the start date',
      path: ['desiredDateTo'],
    }
  )
  .refine(
    (d) =>
      d.budgetRangeLow === undefined ||
      d.budgetRangeHigh === undefined ||
      d.budgetRangeHigh >= d.budgetRangeLow,
    {
      message: 'Upper budget cannot be below the lower budget',
      path: ['budgetRangeHigh'],
    }
  );

export type InquirySubmitInput = z.infer<typeof inquirySubmitSchema>;

// State machine (S-05.5).
// Allowed transitions, expressed advertiser-or-system perspective. Admin-side
// moves (assign, in-progress) are handled by Phase-3 admin Server Actions and
// included for completeness so the same table is the single source of truth.
export const allowedInquiryTransitions: Record<InquiryStatusInput, InquiryStatusInput[]> = {
  NEW: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['AWAITING_PUBLISHER', 'AWAITING_ADVERTISER', 'CONFIRMED', 'LOST'],
  AWAITING_PUBLISHER: ['IN_PROGRESS', 'CONFIRMED', 'LOST'],
  AWAITING_ADVERTISER: ['IN_PROGRESS', 'CONFIRMED', 'LOST'],
  CONFIRMED: [],
  LOST: [],
  CANCELLED: [],
};

export function canTransitionInquiry(
  from: InquiryStatusInput,
  to: InquiryStatusInput
): boolean {
  return allowedInquiryTransitions[from].includes(to);
}
