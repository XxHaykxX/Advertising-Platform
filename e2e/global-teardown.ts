import "../test/load-env";
import { PrismaClient } from "@prisma/client";

// Removes every row the E2E specs created so reruns stay clean and the local
// dev DB isn't polluted. E2E accounts use the `e2e-` email prefix and the
// display name "E2E Brand"/"E2E Creator"; interest notifications carry the
// brand name in their JSON `data`, so we sweep those too.
export default async function globalTeardown() {
  const prisma = new PrismaClient();
  try {
    const users = await prisma.user.findMany({
      where: { email: { startsWith: "e2e-" } },
      select: { id: true },
    });
    const ids = users.map((u) => u.id);

    await prisma.notification.deleteMany({
      where: {
        OR: [
          ids.length ? { userId: { in: ids } } : { id: -1 },
          { data: { contains: "E2E Brand" } },
          { data: { contains: "E2E Creator" } },
        ],
      },
    });
    if (ids.length) {
      await prisma.interest.deleteMany({ where: { brandId: { in: ids } } });
      await prisma.project.deleteMany({ where: { ownerId: { in: ids } } });
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
    }
    // eslint-disable-next-line no-console
    console.log(`[e2e teardown] removed ${ids.length} e2e user(s) + related rows`);
  } finally {
    await prisma.$disconnect();
  }
}
