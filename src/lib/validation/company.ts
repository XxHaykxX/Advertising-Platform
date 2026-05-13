import { z } from 'zod';

const CURRENT_YEAR = new Date().getFullYear();

export const channelTypeEnum = z.enum([
  'PRODUCT_PLACEMENT',
  'IN_VIDEO_AD',
  'WEBSITE_BANNER',
  'TV',
  'RADIO',
  'OUTDOOR',
  'SOCIAL',
  'PODCAST',
  'PRINT',
  'INFLUENCER',
  'EVENT',
]);

export type ChannelTypeInput = z.infer<typeof channelTypeEnum>;

export const channelTypeLabels: Record<ChannelTypeInput, string> = {
  PRODUCT_PLACEMENT: 'Product placement',
  IN_VIDEO_AD: 'In-video ad',
  WEBSITE_BANNER: 'Website banner',
  TV: 'TV',
  RADIO: 'Radio',
  OUTDOOR: 'Outdoor',
  SOCIAL: 'Social',
  PODCAST: 'Podcast',
  PRINT: 'Print',
  INFLUENCER: 'Influencer',
  EVENT: 'Event',
};

export const channelTypeAllValues = channelTypeEnum.options;

export const companyProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Company name must be at least 2 characters')
    .max(200, 'Company name is too long'),
  legalName: z.string().trim().max(200, 'Legal name is too long').optional(),
  taxId: z.string().trim().max(40, 'Tax ID is too long').optional(),
  foundingYear: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => {
      if (v === undefined || v === '' || v === null) return undefined;
      const n = typeof v === 'number' ? v : Number(v);
      return Number.isFinite(n) ? n : undefined;
    })
    .refine((v) => v === undefined || (v >= 1800 && v <= CURRENT_YEAR), {
      message: `Founding year must be between 1800 and ${CURRENT_YEAR}`,
    }),
  country: z
    .string()
    .trim()
    .length(2, 'Country must be a 2-letter code')
    .toUpperCase()
    .default('AM'),
  address: z.string().trim().max(500, 'Address is too long').optional(),
  industryIds: z
    .array(z.string().min(1))
    .min(1, 'Pick at least one industry')
    .max(8, 'Pick up to 8 industries'),
  channelsOfInterest: z.array(channelTypeEnum).optional().default([]),
});

export type CompanyProfileInput = z.infer<typeof companyProfileSchema>;
