// Server-only. Generates a cinematic film poster via Google's Nano Banana Pro
// (Gemini 3 Pro Image) and — optionally — composites the creator's avatar
// into it as a watermark/logo. Called from the two thin poster-action.ts
// wrappers (admin project-form + the creator's account/projects submission
// form) — see those files for the requireContentEditor/requireMember auth
// gates, which live at the action boundary, not here.
//
// Model note (2026-07-15): confirmed live against GOOGLE_IMAGE_API_KEY.
// ListModels exposes gemini-3-pro-image, gemini-3-pro-image-preview,
// nano-banana-pro-preview, gemini-2.5-flash-image (classic Nano Banana) and
// a few gemini-3.1-flash-image variants. A generateContent call against
// "gemini-3-pro-image" with generationConfig.responseModalities=["IMAGE"] +
// generationConfig.imageConfig.aspectRatio="16:9" returned HTTP 200 with a
// real inlineData image (mimeType echoed back as image/jpeg) that actually
// respected the 16:9 aspect ratio, and the same endpoint also accepted an
// image+text input (image-to-image) the same way. Default model below;
// override via GOOGLE_IMAGE_MODEL if this one is ever retired.
import "server-only";
import sharp from "sharp";
import { readFile } from "node:fs/promises";
import path from "node:path";

export type GeneratePosterInput = {
  /** Dynamic prompt base — the caller (UI) prefills this from
   *  title/genre/synopsis and lets the user edit it freely. */
  prompt: string;
  aspectRatio?: string; // "16:9" default
  /** Explicit on-poster text. Empty/unset -> the prompt asks for no text at
   *  all, rather than letting the model hallucinate random lettering. */
  posterText?: string;
  /** Image-to-image: base64 (no data: prefix) of a user-uploaded source image. */
  sourceImageBase64?: string;
  sourceMimeType?: string;
  /** Creator/owner avatar (data URL, "/uploads/…" path, or http(s) URL) to
   *  composite into the result — only used when withLogo is true. */
  ownerAvatarUrl?: string;
  withLogo?: boolean;
};

export type GeneratePosterResult = { imageBase64: string; mimeType: string };

// Fixed, non-editable prompt suffix — always appended, never exposed to the
// user-editable prompt field in the UI.
const STATIC_PROMPT_SUFFIX =
  "cinematic film poster, 16:9 aspect ratio, 4K ultra high detail, professional dramatic lighting, sharp focus, high quality";

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const TIMEOUT_MS = 30_000; // image generation is slower than the plain-text translate call

function apiKey(): string {
  const key = process.env.GOOGLE_IMAGE_API_KEY;
  if (!key) throw new Error("Poster generation is not configured (GOOGLE_IMAGE_API_KEY is not set).");
  return key;
}

function modelName(): string {
  return process.env.GOOGLE_IMAGE_MODEL || "gemini-3-pro-image";
}

function buildPromptText(prompt: string, posterText?: string): string {
  const textInstruction = posterText?.trim()
    ? `with the text "${posterText.trim()}" prominently displayed`
    : "no text, no letters, no words";
  return [prompt.trim(), STATIC_PROMPT_SUFFIX, textInstruction].filter(Boolean).join(", ");
}

type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

async function callGemini(parts: GeminiPart[], aspectRatio: string): Promise<GeneratePosterResult> {
  const url = `${API_BASE}/${modelName()}:generateContent?key=${apiKey()}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: {
          responseModalities: ["IMAGE"],
          imageConfig: { aspectRatio },
        },
      }),
    });
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") throw new Error("Poster generation timed out.");
    throw new Error("Poster generation failed: network error.");
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Poster generation failed (HTTP ${res.status}): ${body.slice(0, 300)}`);
  }

  const json = await res.json().catch(() => null);
  const responseParts = json?.candidates?.[0]?.content?.parts as
    | Array<{ inlineData?: { data: string; mimeType: string } }>
    | undefined;
  const imagePart = responseParts?.find((p) => p.inlineData?.data);
  if (!imagePart?.inlineData) {
    throw new Error("Poster generation returned no image.");
  }
  return { imageBase64: imagePart.inlineData.data, mimeType: imagePart.inlineData.mimeType || "image/jpeg" };
}

