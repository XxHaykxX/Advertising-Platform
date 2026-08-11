import "../test/load-env";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Four specs (signin-return, profile-save ×2, logout-dialog) sign in as
// brand@test.com / brand1234. Nothing created that account — it was made by
// hand on one machine, so anywhere else, and on any machine where its password
// was later changed, those four failed on a 20s "waitForURL" with no hint that
// the login itself was refused. This makes the fixture part of the run.
//
// Deliberately an upsert of the password, not "create if missing": the failure
// mode we actually hit was an account that existed with a different password.
// Everything else about the row (profile fields the specs edit) is left alone.
const EMAIL = "brand@test.com";
const PASSWORD = "brand1234";

export default async function globalSetup() {
  const prisma = new PrismaClient();
  try {
    const passwordHash = await bcrypt.hash(PASSWORD, 10);
    await prisma.user.upsert({
      where: { email: EMAIL },
      update: { passwordHash, status: "APPROVED", isBrand: true },
      create: {
        email: EMAIL,
        name: "QA Brand",
        role: "BRAND",
        status: "APPROVED",
        isBrand: true,
        passwordHash,
      },
    });
    console.log(`[e2e setup] ${EMAIL} ready`);
  } finally {
    await prisma.$disconnect();
  }
}
