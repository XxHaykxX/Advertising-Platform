'use server';

import { redirect } from 'next/navigation';

import type { Prisma } from '@prisma/client';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { saveVerificationDocs } from '@/lib/storage';

export type SubmitVerificationActionState = {
  ok: boolean;
  formError?: string;
};

export async function submitVerificationRequest(
  _prev: SubmitVerificationActionState,
  formData: FormData
): Promise<SubmitVerificationActionState> {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      companyId: true,
      company: {
        select: { id: true, verificationStatus: true },
      },
    },
  });
  if (!user?.company) redirect('/company-profile');
  if (user.company.verificationStatus === 'APPROVED') redirect('/dashboard');

  // Read files from formData. Skip empties.
  const all = formData.getAll('documents');
  const files: File[] = all.filter(
    (entry): entry is File => entry instanceof File && entry.size > 0
  );

  const result = await saveVerificationDocs(user.company.id, files);
  if (!result.ok) {
    return { ok: false, formError: result.error ?? 'Could not save documents' };
  }

  await prisma.verificationRequest.create({
    data: {
      companyId: user.company.id,
      documents:
        result.documents.length > 0
          ? (result.documents as unknown as Prisma.InputJsonValue)
          : undefined,
    },
  });

  // Ensure the company is back in PENDING if it was REJECTED/NEEDS_INFO
  // (resubmission flow — full handling in S-03.6).
  if (user.company.verificationStatus !== 'PENDING') {
    await prisma.company.update({
      where: { id: user.company.id },
      data: { verificationStatus: 'PENDING' },
    });
  }

  redirect('/dashboard?submitted=verification');
}
