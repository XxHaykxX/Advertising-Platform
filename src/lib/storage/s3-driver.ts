// S3 driver. Selected by STORAGE_DRIVER=s3; inert otherwise.
//
// Object keys are `<S3_PREFIX>/<key>` — with the default prefix "uploads" that
// makes the object key identical to the public path the database already
// stores, which is what lets a single CloudFront behaviour (`/uploads/*` → this
// bucket) serve every file with no origin-path rewriting and no database
// migration. scripts/aws/migrate-uploads.sh uploads to the same layout.
import "server-only";
import { contentTypeForKey, isSafeKey } from "./keys";
import type { PutOptions, StorageDriver, StoredFile } from "./types";

// Matches the Cache-Control the Node route has always sent. Safe because upload
// filenames are content-unique (timestamp + uuid) and never rewritten in place.
const CACHE_CONTROL = "public, max-age=31536000, immutable";

function bucket(): string {
  const b = process.env.S3_BUCKET;
  if (!b) throw new Error("STORAGE_DRIVER=s3 but S3_BUCKET is not set");
  return b;
}

function prefix(): string {
  return (process.env.S3_PREFIX ?? "uploads").replace(/^\/+|\/+$/g, "");
}

function objectKey(key: string): string {
  if (!isSafeKey(key)) throw new Error(`Unsafe storage key: ${JSON.stringify(key)}`);
  const p = prefix();
  return p ? `${p}/${key}` : key;
}

/** Strips the prefix back off, so list() returns the same relative keys the fs
 *  driver does and callers never learn which driver they are on. */
function stripPrefix(objKey: string): string {
  const p = prefix();
  return p && objKey.startsWith(`${p}/`) ? objKey.slice(p.length + 1) : objKey;
}

// The SDK is imported lazily and memoised. A static import would pull several
// megabytes of AWS client into every request path on Hostinger, where this
// driver is never selected — and Hostinger is the environment with the least
// memory to spare.
type S3Module = typeof import("@aws-sdk/client-s3");
let loaded: Promise<{ mod: S3Module; client: InstanceType<S3Module["S3Client"]> }> | null = null;

function s3() {
  loaded ??= (async () => {
    const mod = await import("@aws-sdk/client-s3");
    // No explicit credentials: on Fargate the task role is picked up from the
    // container credentials endpoint by the default provider chain. Handing the
    // SDK static keys here would mean keys to rotate and keys to leak. The same
    // chain reads AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY when they are set,
    // which is how the local MinIO run below authenticates.
    //
    // S3_ENDPOINT points the client at something other than AWS. Its reason to
    // exist is that this driver is otherwise unverifiable until somebody has
    // provisioned a real bucket: with an endpoint it runs against MinIO in
    // Docker, and e2e/uploads.spec.ts passes over it unchanged. Path-style
    // addressing comes with it — virtual-host style needs wildcard DNS, which
    // localhost does not have.
    const endpoint = process.env.S3_ENDPOINT;
    const client = new mod.S3Client({
      region: process.env.AWS_REGION || "eu-central-1",
      ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
    });
    return { mod, client };
  })();
  return loaded;
}

/** 404 / NoSuchKey are answers, not failures — both media libraries and the
 *  poster attach path treat "not there" as a normal outcome. Anything else has
 *  to keep throwing, or a misconfigured bucket looks like an empty one. */
function isNotFound(e: unknown): boolean {
  const err = e as { name?: string; $metadata?: { httpStatusCode?: number } };
  return err?.name === "NoSuchKey" || err?.name === "NotFound" || err?.$metadata?.httpStatusCode === 404;
}

