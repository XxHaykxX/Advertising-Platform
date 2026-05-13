// Anchor module augmentation for next-auth/jwt with a sibling import.
import type { UserRole } from '@prisma/client';
import 'next-auth/jwt';

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: UserRole;
  }
}
