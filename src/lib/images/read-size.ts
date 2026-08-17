/** Pixel size of a file the visitor just picked, read in the browser before
 *  anything is uploaded (IA-62). Used to refuse a source that is smaller than
 *  what the destination folder needs — see imageBelowRequired in size-hint.ts.
 *
 *  Returns null when the size cannot be determined (a format the browser will
 *  not decode, a revoked object URL, an SVG). Callers treat null as "let it
 *  through": the check exists to catch an honest mistake, not to be the gate
 *  that decides whether a file may be stored. */
export async function readImageSize(file: File): Promise<{ w: number; h: number } | null> {
  // createImageBitmap decodes off the main thread and is what every current
  // browser offers; the <img> fallback covers the rest without pulling in a
  // decoder of our own.
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      const size = { w: bitmap.width, h: bitmap.height };
      bitmap.close();
      return size;
    } catch {
      /* fall through to the <img> path */
    }
  }

  const url = URL.createObjectURL(file);
  try {
    return await new Promise<{ w: number; h: number } | null>((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => resolve(null);
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
