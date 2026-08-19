#!/usr/bin/env node
// Read-only parity check between the uploads tree and the S3 bucket, run
// before a DNS cutover — the file-level twin of verify-parity.mts.
//
// Compares a local directory (the rsync staging copy migrate-uploads.sh
// already produces under ./.migration/uploads, or the live Hostinger
// UPLOADS_DIR if run there) against the bucket, and reports files present on
// only one side, plus files whose size differs. Never writes to S3 — only
// ListObjectsV2 / HeadObject-equivalent metadata from the listing itself.
//
// Run:
//   LOCAL_DIR=./.migration/uploads BUCKET=igovazd-uploads \
//     node scripts/aws/verify-uploads-parity.mjs
//
// Same S3_PREFIX / AWS_REGION / S3_ENDPOINT contract as src/lib/storage/s3-driver.ts
// — S3_ENDPOINT lets this run against a local MinIO for a dry run.
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";

const LOCAL_DIR = process.env.LOCAL_DIR;
const BUCKET = process.env.BUCKET;
if (!LOCAL_DIR || !BUCKET) {
  console.error("missing env var: LOCAL_DIR and/or BUCKET");
  process.exit(1);
}
const PREFIX = (process.env.S3_PREFIX ?? "uploads").replace(/^\/+|\/+$/g, "");
const endpoint = process.env.S3_ENDPOINT;
const client = new S3Client({
  region: process.env.AWS_REGION || "eu-central-1",
  ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
});

async function listLocal(dir) {
  const out = new Map(); // relative key (posix, no leading slash) -> size
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  for (const e of entries) {
    if (!e.isFile()) continue;
    const abs = path.join(e.parentPath ?? e.path, e.name);
    const rel = path.relative(dir, abs).split(path.sep).join("/");
    out.set(rel, (await stat(abs)).size);
  }
  return out;
}

async function listBucket() {
  const out = new Map(); // same relative key as the local side -> size
  let token;
  do {
    // Paginated on purpose — ListObjectsV2 caps at 1000 keys, and a silent
    // stop at the first page is exactly the bug this script exists to catch.
    const res = await client.send(
      new ListObjectsV2Command({ Bucket: BUCKET, Prefix: `${PREFIX}/`, ContinuationToken: token }),
    );
    for (const o of res.Contents ?? []) {
      if (!o.Key || o.Key.endsWith("/")) continue;
      out.set(o.Key.slice(PREFIX.length + 1), o.Size ?? 0);
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return out;
}

async function main() {
  const [local, bucket] = await Promise.all([listLocal(LOCAL_DIR), listBucket()]);
  console.log(`local: ${local.size} files in ${LOCAL_DIR}`);
  console.log(`s3:    ${bucket.size} objects in s3://${BUCKET}/${PREFIX}/`);

  const onlyLocal = [...local.keys()].filter((k) => !bucket.has(k));
  const onlyBucket = [...bucket.keys()].filter((k) => !local.has(k));
  const sizeMismatch = [...local.entries()].filter(([k, size]) => bucket.has(k) && bucket.get(k) !== size);

  if (onlyLocal.length) {
    console.log(`\nonly on local (${onlyLocal.length}):`);
    for (const k of onlyLocal.slice(0, 50)) console.log(`  ${k}`);
    if (onlyLocal.length > 50) console.log(`  … and ${onlyLocal.length - 50} more`);
  }
  if (onlyBucket.length) {
    console.log(`\nonly in s3 (${onlyBucket.length}):`);
    for (const k of onlyBucket.slice(0, 50)) console.log(`  ${k}`);
    if (onlyBucket.length > 50) console.log(`  … and ${onlyBucket.length - 50} more`);
  }
  if (sizeMismatch.length) {
    console.log(`\nsize mismatch (${sizeMismatch.length}):`);
    for (const [k, size] of sizeMismatch.slice(0, 50)) console.log(`  ${k}  local=${size}  s3=${bucket.get(k)}`);
    if (sizeMismatch.length > 50) console.log(`  … and ${sizeMismatch.length - 50} more`);
  }

  const failed = onlyLocal.length > 0 || onlyBucket.length > 0 || sizeMismatch.length > 0;
  if (failed) {
    console.error("\nuploads parity check FAILED — do not switch DNS.");
    process.exit(1);
  }
  console.log("\nuploads parity OK.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
