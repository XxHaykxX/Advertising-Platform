'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

async function requireAdvertiser(): Promise<string> {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });
  if (!user) redirect('/login');
  if (user.role !== 'ADVERTISER') redirect('/dashboard');
  return user.id;
}

/**
 * Toggle a listing into/out of the wishlist. Single roundtrip whichever the
 * state — addToWishlist + removeFromWishlist were tempting but every caller
 * would have to know the current state first, and the bookmark UI only cares
 * about the result. Returns the new isSaved value.
 */
export async function toggleWishlistEntry(formData: FormData): Promise<void> {
  const userId = await requireAdvertiser();
  const listingId = String(formData.get('listingId') ?? '').trim();
  const intent = String(formData.get('intent') ?? '').trim();
  if (!listingId) return;

  // Defense in depth — only ACTIVE listings should be saveable, but if a
  // listing pauses after you save it we still let you unsave.
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, status: true },
  });
  if (!listing) return;

  if (intent === 'remove') {
    await prisma.wishlistItem.deleteMany({
      where: { userId, listingId: listing.id },
    });
  } else {
    if (listing.status !== 'ACTIVE') return;
    await prisma.wishlistItem.upsert({
      where: { userId_listingId: { userId, listingId: listing.id } },
      create: { userId, listingId: listing.id },
      update: {},
    });
  }

  revalidatePath('/catalog');
  revalidatePath(`/catalog/listings/${listing.id}`);
  revalidatePath('/wishlist');
}
