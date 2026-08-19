/* Where uploaded files live.
 *
 * One switch, `STORAGE_DRIVER`:
 *
 *   unset | "fs"   local disk under UPLOADS_DIR, served by the Node route.
 *                  The default, and what local dev and Hostinger use.
 *   "s3"           an S3 bucket, served by CloudFront.
 *
 * fs is the default deliberately rather than "whichever env looks like AWS".
 * The whole point of the migration plan is that `main` stays deployable to
 * Hostinger the entire time; a driver that guessed from NODE_ENV or the
 * presence of an AWS variable would flip the live site the first time someone
 * set an unrelated variable.
 */
import "server-only";
import { fsDriver } from "./fs-driver";
import { s3Driver } from "./s3-driver";
import type { StorageDriver } from "./types";

export type { StorageDriver, StoredFile, PutOptions } from "./types";
export {
  safeSegment,
  isSafeKey,
  publicPathToKey,
  keyToPublicPath,
  joinKey,
  contentTypeForKey,
  contentDispositionForKey,
} from "./keys";

/** Resolved per call rather than memoised at import: the tests flip the
 *  variable between cases, and the cost is one string comparison. */
export function storage(): StorageDriver {
  return process.env.STORAGE_DRIVER === "s3" ? s3Driver : fsDriver;
}
