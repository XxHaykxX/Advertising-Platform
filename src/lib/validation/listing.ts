import { z } from 'zod';

import { channelTypeEnum } from '@/lib/validation/company';

export const listingStatusEnum = z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'CLOSED']);
export type ListingStatusInput = z.infer<typeof listingStatusEnum>;

export const audienceDemographicsSchema = z
  .object({
    ageRange: z.string().trim().max(40).optional(),
    dailyReach: z
      .union([z.string(), z.number()])
      .optional()
      .transform((v) => {
        if (v === undefined || v === '' || v === null) return undefined;
        const n = typeof v === 'number' ? v : Number(v);
        return Number.isFinite(n) ? n : undefined;
      })
      .refine((v) => v === undefined || (v >= 0 && v <= 100_000_000), {
        message: 'Daily reach must be 0 – 100,000,000',
      }),
    region: z.string().trim().max(120).optional(),
  })
  .strict();

export type AudienceDemographicsInput = z.infer<typeof audienceDemographicsSchema>;

export const listingSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, 'Title must be at least 3 characters')
      .max(200, 'Title is too long'),
    channelType: channelTypeEnum,
    sourceChannelName: z
      .string()
      .trim()
      .min(2, 'Source channel name must be at least 2 characters')
      .max(160, 'Source channel name is too long'),
    availableFrom: z.coerce.date(),
    availableTo: z.coerce.date(),
    description: z
      .string()
      .trim()
      .min(20, 'Tell advertisers a bit more — at least 20 characters')
      .max(5000, 'Description is too long'),
    audience: audienceDemographicsSchema,
  })
  .refine((d) => d.availableTo >= d.availableFrom, {
    message: 'End date cannot be before the start date',
    path: ['availableTo'],
  });

export type ListingInput = z.infer<typeof listingSchema>;

// State machine — per S-04.3.
export const allowedListingTransitions: Record<ListingStatusInput, ListingStatusInput[]> = {
  DRAFT: ['ACTIVE'],
  ACTIVE: ['PAUSED', 'CLOSED'],
  PAUSED: ['ACTIVE', 'CLOSED'],
  CLOSED: [],
};

export function canTransitionListing(
  from: ListingStatusInput,
  to: ListingStatusInput
): boolean {
  return allowedListingTransitions[from].includes(to);
}
