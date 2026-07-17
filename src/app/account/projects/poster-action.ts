"use server";

// Server action backing the "Generate poster" panel in project-form.tsx
// (#26) when it renders in mode="creator". Member gate only (requireMember) —
// deliberate twin of admin/(panel)/projects/poster-action.ts rather than a
// shared export, same "different trust zone" reasoning as createCreatorProject
// in ./actions.ts. The creator's own avatar is always the logo source (they're
// always the project's owner-to-be, unlike the admin form which may act on
// someone else's existing project).
import { requireMember } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { generatePoster } from "@/lib/image-gen";
import { saveGeneratedImage } from "@/lib/uploads-fs";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";

export type GeneratePosterActionInput = {
  prompt: string;
  posterText?: string;
  withLogo?: boolean;
  sourceImageBase64?: string;
  sourceMimeType?: string;
};

export type GeneratePosterActionResult = { ok?: boolean; path?: string; error?: string };

export async function generateCreatorPosterAction(
  input: GeneratePosterActionInput,
): Promise<GeneratePosterActionResult> {
  const user = await requireMember();
  const t = makeUI(await getLocale());

  if (!input.prompt?.trim()) return { error: t("account.form.errPosterPrompt") };

  let ownerAvatarUrl: string | undefined;
  if (input.withLogo) {
    const me = await prisma.user.findUnique({ where: { id: user.id }, select: { avatar: true } });
    ownerAvatarUrl = me?.avatar || undefined;
  }

  try {
    const { imageBase64, mimeType } = await generatePoster({
      prompt: input.prompt,
      posterText: input.posterText,
      withLogo: input.withLogo,
      ownerAvatarUrl,
      sourceImageBase64: input.sourceImageBase64,
      sourceMimeType: input.sourceMimeType,
    });
    const savedPath = await saveGeneratedImage(Buffer.from(imageBase64, "base64"), mimeType, "projects");
    return { ok: true, path: savedPath };
  } catch (e) {
    // Don't leak internal image-gen errors (API keys, upstream messages) to the
    // client — log server-side, show a friendly localized message. (F15)
    console.error("Creator poster generation failed:", e);
    return { error: t("account.form.errPosterFailed") };
  }
}
