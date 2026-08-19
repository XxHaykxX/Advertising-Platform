/* Behavioural test for the fs driver — the one that has to keep working
 * unchanged while the S3 one is built, because it is what local dev and the
 * live Hostinger site run on.
 *
 * It writes to a real temporary directory rather than mocking node:fs: the
 * things most likely to break in this refactor are exactly the ones a mock
 * would paper over — that nested keys create their parent folders, that list()
 * returns keys relative to the root, and that a missing file is an answer
 * rather than a throw.
 */
import { mkdtemp, rm, readFile, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { StorageDriver } from "./types";

let root: string;
let driver: StorageDriver;

beforeAll(async () => {
  root = await mkdtemp(path.join(tmpdir(), "igovazd-storage-"));
  // UPLOADS_DIR is read once, at module load, so it has to be set before the
  // driver is imported — hence the dynamic import rather than a top-level one.
  process.env.UPLOADS_DIR = root;
  driver = (await import("./fs-driver")).fsDriver;
});

afterAll(async () => {
  await rm(root, { recursive: true, force: true });
  delete process.env.UPLOADS_DIR;
});

describe("fs driver", () => {
  it("writes a nested key, creating the folders on the way", async () => {
    await driver.put("videos/clip.mp4", Buffer.from("bytes"));
    // Asserted against the real path, not through get(): the point is that the
    // file lands where the serve route and the old code both expect it.
    expect(await readFile(path.join(root, "videos", "clip.mp4"), "utf8")).toBe("bytes");
  });

  it("reads back what it wrote", async () => {
    await driver.put("posters/a.webp", Buffer.from("poster"));
    expect((await driver.get("posters/a.webp"))?.toString()).toBe("poster");
  });

  it("answers null for a missing key instead of throwing", async () => {
    expect(await driver.get("nope/missing.webp")).toBeNull();
    expect(await driver.head("nope/missing.webp")).toBeNull();
  });

  it("reports size through head", async () => {
    await driver.put("decks/a.pdf", Buffer.from("%PDF-1.4"));
    expect(await driver.head("decks/a.pdf")).toEqual({ size: 8 });
  });

  it("lists the whole tree with keys relative to the root", async () => {
    const keys = (await driver.list("")).map((f) => f.key);
    expect(keys).toContain("videos/clip.mp4");
    expect(keys).toContain("posters/a.webp");
    expect(keys.every((k) => !k.startsWith("/"))).toBe(true);
  });

  it("scopes a listing to a prefix — the member-namespace guarantee", async () => {
    await driver.put("members/7/avatars/me.webp", Buffer.from("mine"));
    await driver.put("members/8/avatars/other.webp", Buffer.from("theirs"));

    const mine = (await driver.list("members/7")).map((f) => f.key);
    expect(mine).toEqual(["members/7/avatars/me.webp"]);
    expect(mine).not.toContain("members/8/avatars/other.webp");
  });

  it("sorts newest first, the order both media libraries render", async () => {
    const files = await driver.list("");
    const times = files.map((f) => f.mtime);
    expect(times).toEqual([...times].sort((a, b) => b - a));
  });

  it("deletes, and treats an already-gone key as done", async () => {
    await driver.put("tmp/x.webp", Buffer.from("x"));
    await driver.remove("tmp/x.webp");
    expect(await driver.get("tmp/x.webp")).toBeNull();
    await expect(driver.remove("tmp/x.webp")).resolves.toBeUndefined();
  });

  it("refuses to touch anything outside the root", async () => {
    // Loudly, not quietly: an unsafe key here means a caller skipped
    // publicPathToKey(), and silently writing it "somewhere safe" would hide
    // that. The escape targets are what the old path.join() would have
    // normalised right out of the tree.
    await expect(driver.put("../escaped.webp", Buffer.from("x"))).rejects.toThrow(/Unsafe storage key/);
    await expect(driver.get("videos/../../escaped.webp")).rejects.toThrow(/Unsafe storage key/);
    await expect(driver.remove("/etc/passwd")).rejects.toThrow(/Unsafe storage key/);
  });

  it("does not follow a traversal that already exists on disk", async () => {
    // Belt and braces: even if a key somehow got past isSafeKey, resolving it
    // must not land outside UPLOADS_DIR.
    const outside = path.join(root, "..", "igovazd-outside-marker");
    await mkdir(path.dirname(outside), { recursive: true });
    await writeFile(outside, "secret");
    await expect(driver.get("../igovazd-outside-marker")).rejects.toThrow(/Unsafe storage key/);
    await rm(outside, { force: true });
  });

  it("leaves the URL to the app — nothing to redirect to on local disk", () => {
    expect(driver.publicUrl("videos/clip.mp4")).toBeNull();
  });
});
