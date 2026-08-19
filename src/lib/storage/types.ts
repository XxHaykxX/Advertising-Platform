/* The five operations the app actually performs on uploaded files.
 *
 * Derived from the call sites, not invented up front: writing (uploads, AI
 * posters, video poster frames), reading (the avatar the image generator feeds
 * back to Gemini), existence checks (attaching a poster to an already-stored
 * clip), deletion (both media libraries) and listing (both media libraries).
 * Nothing else touches storage, so nothing else belongs here.
 */

export type StoredFile = {
  /** Relative key, e.g. "videos/1723-ab.mp4". */
  key: string;
  size: number;
  /** Epoch ms. Both media libraries sort by it, newest first. */
  mtime: number;
};

export type PutOptions = {
  contentType?: string;
  /** Stored ON the object by the S3 driver — CloudFront serves these bytes
   *  without our code in the path, so a response header would never be added. */
  contentDisposition?: string;
};

export interface StorageDriver {
  readonly name: "fs" | "s3";

  put(key: string, body: Buffer, opts?: PutOptions): Promise<void>;
  get(key: string): Promise<Buffer | null>;
  head(key: string): Promise<{ size: number } | null>;
  /** Missing is success — both delete paths treat "already gone" as done so the
   *  UI can prune a stale entry. */
  remove(key: string): Promise<void>;
  list(prefix: string): Promise<StoredFile[]>;

  /** Absolute URL a browser should fetch this key from, or null when the app
   *  has to serve the bytes itself (the fs driver — local dev and Hostinger). */
  publicUrl(key: string): string | null;

  /** A URL the browser may PUT this exact key to, or null when the driver has
   *  no such concept — the fs driver, i.e. local dev and Hostinger, where the
   *  caller must fall back to posting the bytes through the app.
   *
   *  Same null-means-fall-back shape as publicUrl() above, and for the same
   *  reason: which mode is live is decided here, on the server, so no client
   *  has to know or guess which storage it is talking to.
   *
   *  Exists because uploads are the one place where passing bytes through the
   *  app is not merely wasteful but fatal — a single 500 MB clip peaks at four
   *  to five times its own size in resident memory, which is more than the
   *  whole task. The signed URL is scoped to one key, one method and one
   *  content type, and expires; that scoping is the containment, not CORS. */
  presignPut(key: string, contentType: string): Promise<string | null>;
}
