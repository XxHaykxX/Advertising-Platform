// Dev-only helper: create / promote an admin user OR reset an existing
// admin's password. The dashboard admin UI (S-10.4 admin team management)
// replaces this in Phase 4.
//
// Usage:
//   npm run db:create-admin -- <email> <name> <password>   # create new admin
//   npm run db:create-admin -- <email>                     # promote existing user (no password change)
//   npm run db:create-admin -- <email> -- <password>       # reset password for existing user (sentinel "--" instead of name)
//
// In every case 2FA state is cleared (twoFactorEnabled=false, secret=null,
// mfaVerifiedAt=null) so the next admin login forces fresh TOTP enrollment.

import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 12;

async function main() {
  const [email, nameOrSentinel, password] = process.argv.slice(2);
  if (!email) {
    console.error(
      'Usage:\n  npm run db:create-admin -- <email> <name> <password>     # create new\n  npm run db:create-admin -- <email>                       # promote existing user (no password change)\n  npm run db:create-admin -- <email> -- <password>         # reset password for existing user'
    );
    process.exit(1);
  }

  const normalizedEmail = email.toLowerCase();
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  // Password-reset path: `<email> -- <password>` for an existing user.
  const isResetCommand = nameOrSentinel === '--' && Boolean(password);

  if (existing) {
    if (isResetCommand) {
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          passwordHash,
          role: 'ADMIN',
          adminSubrole: existing.adminSubrole ?? 'OWNER',
          twoFactorEnabled: false,
          twoFactorSecret: null,
          mfaVerifiedAt: null,
          emailVerified: existing.emailVerified ?? new Date(),
        },
      });
      console.info(`[admin] reset password for ${normalizedEmail}`);
      console.info('  Next: open /admin/login, sign in, re-enroll TOTP.');
      return;
    }

    if (existing.role === 'ADMIN') {
      console.info(`[admin] ${normalizedEmail} is already an admin.`);
      console.info(
        '  To reset password: npm run db:create-admin -- <email> -- <new-password>'
      );
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

  if (isResetCommand) {
    console.error(
      `User ${normalizedEmail} not found — can't reset a password that doesn't exist.\n` +
        '  To create: npm run db:create-admin -- <email> <name> <password>'
    );
    process.exit(1);
  }

  const name = nameOrSentinel;
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
