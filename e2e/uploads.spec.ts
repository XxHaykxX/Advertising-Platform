import { test, expect, type Page, type APIResponse } from "@playwright/test";
import {
  STAFF_EMAIL,
  STAFF_PASSWORD,
  CREATOR_EMAIL,
  CREATOR_PASSWORD,
} from "./global-setup";

/* Uploads and media serving — the surface the AWS migration actually changes.
 *
 * Deliberately driven through POST /api/uploads rather than through the admin
 * MediaPicker UI. The picker is one of two front doors to the same code (the
 * other is a Server Action), both funnel into storeUpload(), and the UI adds
 * dropzones, crop dialogs and progress bars that break for reasons having
 * nothing to do with where the bytes end up. What this suite has to answer is
 * "does a file survive the round trip, and does it come back with the right
 * headers" — and that answer must stay identical whether STORAGE_DRIVER is fs
 * or s3, which is exactly what makes it the pre-cutover check:
 *
 *   E2E_BASE_URL=https://<aws-host> npx playwright test e2e/uploads.spec.ts
 *
 * ⚠️ The server under test MUST have UPLOADS_DIR pointing OUTSIDE the app, the
 * way production does. With the local-dev default (public/uploads) Next's own
 * static handler serves /uploads/… straight from public/ and our route never
 * runs — so the PDF keeps its Content-Disposition assertion unmet and video
 * ranges are answered by a different code path than the one that ships. Run it
 * as:
 *
 *   UPLOADS_DIR=/tmp/e2e-uploads npx next dev -p 3012
 *   E2E_BASE_URL=http://localhost:3012 npx playwright test e2e/uploads.spec.ts
 *
 * Sec-Fetch-Site: the route rejects a cross-site POST by that header, but only
 * when the header is present — a non-browser client sends none and falls
 * through to the auth gate. Playwright's request context is such a client, so
 * these calls exercise the auth gate, not the origin check. The origin check is
 * a browser-only concern and is covered by task #10's manual pass behind the
 * new load balancer.
 */

// A real 1x1 PNG. sharp has to be able to decode it — a handful of fake bytes
// with a PNG name comes back as "Could not process image", which would look
// like a storage failure.
const PNG_1x1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

// Not a playable clip — nothing decodes it in this path. The video branch
// stores the bytes as they arrive (ffmpeg is absent by design, see task #9), so
// what matters is only that they come back byte-for-byte and support ranges.
const FAKE_MP4 = Buffer.from("0123456789ABCDEFGHIJ");
const REAL_PDF = Buffer.from("%PDF-1.4\n% test deck\n");
const NOT_A_PDF = Buffer.from("<html><script>alert(1)</script></html>");

async function signInMember(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.getByRole("button", { name: "Մուտք", exact: true }).click();
  await page.waitForURL((u) => u.pathname.startsWith("/account"), { timeout: 20000 });
}

