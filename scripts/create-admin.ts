// Dev-only helper: create or promote an admin user. The dashboard admin UI
// (S-10.4 admin team management) replaces this in Phase 4.
//
// Usage:
//   npm run db:create-admin -- <email> <name> <password>
//   npm run db:create-admin -- <email>           # promote an existing user
//
// New admins land with twoFactorEnabled=false; the first login forces
// enrollment per S-08.1.

import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 12;

async function main() {
  const [email, name, password] = process.argv.slice(2);
  if (!email) {
    console.error(
      'Usage:\n  npm run db:create-admin -- <email> <name> <password>\n  npm run db:create-admin -- <email>   # promote existing user'
    );
    process.exit(1);
  }

  const normalizedEmail = email.toLowerCase();
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    if (existing.role === 'ADMIN') {
      console.info(`[admin] ${normalizedEmail} is already an admin.`);
    } else {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          role: 'ADMIN',
          adminSubrole: 'OWNER',
          twoFactorEnabled: false,
          twoFactorSecret: null,
          mfaVerifiedAt: null,
          emailVerified: existing.emailVerified ?? new Date(),
        },
      });
      console.info(`[admin] promoted ${normalizedEmail} to ADMIN/OWNER`);
    }
    return;
  }

  if (!name || !password) {
    console.error(
      'New admin requires name + password.\n  npm run db:create-admin -- <email> <name> <password>'
    );
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const created = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      name,
      role: 'ADMIN',
      adminSubrole: 'OWNER',
      emailVerified: new Date(),
    },
  });
  console.info(`[admin] created ${created.email} (id ${created.id}) as ADMIN/OWNER`);
  console.info('  Next: open /admin/login, sign in, enroll TOTP.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