export const s3Driver: StorageDriver = {
  name: "s3",

  async put(key: string, body: Buffer, opts?: PutOptions): Promise<void> {
    const { mod, client } = await s3();
    await client.send(
      new mod.PutObjectCommand({
        Bucket: bucket(),
        Key: objectKey(key),
        Body: body,
        ContentType: opts?.contentType ?? contentTypeForKey(key),
        ContentDisposition: opts?.contentDisposition,
        CacheControl: CACHE_CONTROL,
      }),
    );
  },

  async get(key: string): Promise<Buffer | null> {
    const { mod, client } = await s3();
    try {
      const res = await client.send(new mod.GetObjectCommand({ Bucket: bucket(), Key: objectKey(key) }));
      const bytes = await res.Body!.transformToByteArray();
      return Buffer.from(bytes);
    } catch (e) {
      if (isNotFound(e)) return null;
      throw e;
    }
  },

  async head(key: string): Promise<{ size: number } | null> {
    const { mod, client } = await s3();
    try {
      const res = await client.send(new mod.HeadObjectCommand({ Bucket: bucket(), Key: objectKey(key) }));
      return { size: res.ContentLength ?? 0 };
    } catch (e) {
      if (isNotFound(e)) return null;
      throw e;
    }
  },

  async remove(key: string): Promise<void> {
    const { mod, client } = await s3();
    // S3 answers 204 for a key that was never there, so there is no
    // "already gone" branch to write — it is the same call either way.
    await client.send(new mod.DeleteObjectCommand({ Bucket: bucket(), Key: objectKey(key) }));
  },

  async list(listPrefix: string): Promise<StoredFile[]> {
    const { mod, client } = await s3();
    const p = prefix();
    const full = [p, listPrefix].filter(Boolean).join("/");

    const out: StoredFile[] = [];
    let token: string | undefined;
    do {
      // Paginated on purpose: ListObjectsV2 caps at 1000 keys per call and the
      // media library must not silently stop at the first page once the bucket
      // holds more than that.
      const res = await client.send(
        new mod.ListObjectsV2Command({
          Bucket: bucket(),
          Prefix: full ? `${full}/` : undefined,
          ContinuationToken: token,
        }),
      );
      for (const o of res.Contents ?? []) {
        if (!o.Key || o.Key.endsWith("/")) continue; // folder placeholder objects
        out.push({
          key: stripPrefix(o.Key),
          size: o.Size ?? 0,
          mtime: o.LastModified?.getTime() ?? 0,
        });
      }
      token = res.IsTruncated ? res.NextContinuationToken : undefined;
    } while (token);

    return out.sort((a, b) => b.mtime - a.mtime);
  },

  publicUrl(key: string): string | null {
    const base = process.env.CDN_BASE_URL;
    if (!base) return null;
    return `${base.replace(/\/+$/, "")}/uploads/${key}`;
  },

  async presignPut(key: string, contentType: string): Promise<string | null> {
    const { mod, client } = await s3();
    // Second lazy import, same reason as the client itself: the presigner is
    // another few hundred kilobytes that Hostinger must never load, and this
    // driver is not selected there.
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    return getSignedUrl(
      client,
      new mod.PutObjectCommand({
        Bucket: bucket(),
        Key: objectKey(key),
        ContentType: contentType,
        CacheControl: CACHE_CONTROL,
      }),
      {
        // Long enough for the browser to start a big upload on a slow link,
        // short enough that a leaked URL is not a standing write grant. It
        // bounds when the PUT may *begin*, not how long it may run.
        expiresIn: 900,
        // ⚠️ Not optional, and not obvious. Setting ContentType on the command
        // above only states an intent — by default the presigner signs `host`
        // and nothing else, so the browser may send any Content-Type it likes
        // and the object is stored under that one instead. Measured against a
        // real S3-compatible server on 2026-08-19: without this line a clip
        // uploaded as `text/html` is stored as text/html and then served as
        // text/html. That is the IA-44 shape all over again — a file the site
        // vouches for, executing as markup in the origin that serves it.
        //
        // Naming it here makes the type part of the signature, so a mismatched
        // header fails the request. It is what keeps the server's MIME
        // allowlist meaningful after the server stops seeing the bytes.
        signableHeaders: new Set(["content-type"]),
      },
    );
  },
};
