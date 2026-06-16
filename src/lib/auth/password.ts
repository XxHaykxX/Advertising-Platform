import "server-only";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const KEY = "admin_password_hash";

async function getHash(): Promise<string | null> {
  const row = await prisma.setting.findUnique({ where: { key: KEY } });
  return row?.value ?? null;
}

/** Verify a plaintext password against the stored bcrypt hash. */
export async function verifyAdminPassword(password: string): Promise<boolean> {
  const hash = await getHash();
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}

/** Replace the admin password hash. */
export async function setAdminPassword(password: string): Promise<void> {
  const hash = await bcrypt.hash(password, 10);
  await prisma.setting.upsert({
    where: { key: KEY },
    update: { value: hash },
    create: { key: KEY, value: hash },
  });
}
