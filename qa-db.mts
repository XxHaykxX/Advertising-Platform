import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const cols: unknown = await prisma.$queryRawUnsafe(
  "SELECT COLUMN_NAME, DATA_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND ((TABLE_NAME='Project' AND COLUMN_NAME IN ('attrs','eventCity','eventDate','eventCategory')) OR (TABLE_NAME='AdSpace' AND COLUMN_NAME='attrs'))",
);
console.log(cols);
const spaces = await prisma.adSpace.findMany({ where: { titleHy: { contains: "QA Attr" } }, select: { id: true, code: true, channel: true, attrs: true } });
console.log("QA spaces:", spaces);
await prisma.$disconnect();
