/** Grab a still frame from a video File, in the browser, as a small JPEG.
 *
 *  Used at upload time so the media library has a real thumbnail for every
 *  clip. The alternative — pointing a <video> tag at the stored file and
 *  letting it paint its own first frame — only works once the browser has the
 *  file's metadata, and for a 40 MB mp4 whose moov atom sits at the end that
 *  means fetching the whole file. In practice most tiles just stayed blank
 *  (user report 2026-07-26). Server-side extraction would need ffmpeg, which
 *  the shared host doesn't have.
 *
 *  Returns null on anything unexpected (codec the browser can't decode, a
 *  seek that never completes, a tainted canvas) — the caller then uploads the
 *  video without a poster, which is the previous behaviour. */
export async function captureVideoPoster(file: File, maxWidth = 640): Promise<File | null> {
  if (typeof document === "undefined") return null;

  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "metadata";
  video.src = url;

  try {
    const blob = await new Promise<Blob | null>((resolve) => {
      // Don't hang the upload on a file the browser won't decode.
      const timer = setTimeout(() => resolve(null), 8000);
      const finish = (value: Blob | null) => {
        clearTimeout(timer);
        resolve(value);
      };

      video.onerror = () => finish(null);
      video.onloadeddata = () => {
        // A hair in, not 0: the opening frame of an encode is often black.
        const target = Math.min(0.1, (video.duration || 1) / 2);
        if (video.currentTime < target) {
          video.currentTime = target;
        } else {
          draw();
        }
      };
      video.onseeked = draw;

      function draw() {
        try {
          const scale = Math.min(1, maxWidth / (video.videoWidth || maxWidth));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round((video.videoWidth || maxWidth) * scale));
          canvas.height = Math.max(1, Math.round((video.videoHeight || maxWidth * 0.5625) * scale));
          const ctx = canvas.getContext("2d");
          if (!ctx) return finish(null);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((b) => finish(b), "image/jpeg", 0.8);
        } catch {
          finish(null);
        }
      }
    });

    if (!blob) return null;
    return new File([blob], `${file.name}.jpg`, { type: "image/jpeg" });
  } finally {
    video.src = "";
    URL.revokeObjectURL(url);
  }
}

/** The stored poster for a video path, by convention "<video>.jpg". */
export function posterPathFor(videoPath: string): string {
  return `${videoPath}.jpg`;
}

/** True for a stored poster frame — those are an implementation detail of the
 *  video tile and shouldn't show up as separate items in the library. */
export function isPosterPath(path: string): boolean {
  return /\.(mp4|webm)\.jpg$/i.test(path);
}
