'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { deleteCompanyLogo, saveCompanyLogo } from '@/lib/storage';
import { companyProfileSchema } from '@/lib/validation/company';

export type EditCompanyState = {
  ok: boolean;
  formError?: string;
  fieldErrors?: Partial<
    Record<
      | 'name'
      | 'legalName'
      | 'taxId'
      | 'foundingYear'
      | 'country'
      | 'address'
      | 'industryIds'
      | 'channelsOfInterest'
      | 'logo',
      string
    >
  >;
  successFlash?: string;
};

export async function updateCompanyProfile(
  _prev: EditCompanyState,
  formData: FormData
): Promise<EditCompanyState> {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      role: true,
      company: {
        select: {
          id: true,
          name: true,
          legalName: true,
          taxId: true,
          logoUrl: true,
        },
      },
    },
  });
  if (!user) redirect('/login');
  if (!user.company) redirect('/company-profile');

  const raw = {
    name: formData.get('name'),
    legalName: formData.get('legalName') || undefined,
    taxId: formData.get('taxId') || undefined,
    foundingYear: formData.get('foundingYear') || undefined,
    country: formData.get('country') || 'AM',
    address: formData.get('address') || undefined,
    industryIds: formData.getAll('industryIds') as string[],
    channelsOfInterest: formData.getAll('channelsOfInterest') as string[],
  };

  const parsed = companyProfileSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: EditCompanyState['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof NonNullable<EditCompanyState['fieldErrors']>;
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, fieldErrors };
  }
  const input = parsed.data;

  const validIndustries = await prisma.industry.findMany({
    where: { id: { in: input.industryIds }, archived: false },
    select: { id: true },
  });
  if (validIndustries.length !== input.industryIds.length) {
    return {
      ok: false,
      fieldErrors: { industryIds: 'One or more selected industries are unavailable.' },
    };
  }

  // Identity-affecting changes per AC. We flag admins; we do NOT revoke
  // verification — that decision belongs to a human.
  const sensitiveChange =
    (input.legalName ?? input.name) !== (user.company.legalName ?? user.company.name) ||
    (input.taxId ?? null) !== user.company.taxId;

  await prisma.$transaction([
    prisma.companyIndustry.deleteMany({ where: { companyId: user.company.id } }),
    prisma.companyIndustry.createMany({
      data: input.industryIds.map((industryId) => ({
        companyId: user.company!.id,
        industryId,
      })),
    }),
    prisma.company.update({
      where: { id: user.company.id },
      data: {
        name: input.name,
        legalName: input.legalName ?? input.name,
        taxId: input.taxId ?? null,
        foundingYear: input.foundingYear ?? null,
        country: input.country,
        address: input.address ?? null,
        channelsOfInterest:
          user.role === 'ADVERTISER' && input.channelsOfInterest.length > 0
            ? input.channelsOfInterest
            : undefined,
      },
    }),
  ]);

  // Logo handling — runs OUTSIDE the transaction (filesystem isn't
  // transactional). Old file is removed only after the new write succeeds.
  const logoFile = formData.get('logo');
  if (logoFile instanceof File && logoFile.size > 0) {
    const result = await saveCompanyLogo(user.company.id, logoFile);
    if (!result.ok) {
      return { ok: false, fieldErrors: { logo: result.error ?? 'Could not save logo' } };
    }
    if (result.path) {
      const previous = user.company.logoUrl;
      await prisma.company.update({
        where: { id: user.company.id },
        data: { logoUrl: result.path },
      });
      if (previous && previous !== result.path) {
        await deleteCompanyLogo(previous);
      }
    }
  }

  if (sensitiveChange) {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });
    if (admins.length) {
      await prisma.notification.createMany({
        data: admins.map((a) => ({
          userId: a.id,
          type: 'VERIFICATION_RESULT' as const,
          title: `Company "${input.name}" updated identity fields`,
          body: `Legal name or tax ID changed. Verification stays as-is — manually re-review if the change is suspicious.`,
          link: `/admin/companies`,
        })),
      });
    }
  }

  revalidatePath('/settings/company');
  revalidatePath('/dashboard');
  return {
    ok: true,
    successFlash: sensitiveChange
      ? 'Saved. Admin team notified about the identity-field change.'
      : 'Saved.',
  };
}
