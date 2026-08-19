// Browser-only. The one client-side entry for uploading a clip.
//
// Video has three front doors today — the XHR route (media-field), and the
// uploadImage / uploadMemberImage Server Actions (media-picker, media-manager)
// — and all three used to end in the same server-side buffer. Leaving any one
// of them on the old path would leave a way to take the task down, so they all
// come through here instead, and the branching lives in one place rather than
// three.
//
// The mode is decided on the SERVER (see presignVideoUpload): "presigned" when
// the storage driver can sign a PUT, "direct" when it cannot — local disk, i.e.
// dev and Hostinger. Nothing here inspects env or guesses which storage is
// behind it, which is what keeps main deployable to Hostinger unchanged.
import { presignVideoUpload } from "@/lib/actions/uploads";
import { presignMemberVideoUpload, saveMemberVideoPoster } from "@/lib/actions/member-uploads";
import { saveVideoPoster } from "@/lib/actions/uploads";
import type { UploadProgressEvent, XhrUploadResult } from "@/lib/upload-xhr";

export type VideoUploadOptions = {
  scope?: "staff" | "member";
  dir: string;
  /** The still the browser captured off the clip. Written after the bytes
   *  land — and that write is also what proves they landed, see below. */
  poster?: Blob | null;
  onProgress?: (progress: UploadProgressEvent) => void;
  signal?: AbortSignal;
  errorLabel?: string;
};

/** PUT one file to an absolute URL, reporting progress. XHR rather than fetch
 *  for the same reason upload-xhr.ts uses it: only XHR fires upload.onprogress,
 *  and on a phone clip that is the difference between a bar and a spinner. */
function putViaXhr(
  url: string,
  file: File,
  contentType: string,
  opts: { onProgress?: (p: UploadProgressEvent) => void; signal?: AbortSignal },
): Promise<{ ok: boolean; canceled?: boolean; status?: number }> {
  return new Promise((resolve) => {
    if (opts.signal?.aborted) return resolve({ ok: false, canceled: true });

    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    // Must match the type signed into the URL exactly — S3 rejects the PUT
    // otherwise. That rejection is the point: it is what keeps the server's
    // MIME allowlist meaningful once the server stops seeing the bytes.
    xhr.setRequestHeader("Content-Type", contentType);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) opts.onProgress?.({ loaded: e.loaded, total: e.total });
    };
    xhr.onload = () => resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status });
    xhr.onerror = () => resolve({ ok: false });
    xhr.ontimeout = () => resolve({ ok: false });
    xhr.onabort = () => resolve({ ok: false, canceled: true });

    opts.signal?.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(file);
  });
}

/** Ask the server where this clip should go, then send it there.
 *
 *  Returns the same shape as uploadViaXhr so the call sites keep the handling
 *  they already have. `null` means the server said "direct" — the caller falls
 *  back to whatever it did before, unchanged.
 *
 *  Ordering matters and is deliberate: the caller only receives a `path` after
 *  the poster step, and that step head-checks the object server-side. So an
 *  abandoned upload leaves an orphan in the bucket (which
 *  scripts/aws/verify-media-refs.mts already reports) and never a database row
 *  pointing at a file that never arrived. Of the two ways this can fail, that
 *  is the recoverable one, and picking it is a decision rather than an
 *  accident. */
export async function uploadVideoDirect(
  file: File,
  options: VideoUploadOptions,
): Promise<XhrUploadResult | null> {
  const { scope = "staff", dir, poster, onProgress, signal, errorLabel = "Upload failed." } = options;

  const presign = scope === "member" ? presignMemberVideoUpload : presignVideoUpload;
  const ticket = await presign({ dir, contentType: file.type, filename: file.name });

  if ("error" in ticket) return { error: ticket.error };
  if (ticket.mode === "direct") return null;

  const put = await putViaXhr(ticket.url, file, file.type || `video/${file.name.split(".").pop()}`, {
    onProgress,
    signal,
  });
  if (put.canceled) return { canceled: true };
  if (!put.ok) return { error: put.status ? `${errorLabel} (HTTP ${put.status})` : errorLabel };

  // Also the confirmation — see the note above. Without a poster there is
  // nothing to write and nothing to confirm with, so the clip is taken at its
  // word; the tile falls back to the <video> element, exactly as it does today
  // when a poster capture fails.
  if (poster && poster.size > 0) {
    const fd = new FormData();
    fd.append("videoPath", ticket.path);
    fd.append("poster", poster, "poster.jpg");
    const save = scope === "member" ? saveMemberVideoPoster : saveVideoPoster;
    const res = await save(fd);
    if (res.error) return { error: res.error };
  }

  return { path: ticket.path };
}
