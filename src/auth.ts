import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import type { UserRole } from '@prisma/client';

import { prisma } from '@/lib/prisma';

// ─── Module augmentation — extend Session and User with our role ───────────
// JWT augmentation lives in src/types/next-auth.d.ts so it has a sibling
// import statement anchoring the next-auth/jwt module reference.
declare module 'next-auth' {
  interface User {
    role: UserRole;
  }
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession['user'];
  }
}

// ─── Credentials schema ────────────────────────────────────────────────────
const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

// ─── NextAuth v5 — Credentials provider, JWT sessions ──────────────────────
// Architecture ADR-003: NextAuth.js v5, Credentials only (no OAuth in MVP),
// JWT session strategy. The Prisma adapter is intentionally omitted because
// adapter-managed accounts/sessions are not needed without OAuth.

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        // Pre-flight emailVerified check is performed in the login Server
        // Action (so we can return a specific "verify your email" error to
        // the user). authorize() returns the user only when fully authorised.
        if (!user.emailVerified) return null;

        // Admin-driven suspension (S-10.2b). The login page mirrors this
        // check so the user gets a meaningful banner instead of a silent
        // 401.
        if (user.suspended) return null;

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (typeof token.id === 'string') session.user.id = token.id;
      if (token.role) session.user.role = token.role as UserRole;
      return session;
    },
  },
});
