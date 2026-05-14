'use server';

import { revalidatePath } from 'next/cache';

import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-guard';

const MAX_NAME = 80;

export type IndustryFormState = {
  ok: boolean;
  formError?: string;
};

const initialOk: IndustryFormState = { ok: true };

export async function createIndustry(
  _prev: IndustryFormState,
  formData: FormData
): Promise<IndustryFormState> {
  await requireAdmin();

  const name = String(formData.get('name') ?? '').trim();
  const parentRaw = String(formData.get('parentId') ?? '').trim();
  const parentId = parentRaw || null;

  if (name.length < 2) {
    return { ok: false, formError: 'Name must be at least 2 characters.' };
  }
  if (name.length > MAX_NAME) {
    return { ok: false, formError: `Name is too long (max ${MAX_NAME}).` };
  }

  const existing = await prisma.industry.findUnique({ where: { name } });
  if (existing) {
    return { ok: false, formError: 'An industry with this name already exists.' };
  }

  if (parentId) {
    const parent = await prisma.industry.findUnique({
      where: { id: parentId },
      select: { id: true, archived: true },
    });
    if (!parent || parent.archived) {
      return { ok: false, formError: 'Parent industry is missing or archived.' };
    }
  }

  await prisma.industry.create({
    data: { name, parentId },
  });

  revalidatePath('/admin/taxonomy/industries');
  return initialOk;
}

export async function renameIndustry(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get('id') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();
  if (!id || name.length < 2 || name.length > MAX_NAME) return;

  // Renaming to a name that already exists elsewhere violates the @unique.
  const duplicate = await prisma.industry.findUnique({
    where: { name },
    select: { id: true },
  });
  if (duplicate && duplicate.id !== id) return;

  await prisma.industry.update({ where: { id }, data: { name } });
  revalidatePath('/admin/taxonomy/industries');
}

export async function toggleArchiveIndustry(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get('id') ?? '').trim();
  if (!id) return;

  const current = await prisma.industry.findUnique({
    where: { id },
    select: { archived: true },
  });
  if (!current) return;

  await prisma.industry.update({
    where: { id },
    data: { archived: !current.archived },
  });
  revalidatePath('/admin/taxonomy/industries');
}