/** Loads a User.avatar value into a Buffer for compositing. Accepts a data
 *  URL, a "/uploads/…" path (read straight off disk), or an http(s) URL.
 *  Returns null on any failure — the logo overlay is a nice-to-have and
 *  should never fail the whole poster generation. */
async function loadAvatarBuffer(avatarUrl: string): Promise<Buffer | null> {
  try {
    if (avatarUrl.startsWith("data:")) {
      const b64 = avatarUrl.split(",")[1] || "";
      return b64 ? Buffer.from(b64, "base64") : null;
    }
    if (avatarUrl.startsWith("/uploads/")) {
      const abs = path.join(process.cwd(), "public", avatarUrl);
      return await readFile(abs);
    }
    if (/^https?:\/\//.test(avatarUrl)) {
      const r = await fetch(avatarUrl);
      if (!r.ok) return null;
      return Buffer.from(await r.arrayBuffer());
    }
    return null;
  } catch {
    return null;
  }
}

/** Composites the creator's avatar into the bottom-right corner of the
 *  generated poster — real pixel compositing via sharp, not a prompt
 *  instruction, since Gemini can't reliably reproduce an exact logo. The
 *  avatar is rounded into a circle and inset with a small margin so it reads
 *  as a watermark rather than a sticker. Falls back to the un-watermarked
 *  poster if the avatar can't be loaded or the composite fails. */
async function overlayLogo(posterBuffer: Buffer, avatarUrl: string): Promise<Buffer> {
  const avatarBuffer = await loadAvatarBuffer(avatarUrl);
  if (!avatarBuffer) return posterBuffer;

  try {
    const poster = sharp(posterBuffer);
    const meta = await poster.metadata();
    const posterWidth = meta.width || 1600;
    const posterHeight = meta.height || 900;
    const logoSize = Math.max(48, Math.round(posterWidth * 0.12));
    const margin = Math.round(posterWidth * 0.02);

    const circleMask = Buffer.from(
      `<svg width="${logoSize}" height="${logoSize}"><circle cx="${logoSize / 2}" cy="${logoSize / 2}" r="${logoSize / 2}" fill="#fff"/></svg>`,
    );

    const roundedLogo = await sharp(avatarBuffer)
      .resize(logoSize, logoSize, { fit: "cover" })
      .composite([{ input: circleMask, blend: "dest-in" }])
      .png()
      .toBuffer();

    return await sharp(posterBuffer)
      .composite([
        { input: roundedLogo, left: posterWidth - logoSize - margin, top: posterHeight - logoSize - margin },
      ])
      .jpeg({ quality: 92 })
      .toBuffer();
  } catch {
    return posterBuffer;
  }
}

export async function generatePoster(input: GeneratePosterInput): Promise<GeneratePosterResult> {
  const aspectRatio = input.aspectRatio || "16:9";
  const promptText = buildPromptText(input.prompt, input.posterText);

  const parts: GeminiPart[] = [];
  if (input.sourceImageBase64) {
    // Image-to-image: Gemini image models accept a text instruction + an
    // inlineData image part in the same request.
    parts.push({ text: `Recreate this as a cinematic film poster: ${promptText}` });
    parts.push({ inlineData: { mimeType: input.sourceMimeType || "image/jpeg", data: input.sourceImageBase64 } });
  } else {
    parts.push({ text: promptText });
  }

  const result = await callGemini(parts, aspectRatio);

  if (input.withLogo && input.ownerAvatarUrl) {
    const composited = await overlayLogo(Buffer.from(result.imageBase64, "base64"), input.ownerAvatarUrl);
    return { imageBase64: composited.toString("base64"), mimeType: "image/jpeg" };
  }

  return result;
}
