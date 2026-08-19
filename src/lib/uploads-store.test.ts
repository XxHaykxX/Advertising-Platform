import { describe, it, expect } from "vitest";
import { STAFF_UPLOAD_MESSAGES, planVideoUpload } from "@/lib/uploads-store";

/* planVideoUpload decides where a clip may land WITHOUT seeing it, because a
   presigned upload goes straight to the bucket and there is no "after" in which
   to re-check anything. Whatever this returns gets signed into a URL, so these
   are the checks that stand between a client and someone else's namespace.

   The multipart path shares this function rather than re-stating the rules,
   which is the point — the module header warns that a second copy is how one
   door quietly ends up laxer than the other. */

const staff = { keyPrefix: "", messages: STAFF_UPLOAD_MESSAGES };
const member = { keyPrefix: "members/42", messages: STAFF_UPLOAD_MESSAGES };

function keyOf(plan: ReturnType<typeof planVideoUpload>): string {
  if ("error" in plan) throw new Error(`expected a plan, got: ${plan.error}`);
  return plan.key;
}

describe("planVideoUpload", () => {
  it("mints a key under the caller's prefix, never anywhere else", () => {
    expect(keyOf(planVideoUpload({ dir: "videos", contentType: "video/mp4", filename: "a.mp4" }, member)))
      .toMatch(/^members\/42\/videos\/\d+-[0-9a-f]{8}\.mp4$/);
  });

  it("gives a client no way to climb out of its own namespace via `dir`", () => {
    // `dir` is the only thing a client proposes, and two rules stack on it.
    // safeSegment() strips the separators, so a traversal attempt collapses to
    // one junk segment rather than a path — and that junk segment is then not
    // "videos" or "references", so the folder rule refuses it outright. Both
    // outcomes are safe, which is what this asserts: the key either does not
    // exist, or exists inside the caller's own prefix. Nothing escapes.
    for (const dir of ["../../evil", "members/1", "/etc", "..", "videos/../../x"]) {
      const plan = planVideoUpload({ dir, contentType: "video/mp4", filename: "a.mp4" }, member);
      if ("error" in plan) continue; // refused — the stronger of the two outcomes
      expect(plan.key.startsWith("members/42/"), `dir=${dir} produced ${plan.key}`).toBe(true);
      expect(plan.key).not.toContain("..");
    }
  });

  it("refuses a traversal `dir` outright rather than sanitising it into a folder", () => {
    // Worth pinning separately: it would still be SAFE if these were sanitised
    // into a junk folder inside the namespace, so a future change that relaxed
    // this into "sanitise and accept" would not fail the test above. It would,
    // however, quietly start creating folders named after attack strings.
    expect(planVideoUpload({ dir: "../../evil", contentType: "video/mp4", filename: "a.mp4" }, member))
      .toHaveProperty("error");
  });

  it("keeps the folder rule: clips belong in videos, or in references", () => {
    expect(planVideoUpload({ dir: "posters", contentType: "video/mp4", filename: "a.mp4" }, staff))
      .toHaveProperty("error");
    // references legitimately takes both — a past project may be shown as a
    // still or as a clip.
    expect(keyOf(planVideoUpload({ dir: "references", contentType: "video/mp4", filename: "a.mp4" }, staff)))
      .toMatch(/^references\//);
  });

  it("falls back to the filename when the browser sends no usable MIME", () => {
    // Phones routinely send application/octet-stream for an .mp4; rejecting
    // those would reject real uploads.
    expect(keyOf(planVideoUpload({ dir: "videos", contentType: "application/octet-stream", filename: "clip.MP4" }, staff)))
      .toMatch(/\.mp4$/);
  });

  it("refuses anything that is not mp4 or webm, by either signal", () => {
    expect(planVideoUpload({ dir: "videos", contentType: "video/quicktime", filename: "a.mov" }, staff))
      .toHaveProperty("error");
    expect(planVideoUpload({ dir: "videos", contentType: "", filename: "a.exe" }, staff))
      .toHaveProperty("error");
  });

  it("never mints the same key twice", () => {
    const keys = new Set(
      Array.from({ length: 50 }, () =>
        keyOf(planVideoUpload({ dir: "videos", contentType: "video/mp4", filename: "a.mp4" }, staff)),
      ),
    );
    expect(keys.size).toBe(50);
  });
});
