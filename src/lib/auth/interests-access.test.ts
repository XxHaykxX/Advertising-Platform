import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/* Guard for the staff-only rule (docs/plan-interests-staff-only.md, stage S4).
 *
 * Owner decision 2026-08-07/11: a brand's application is an internal lead. It
 * is read and answered by staff in /admin/interests; the project's creator
 * never sees the brand's contacts and never accepts or declines. The rule was
 * implemented in three places at once — the route, the action and the data
 * layer — and each of the three has drifted back on its own before, which is
 * why all three are checked here rather than only the action.
 *
 * The two failure modes this project keeps repeating:
 *   "the page is gone from the UI but the query behind it isn't" and
 *   "the guard on the page and the check inside the action disagree".
 */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(HERE, "..", "..");

/* ── The action ──────────────────────────────────────────────────────────
   Everything respondToInterest touches is mocked EXCEPT makeUI, so the
   refusal is compared against the real dictionary string rather than a
   copy of it. prisma is a spy on purpose: refusing must happen before the
   application is even read, not after. */

const loadStaffUser = vi.fn<() => Promise<{ id: number; role: string } | null>>(async () => null);
vi.mock("@/lib/auth/require", () => ({ loadStaffUser: () => loadStaffUser() }));

const findUnique = vi.fn(async () => null);
vi.mock("@/lib/prisma", () => ({ prisma: { interest: { findUnique: () => findUnique() } } }));

vi.mock("@/lib/data/locale", () => ({ getLocale: async () => "ru" }));
vi.mock("@/lib/data/notifications", () => ({ createNotification: vi.fn(async () => {}) }));
vi.mock("@/lib/mail", () => ({ notifyInterestAnswered: vi.fn(async () => ({ ok: true })) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), updateTag: vi.fn() }));

const { respondToInterest } = await import("@/lib/actions/interest-response");
const { UI } = await import("@/lib/i18n");

const NOT_ALLOWED = (UI["interests.errNotAllowed"] as Record<string, string>).ru;

describe("respondToInterest — only staff who handle applications get through", () => {
  beforeEach(() => {
    findUnique.mockClear();
  });

  it("refuses a member session (no staff cookie) without reading the application", async () => {
    loadStaffUser.mockResolvedValueOnce(null);
    expect(await respondToInterest(1, true, "")).toEqual({ ok: false, error: NOT_ALLOWED });
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("refuses staff roles that do not handle applications", async () => {
    for (const role of ["PUBLISHER", "TRANSLATOR"]) {
      loadStaffUser.mockResolvedValueOnce({ id: 7, role });
      expect(await respondToInterest(1, true, ""), role).toEqual({ ok: false, error: NOT_ALLOWED });
    }
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("lets a superadmin and a moderator past the gate", async () => {
    // Not a happy path — the mocked application does not exist, so the action
    // stops at errNotFound. What matters is that it got as far as the query:
    // if this ever fails, the two roles that own the inbox lost their own job
    // (the exact bug fixed on 2026-08-07).
    for (const role of ["SUPERADMIN", "MODERATOR"]) {
      loadStaffUser.mockResolvedValueOnce({ id: 1, role });
      const res = await respondToInterest(1, true, "");
      expect(res, role).not.toEqual({ ok: false, error: NOT_ALLOWED });
    }
    expect(findUnique).toHaveBeenCalledTimes(2);
  });
});

/* ── The route ──────────────────────────────────────────────────────────
   /account/interests was the creator's inbox. It is a redirect now, kept
   alive only because notifications written before 2026-08-07 still link to
   it (stage S2 rewrites those and then deletes the file). Until then it
   must not grow a page again. */

describe("/account/interests — the creator's inbox stays gone", () => {
  const routeFile = path.join(SRC, "app", "account", "interests", "page.tsx");

  it("is a redirect to the notifications page and nothing else", () => {
    const src = readFileSync(routeFile, "utf8");
    expect(src).toMatch(/redirect\("\/account\/notifications"\)/);
    // A real inbox needs data: any of these appearing here means the page
    // came back.
    expect(src).not.toMatch(/prisma|getInterests|InterestInboxDTO|respondToInterest/);
  });
});

/* ── The data layer ─────────────────────────────────────────────────────
   The inbox query outlived the inbox page once already (audit 2.1, the
   mirror image: the page was deleted and the write side kept saving rows
   nobody read). Applications are read by exactly one section. */

describe("interest queries are reachable from the admin panel only", () => {
  const dataModule = path.join(SRC, "lib", "data", "interests.ts");

  it("src/lib/data/interests.ts exports no owner-scoped reader", () => {
    const src = readFileSync(dataModule, "utf8");
    const exported = [...src.matchAll(/export async function (\w+)/g)].map((m) => m[1]);
    // getInterestsForOwner / getPendingInterestCountForOwner were the
    // creator's own queries and were removed with the inbox.
    expect(exported.filter((name) => /ForOwner$/.test(name))).toEqual([]);
  });

  it("nothing under src/app/account imports it", () => {
    const offenders = filesImporting(path.join(SRC, "app", "account"), "@/lib/data/interests");
    expect(
      offenders,
      `the member cabinet must not read applications:\n${offenders.join("\n")}`,
    ).toEqual([]);
  });

  it("but the admin panel does — the scanner above is looking at real code", () => {
    // Without this, renaming the module (or breaking the scan) would turn the
    // check above into an assertion that always passes.
    expect(filesImporting(path.join(SRC, "app", "admin"), "@/lib/data/interests").length).toBeGreaterThan(0);
  });
});

/** Files under `dir` (recursively) whose source mentions `moduleId` in an
 *  import. Path-based rather than clever: the question is only "does the
 *  member side reach for this module at all". */
function filesImporting(dir: string, moduleId: string): string[] {
  const hits: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true, recursive: true })) {
    if (!entry.isFile() || !/\.tsx?$/.test(entry.name)) continue;
    const full = path.join(entry.parentPath ?? dir, entry.name);
    if (readFileSync(full, "utf8").includes(`from "${moduleId}"`)) {
      hits.push(path.relative(SRC, full));
    }
  }
  return hits;
}
