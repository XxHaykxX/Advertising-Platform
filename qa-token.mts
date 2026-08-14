import { PrismaClient } from "@prisma/client";
import { SignJWT } from "jose";
import { readFileSync } from "node:fs";
const env = readFileSync(".env", "utf8");
const line = env.split(/\r?\n/).find((l) => l.startsWith("SESSION_SECRET="))!;
const secret = line.split("=").slice(1).join("=").replace(/^"|"$/g, "").trim();
const prisma = new PrismaClient();
const u = await prisma.user.findFirst({ where: { role: "SUPERADMIN" }, select: { id: true, role: true, email: true } });
console.log("user:", u);
const token = await new SignJWT({ uid: u!.id, role: u!.role })
  .setProtectedHeader({ alg: "HS256" })
  .setIssuedAt()
  .setExpirationTime("7200s")
  .sign(new TextEncoder().encode(secret));
console.log("TOKEN=" + token);
await prisma.$disconnect();