async function signInStaff(page: Page) {
  await page.goto("/admin/login");
  await page.fill('input[name="email"]', STAFF_EMAIL);
  await page.fill('input[name="password"]', STAFF_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL((u) => u.pathname.startsWith("/admin") && !u.pathname.endsWith("/login"), {
    timeout: 20000,
  });
}

type UploadArgs = { dir: string; kind: string; name: string; mime: string; body: Buffer; scope?: "member" };

async function upload(page: Page, a: UploadArgs): Promise<APIResponse> {
  const query = a.scope === "member" ? "?scope=member" : "";
  return page.request.post(`/api/uploads${query}`, {
    multipart: {
      dir: a.dir,
      kind: a.kind,
      file: { name: a.name, mimeType: a.mime, buffer: a.body },
    },
  });
}

test.describe("staff uploads", () => {
  test.beforeEach(async ({ page }) => signInStaff(page));

  test("an image round-trips and comes back as an image", async ({ page }) => {
    const res = await upload(page, {
      dir: "posters",
      kind: "image",
      name: "probe.png",
      mime: "image/png",
      body: PNG_1x1,
    });
    expect(res.status(), await res.text()).toBe(200);
    const { path, error } = await res.json();
    expect(error).toBeUndefined();
    // The optimizer re-encodes stills, so the stored extension is NOT the one
    // that was uploaded. Asserting "ends with .png" here is how this test would
    // start failing for a correct implementation.
    expect(path).toMatch(/^\/uploads\/posters\/[\w.-]+$/);

    const served = await page.request.get(path);
    expect(served.status()).toBe(200);
    expect(served.headers()["content-type"]).toMatch(/^image\//);
  });

  test("a video round-trips byte-for-byte and supports seeking", async ({ page }) => {
    const res = await upload(page, {
      dir: "videos",
      kind: "video",
      name: "probe.mp4",
      mime: "video/mp4",
      body: FAKE_MP4,
    });
    expect(res.status(), await res.text()).toBe(200);
    const { path } = await res.json();
    expect(path).toMatch(/\.mp4$/);

    const whole = await page.request.get(path);
    expect(whole.status()).toBe(200);
    expect(whole.headers()["content-type"]).toBe("video/mp4");
    expect(Buffer.from(await whole.body()).equals(FAKE_MP4)).toBe(true);

    // Safari refuses to play a video at all unless the server answers a range
    // request with 206 — this is the assertion that catches "the clip uploaded
    // fine but nobody can watch it".
    const ranged = await page.request.get(path, { headers: { Range: "bytes=5-9" } });
    expect(ranged.status()).toBe(206);
    expect(ranged.headers()["content-range"]).toBe("bytes 5-9/20");
    expect((await ranged.text())).toBe("56789");
  });

  test("a PDF is stored and forced to download rather than render", async ({ page }) => {
    const res = await upload(page, {
      dir: "presentations",
      kind: "doc",
      name: "deck.pdf",
      mime: "application/pdf",
      body: REAL_PDF,
    });
    expect(res.status(), await res.text()).toBe(200);
    const { path } = await res.json();

    const served = await page.request.get(path);
    expect(served.status()).toBe(200);
    // Not cosmetic: a PDF opened inline runs its embedded scripting in whatever
    // origin served it (IA-44). Under S3 this header has to ride on the object,
    // because CloudFront answers with none of our code in the path — so this
    // assertion is the one that proves the migration kept it.
    expect(served.headers()["content-disposition"]).toContain("attachment");
  });

  test("a renamed HTML file is refused by the PDF folder", async ({ page }) => {
    const res = await upload(page, {
      dir: "presentations",
      kind: "doc",
      name: "evil.pdf",
      mime: "application/pdf",
      body: NOT_A_PDF,
    });
    // The declared MIME is the only thing vouching for a document — nothing
    // re-encodes it the way sharp re-encodes a still — so the magic number is
    // checked. 400 with a message, not a 500 and not a stored file.
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toBeTruthy();
  });

  test("the folder/type rules hold in both directions", async ({ page }) => {
    const stillIntoVideos = await upload(page, {
      dir: "videos",
      kind: "image",
      name: "probe.png",
      mime: "image/png",
      body: PNG_1x1,
    });
    expect(stillIntoVideos.status()).toBe(400);

    const clipIntoPosters = await upload(page, {
      dir: "posters",
      kind: "video",
      name: "probe.mp4",
      mime: "video/mp4",
      body: FAKE_MP4,
    });
    expect(clipIntoPosters.status()).toBe(400);
  });
});

test.describe("member uploads", () => {
  test("a member's file lands in their own namespace", async ({ page }) => {
    await signInMember(page, CREATOR_EMAIL, CREATOR_PASSWORD);
    const res = await upload(page, {
      scope: "member",
      dir: "posters",
      kind: "image",
      name: "probe.png",
      mime: "image/png",
      body: PNG_1x1,
    });
    expect(res.status(), await res.text()).toBe(200);
    const { path } = await res.json();
    // The namespace is the whole security model for member uploads: `dir` can
    // only ever pick a subfolder of it.
    expect(path).toMatch(/^\/uploads\/members\/\d+\/posters\/[\w.-]+$/);

    const served = await page.request.get(path);
    expect(served.status()).toBe(200);
  });
});

test.describe("gates", () => {
  test("a signed-out visitor cannot upload", async ({ page }) => {
    // Reach the app once so the request context has an origin to post to.
    await page.goto("/login");
    const res = await upload(page, {
      dir: "posters",
      kind: "image",
      name: "probe.png",
      mime: "image/png",
      body: PNG_1x1,
    });
    expect(res.status()).toBe(403);
  });

  test("serving refuses to climb out of the uploads tree", async ({ page }) => {
    await page.goto("/login");
    for (const target of [
      "/uploads/../../etc/passwd",
      "/uploads/videos/../../../package.json",
      "/uploads/nope/missing.png",
    ]) {
      const res = await page.request.get(target, { maxRedirects: 0 });
      // 404 is the answer; a 200 on any of these means the guard is gone. A
      // redirect is Next normalising the path, and is followed by the same
      // check on the normalised one.
      expect([301, 302, 307, 308, 404], `${target} answered ${res.status()}`).toContain(res.status());
      if (res.status() === 200) throw new Error(`${target} served content`);
    }
  });
});
