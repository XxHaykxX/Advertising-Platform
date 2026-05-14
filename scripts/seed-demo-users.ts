/**
 * One-shot: создаёт demo Advertiser и Publisher с APPROVED-компаниями.
 * Запуск с инлайн-DATABASE_URL для прода.
 */
import bcrypt from 'bcryptjs';

import { prisma } from '../src/lib/prisma';

const PASSWORD = 'Password123!';

async function upsertUserWithCompany(opts: {
  email: string;
  name: string;
  role: 'ADVERTISER' | 'PUBLISHER';
  companyName: string;
}) {
  const { email, name, role, companyName } = opts;
  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  const company = await prisma.company.upsert({
    where: { id: `demo-${role.toLowerCase()}-co` },
    create: {
      id: `demo-${role.toLowerCase()}-co`,
      name: companyName,
      legalName: companyName,
      country: 'AM',
      verificationStatus: 'APPROVED',
      verifiedAt: new Date(),
      canAdvertise: role === 'ADVERTISER',
      canPublish: role === 'PUBLISHER',
    },
    update: {
      verificationStatus: 'APPROVED',
      canAdvertise: role === 'ADVERTISER',
      canPublish: role === 'PUBLISHER',
    },
  });

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      name,
      role,
      companyId: company.id,
      emailVerified: new Date(),
    },
    update: {
      passwordHash,
      role,
      companyId: company.id,
      suspended: false,
      suspendedAt: null,
      suspendReason: null,
    },
  });

  return { user, company };
}

async function main() {
  const adv = await upsertUserWithCompany({
    email: 'advertiser@advertising-platform.local',
    name: 'Demo Advertiser',
    role: 'ADVERTISER',
    companyName: 'Demo Advertiser Co.',
  });
  console.log(`[demo] advertiser ${adv.user.email} (${adv.user.id}) → company ${adv.company.id}`);

  const pub = await upsertUserWithCompany({
    email: 'publisher@advertising-platform.local',
    name: 'Demo Publisher',
    role: 'PUBLISHER',
    companyName: 'Demo Publisher Co.',
  });
  console.log(`[demo] publisher ${pub.user.email} (${pub.user.id}) → company ${pub.company.id}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
