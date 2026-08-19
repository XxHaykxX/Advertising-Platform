/* Prepares a local MinIO bucket so STORAGE_DRIVER=s3 can be run and tested
 * without an AWS account.
 *
 * MinIO speaks the S3 API, which is the whole point: the s3 driver, the e2e
 * upload suite and the CloudFront-style public read all behave the same against
 * it, so "the S3 path is written but nobody has ever run it" stops being true
 * weeks before a real bucket exists.
 *
 *   docker run -d --name igovazd-minio -p 9100:9000 \
 *     -e MINIO_ROOT_USER=minioadmin -e MINIO_ROOT_PASSWORD=minioadmin \
 *     minio/minio server /data
 *   node scripts/aws/minio-dev.mjs
 *
 * Then run the app with:
 *   STORAGE_DRIVER=s3 S3_BUCKET=igovazd-uploads S3_ENDPOINT=http://127.0.0.1:9100 \
 *   AWS_ACCESS_KEY_ID=minioadmin AWS_SECRET_ACCESS_KEY=minioadmin \
 *   CDN_BASE_URL=http://127.0.0.1:9100/igovazd-uploads \
 *   NEXT_PUBLIC_MEDIA_ORIGIN=http://127.0.0.1:9100/igovazd-uploads npx next dev -p 3012
 *
 * ⚠️ One thing this setup CANNOT exercise as-is: `/_next/image`. Next refuses to
 * fetch an upstream image that resolves to a private or loopback address —
 * "resolved to private ip" from its SSRF guard — and MinIO is on 127.0.0.1, so
 * the optimizer answers 400 no matter how correct images.remotePatterns is. It
 * is an artifact of testing locally, not a finding: a real CloudFront hostname
 * resolves to public addresses and passes. To check the optimizer here, add
 * `dangerouslyAllowLocalIP: true` to next.config.ts for the run and take it out
 * again — it must never be committed. Measured 2026-08-19: with the flag, 200
 * and a real image/webp body.
 */
import {
  S3Client,
  CreateBucketCommand,
  PutBucketPolicyCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";

const BUCKET = process.env.S3_BUCKET || "igovazd-uploads";
const ENDPOINT = process.env.S3_ENDPOINT || "http://127.0.0.1:9100";

const client = new S3Client({
  region: "eu-central-1",
  endpoint: ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "minioadmin",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "minioadmin",
  },
});

try {
  await client.send(new HeadBucketCommand({ Bucket: BUCKET }));
  console.log(`bucket ${BUCKET} already exists`);
} catch {
  await client.send(new CreateBucketCommand({ Bucket: BUCKET }));
  console.log(`bucket ${BUCKET} created`);
}

// Anonymous read on uploads/* — the local stand-in for CloudFront serving the
// bucket to the public. Deliberately read-only and deliberately scoped to the
// one prefix: the real bucket blocks public access entirely and is reached
// through an Origin Access Control instead, so anything broader here would be
// testing a setup we are never going to deploy.
await client.send(
  new PutBucketPolicyCommand({
    Bucket: BUCKET,
    Policy: JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { AWS: ["*"] },
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${BUCKET}/uploads/*`],
        },
      ],
    }),
  }),
);
console.log(`public read granted on ${BUCKET}/uploads/*`);
