import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const p = await prisma.project.findMany({ orderBy: { id: "desc" }, take: 3, select: { id: true, title: true, titleHy: true, eventCity: true, eventDate: true, eventCategory: true, attrs: true } });
console.log(p);
await prisma.$disconnect();
