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

/* The upload spec needs two more fixtures, and needs them created here rather
   than registered through the UI: one has to be STAFF, and there is no
   self-service route to a staff account by design.

   Staff row conventions taken from the schema: role carries the staff
   discriminator, isCreator/isBrand stay false, isActive gates sign-in. The
   creator row is the mirror image — a member role with isCreator set, which is
   what opens the member upload door. */
export const STAFF_EMAIL = "e2e-staff@test.local";
export const STAFF_PASSWORD = "e2e-staff-1234";
export const CREATOR_EMAIL = "e2e-uploader@test.local";
export const CREATOR_PASSWORD = "e2e-creator-1234";

/* The read-only specs (metadata-404) need no fixture and no database at all,
   so they can be pointed at a deployed environment:

     E2E_READONLY=1 E2E_BASE_URL=https://igovazd.am npx playwright test e2e/metadata-404.spec.ts

   Without this escape hatch the run dies in setup on a machine whose local DB
   is down — and, worse, pointing DATABASE_URL at production to get past it
   would upsert a test account into the live site. */
export const READ_ONLY = process.env.E2E_READONLY === "1";

export default async function globalSetup() {
  if (READ_ONLY) {
    console.log("[e2e setup] E2E_READONLY=1 — skipping the DB fixture");
    return;
  }
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

    const staffHash = await bcrypt.hash(STAFF_PASSWORD, 10);
    await prisma.user.upsert({
      where: { email: STAFF_EMAIL },
      update: { passwordHash: staffHash, role: "SUPERADMIN", status: "APPROVED", isActive: true },
      create: {
        email: STAFF_EMAIL,
        name: "E2E Staff",
        role: "SUPERADMIN",
        status: "APPROVED",
        isActive: true,
        passwordHash: staffHash,
      },
    });

    const creatorHash = await bcrypt.hash(CREATOR_PASSWORD, 10);
    await prisma.user.upsert({
      where: { email: CREATOR_EMAIL },
      update: { passwordHash: creatorHash, status: "APPROVED", isCreator: true, isActive: true },
      create: {
        email: CREATOR_EMAIL,
        name: "E2E Uploader",
        role: "CREATOR",
        status: "APPROVED",
        isCreator: true,
        isActive: true,
        passwordHash: creatorHash,
      },
    });
    console.log(`[e2e setup] ${STAFF_EMAIL} + ${CREATOR_EMAIL} ready`);
  } finally {
    await prisma.$disconnect();
  }
}
