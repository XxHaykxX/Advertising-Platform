'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { saveCompanyLogo } from '@/lib/storage';
import { companyProfileSchema } from '@/lib/validation/company';

export type CompanyProfileActionState = {
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
};

export async function submitCompanyProfile(
  _prev: CompanyProfileActionState,
  formData: FormData
): Promise<CompanyProfileActionState> {
  // 1. Auth — only signed-in, verified, no-company-yet users can submit.
  const session = await auth();
  if (!session?.user) redirect('/login');
  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, companyId: true, emailVerified: true },
  });
  if (!user) redirect('/login');
  if (!user.emailVerified) redirect('/verify');
  if (user.companyId) redirect('/dashboard');

  // 2. Parse + validate
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
    const fieldErrors: CompanyProfileActionState['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof NonNullable<
        CompanyProfileActionState['fieldErrors']
      >;
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, fieldErrors };
  }
  const input = parsed.data;

  // 3. Sanity-check industry IDs exist (and are not archived).
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

  // 4. Create Company + CompanyIndustry rows + link to User in one transaction.
  const company = await prisma.$transaction(async (tx) => {
    const created = await tx.company.create({
      data: {
        name: input.name,
        legalName: input.legalName ?? input.name,
        taxId: input.taxId,
        foundingYear: input.foundingYear,
        country: input.country,
        address: input.address,
        channelsOfInterest:
          user.role === 'ADVERTISER' && input.channelsOfInterest.length > 0
            ? input.channelsOfInterest
            : undefined,
        verificationStatus: 'PENDING',
        canAdvertise: false,
        canPublish: false,
        industries: {
          create: input.industryIds.map((industryId) => ({ industryId })),
        },
      },
    });
    await tx.user.update({
      where: { id: userId },
      data: { companyId: created.id },
    });
    return created;
  });

  // 5. Optional logo upload — runs OUTSIDE the transaction so a write failure
  //    doesn't roll back the company creation.
  const logoFile = formData.get('logo');
  if (logoFile instanceof File && logoFile.size > 0) {
    const result = await saveCompanyLogo(company.id, logoFile);
    if (result.ok && result.path) {
      await prisma.company.update({
        where: { id: company.id },
        data: { logoUrl: result.path },
      });
    } else if (!result.ok) {
      // Logo failed but the company is created — surface a soft error.
      revalidatePath('/company-profile');
      return {
        ok: false,
        fieldErrors: { logo: result.error ?? 'Could not save logo' },
      };
    }
  }

  // 6. Redirect to dashboard. The dashboard will show a "pending verification"
  //    state once S-03.3 lands.
  redirect('/dashboard');
}
