export const APP_STATUSES = ["new", "in_progress", "closed"] as const;
export type AppStatus = (typeof APP_STATUSES)[number];

export function isAppStatus(value: string): value is AppStatus {
  return (APP_STATUSES as readonly string[]).includes(value);
}
