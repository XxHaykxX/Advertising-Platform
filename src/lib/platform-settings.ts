import { prisma } from '@/lib/prisma';

/** Known platform settings — typed wrapper around the key/value table. */
export const SETTING_KEYS = {
  /** SLA hours for the initial first-response timer on an inquiry. */
  inquirySlaHours: 'inquirySlaHours',
} as const;

const DEFAULTS = {
  inquirySlaHours: 4,
} satisfies Record<keyof typeof SETTING_KEYS, number>;

export async function getInquirySlaHours(): Promise<number> {
  const row = await prisma.platformSetting.findUnique({
    where: { key: SETTING_KEYS.inquirySlaHours },
    select: { value: true },
  });
  if (!row) return DEFAULTS.inquirySlaHours;
  const n = Number(row.value);
  return Number.isFinite(n) && n > 0 && n <= 168 ? n : DEFAULTS.inquirySlaHours;
}

export async function setInquirySlaHours(hours: number): Promise<void> {
  await prisma.platformSetting.upsert({
    where: { key: SETTING_KEYS.inquirySlaHours },
    create: { key: SETTING_KEYS.inquirySlaHours, value: String(hours) },
    update: { value: String(hours) },
  });
}
