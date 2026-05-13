import { z } from 'zod';

export const RoleEnum = z.enum(['advertiser', 'publisher']);
export type RoleInput = z.infer<typeof RoleEnum>;

export const registerSchema = z.object({
  role: RoleEnum,
  name: z
    .string()
    .trim()
    .min(2, 'Please enter your full name')
    .max(120, 'Name is too long'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Enter a valid email address')
    .max(255),
  phone: z
    .string()
    .trim()
    .min(5, 'Enter a valid phone number')
    .max(32, 'Phone number is too long'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long'),
  acceptTerms: z.literal(true, {
    errorMap: () => ({
      message: 'You must accept the Terms of Service and Privacy Policy',
    }),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
