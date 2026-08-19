import { describe, it, expect, beforeAll } from "vitest";
import { s3Driver } from "@/lib/storage/s3-driver";

/* One assertion, and it exists because measurement contradicted the code's own
   comment (2026-08-19).

   Setting ContentType on a PutObjectCommand only states an intent. By default
   the presigner signs `host` and nothing else, so a browser may send whatever
   Content-Type it likes and the object is stored — and later served — under
   that one instead. Verified against a real S3-compatible server: a clip
   uploaded as text/html came back as text/html, which is the IA-44 shape all
   over again, a file the site vouches for executing as markup in the origin
   that serves it. Naming content-type in signableHeaders is what fixes it, and
   its absence is invisible in every test that only checks the happy path.

   So this checks the signature itself rather than any behaviour: the header
   must be listed among the signed ones. No network, no bucket. */

beforeAll(() => {
  process.env.S3_BUCKET = "test-bucket";
  process.env.AWS_REGION = "eu-central-1";
  process.env.AWS_ACCESS_KEY_ID = "test";
  process.env.AWS_SECRET_ACCESS_KEY = "test";
  process.env.S3_ENDPOINT = "http://127.0.0.1:9100";
});

describe("s3Driver.presignPut", () => {
  it("signs the content-type, so a mismatched header is refused", async () => {
    const url = await s3Driver.presignPut("videos/probe.mp4", "video/mp4");
    expect(url).toBeTruthy();
    const signed = new URL(url!).searchParams.get("X-Amz-SignedHeaders") ?? "";
    expect(signed.split(";")).toContain("content-type");
  });

  it("signs a URL that expires", async () => {
    const url = await s3Driver.presignPut("videos/probe.mp4", "video/mp4");
    expect(new URL(url!).searchParams.get("X-Amz-Expires")).toBe("900");
  });
});
