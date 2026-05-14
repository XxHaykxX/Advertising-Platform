'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * Mark a single notification as read. No-op if it's already read or belongs
 * to someone else. Always revalidates the dashboard + admin landings + the
 * notifications list so the bell badge updates.
 */
export async function markNotificationRead(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user) return;
  const id = String(formData.get('id') ?? '').trim();
  if (!id) return;

  await prisma.notification.updateMany({
    where: { id, userId: session.user.id, readAt: null },
    data: { readAt: new Date() },
  });

  revalidatePath('/notifications');
  revalidatePath('/dashboard');
  revalidatePath('/admin');
}

export async function markAllNotificationsRead(): Promise<void> {
  const session = await auth();
  if (!session?.user) return;

  await prisma.notification.updateMany({
    where: { userId: session.user.id, readAt: null },
    data: { readAt: new Date() },
  });

  revalidatePath('/notifications');
  revalidatePath('/dashboard');
  revalidatePath('/admin');
}

/**
 * Mark a notification read AND redirect to its target link. The popover uses
 * this for "click on a notification" — both behaviours in one round-trip,
 * so the user doesn't see a stale unread badge after navigating.
 */
export async function openNotification(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const id = String(formData.get('id') ?? '').trim();
  if (!id) redirect('/notifications');

  const n = await prisma.notification.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, link: true, readAt: true },
  });
  if (!n) redirect('/notifications');

  if (!n.readAt) {
    await prisma.notification.update({
      where: { id: n.id },
      data: { readAt: new Date() },
    });
  }

  revalidatePath('/notifications');
  revalidatePath('/dashboard');
  revalidatePath('/admin');

  redirect(n.link ?? '/notifications');
}
