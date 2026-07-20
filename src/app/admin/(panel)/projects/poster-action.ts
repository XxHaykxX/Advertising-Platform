"use server";

// Server action backing the "Generate poster" panel in project-form.tsx
// (#26). Staff content-editor gate only (same as createProject/updateProject
// in ./actions.ts) — kept in its own file for the same reason as
// translate-action.ts: don't touch the large create/update file.
import { requireContentEditor } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { generatePoster } from "@/lib/image-gen";
import { saveGeneratedImage } from "@/lib/uploads-fs";
import { checkPosterQuota } from "@/lib/rate-limit";

export type GeneratePosterActionInput = {
  prompt: string;
  posterText?: string;
  withLogo?: boolean;
  sourceImageBase64?: string;
  sourceMimeType?: string;
  /** Set on edit (existing project) — pulls project.owner.avatar for the
   *  logo overlay. Omitted on create (no owner yet): the current staff
   *  user's own avatar stands in, since they'll be the owner once saved. */
  projectId?: number;
};

export type GeneratePosterActionResult = { ok?: boolean; path?: string; error?: string };

export async function generatePosterAction(
  input: GeneratePosterActionInput,
): Promise<GeneratePosterActionResult> {
  const user = await requireContentEditor();

  if (!input.prompt?.trim()) return { error: "Prompt is required." };

  // Hard per-user daily ceiling on the paid image API (abuse / runaway-cost
  // guard). Checked before any API call, since the API call is what costs.
  if (!checkPosterQuota(String(user.id)).ok) {
    return { error: "Daily generation limit reached. Please try again tomorrow." };
  }

  let ownerAvatarUrl: string | undefined;
  if (input.withLogo) {
    if (input.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: input.projectId },
        select: { owner: { select: { avatar: true } } },
      });
      ownerAvatarUrl = project?.owner.avatar || undefined;
    } else {
      const me = await prisma.user.findUnique({ where: { id: user.id }, select: { avatar: true } });
      ownerAvatarUrl = me?.avatar || undefined;
    }
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
    return { error: e instanceof Error ? e.message : "Poster generation failed." };
  }
}
