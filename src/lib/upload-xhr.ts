// Browser-only. Posts one file to /api/uploads over XMLHttpRequest.
//
// Why not the Server Action (or fetch): neither reports how much of the body
// has actually gone out. A Server Action gives the client no upload events at
// all, and fetch()'s ReadableStream request bodies aren't usable here either —
// only XHR fires `upload.onprogress`. On a 50 MB trailer over a home
// connection that is the difference between a spinner and a bar.
//
// The route it talks to enforces exactly the same auth and validation as the
// actions (see src/app/api/uploads/route.ts).

export type UploadProgressEvent = { loaded: number; total: number };

export type XhrUploadOptions = {
  /** "member" routes the write into the caller's own /uploads/members/<id>/
   *  namespace, same as uploadMemberImage. */
  scope?: "staff" | "member";
  onProgress?: (progress: UploadProgressEvent) => void;
  /** Abort an upload in flight (the zone's Cancel control). */
  signal?: AbortSignal;
  /** Shown when the request never came back with an answer we can read —
   *  offline, the host cutting the request, a 502, a login page instead of
   *  JSON. Caller-supplied: this runs both in the English admin panel and in a
   *  member's own language. */
  errorLabel?: string;
};

/** Exactly one of these is set: `path` on success, `error` on a rejection the
 *  server explained or a transport failure, `canceled` when the caller aborted
 *  (never an error — nothing went wrong). */
export type XhrUploadResult = { path?: string; error?: string; canceled?: boolean };

export function uploadViaXhr(fd: FormData, options: XhrUploadOptions = {}): Promise<XhrUploadResult> {
  const { scope = "staff", onProgress, signal, errorLabel = "Upload failed." } = options;

  return new Promise<XhrUploadResult>((resolve) => {
    if (signal?.aborted) return resolve({ canceled: true });

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/uploads?scope=${scope}`);

    xhr.upload.onprogress = (e) => {
      // Without Content-Length there is nothing to be a percentage OF; the UI
      // falls back to an indeterminate state rather than inventing one.
      if (e.lengthComputable) onProgress?.({ loaded: e.loaded, total: e.total });
    };

    xhr.onload = () => {
      // The route answers JSON for both outcomes, including 400. Anything else
      // means the request was intercepted (a redirect to the login page follows
      // transparently and returns 200 + HTML) — that must not read as success.
      try {
        const body = JSON.parse(xhr.responseText) as XhrUploadResult;
        if (body.path || body.error) return resolve(body);
      } catch {
        /* not JSON — fall through to the generic failure below */
      }
      resolve({ error: `${errorLabel} (HTTP ${xhr.status})` });
    };
    xhr.onerror = () => resolve({ error: errorLabel });
    xhr.ontimeout = () => resolve({ error: errorLabel });
    xhr.onabort = () => resolve({ canceled: true });

    signal?.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(fd);
  });
}
