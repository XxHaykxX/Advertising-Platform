import { requireSuperadmin } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { BroadcastTabs } from "./broadcast-tabs";

/** Admin "Broadcast" — super-admin-only composer to push an in-app
 *  notification or an email to a filtered set of members. Recipient counts
 *  are computed here so the composer shows real numbers immediately. */
export default async function BroadcastPage() {
  await requireSuperadmin();

  const base = { status: "APPROVED" as const, isActive: true };
  const [brands, creators] = await Promise.all([
    prisma.user.count({ where: { ...base, role: "BRAND" } }),
    prisma.user.count({ where: { ...base, role: "CREATOR" } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground md:text-3xl">Рассылка</h1>
      <p className="mt-2 text-muted-foreground">
        Отправьте push-уведомление или email участникам с фильтром по аудитории.
      </p>

      <BroadcastTabs counts={{ all: brands + creators, brands, creators }} />
    </div>
  );
}
