import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { recordVersion } from "./record";
import { restoreDeletedRecord, restoreToVersion } from "./restore";
import { buildSnapshot, collectMediaPaths } from "./snapshot";

// Integration: hits the local docker MySQL (DATABASE_URL from .env via the
// test:int setup). Everything is namespaced by the qa-hist- prefix and removed
// on both ends so reruns stay clean.
const PREFIX = "qa-hist-";
const AUTHOR = { id: 0, name: "QA Author" };

async function cleanup() {
  const projects = await prisma.project.findMany({
    where: { code: { startsWith: PREFIX } },
    select: { id: true },
  });
  const ids = projects.map((p) => p.id);
  if (ids.length) {
    await prisma.contentVersion.deleteMany({ where: { entity: "Project", entityId: { in: ids } } });
    await prisma.project.deleteMany({ where: { id: { in: ids } } });
  }
  // Before the users below: ownerId is a hard FK and would block their delete.
  const spaces = await prisma.adSpace.findMany({
    where: { code: { startsWith: PREFIX } },
    select: { id: true },
  });
  const spaceIds = spaces.map((s) => s.id);
  if (spaceIds.length) {
    await prisma.contentVersion.deleteMany({ where: { entity: "AdSpace", entityId: { in: spaceIds } } });
    await prisma.adSpace.deleteMany({ where: { id: { in: spaceIds } } }); // offers cascade
  }
  await prisma.person.deleteMany({ where: { name: { startsWith: PREFIX } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: PREFIX } } });
}

async function makeOwner(tag = "owner") {
  return prisma.user.create({
    data: {
      email: `${PREFIX}${tag}-${Math.random().toString(36).slice(2, 8)}@test.local`,
      name: "QA Owner",
      role: "SUPERADMIN",
      status: "APPROVED",
    },
  });
}

async function makeProject(ownerId: number, title = "QA Title") {
  return prisma.project.create({
    data: {
      code: `${PREFIX}${Math.random().toString(36).slice(2, 8)}`,
      title,
      titleHy: title,
      genre: "Drama",
      synopsis: "before",
      synopsisHy: "before",
      poster: "/uploads/projects/qa-poster.webp",
      ownerId,
    },
  });
}

async function makeAdSpace(ownerId: number, title = "QA Space") {
  return prisma.adSpace.create({
    data: {
      code: `${PREFIX}${Math.random().toString(36).slice(2, 8)}`,
      ownerId,
      channel: "BILLBOARD",
      title,
      titleHy: title,
      description: '["before"]',
      city: "Երևան",
      sizeFormat: "3×6 м",
      availableFrom: new Date("2026-09-01T00:00:00.000Z"),
      image: "/uploads/ad-spaces/qa-space.webp",
      offers: { create: [{ name: "QA Offer", nameHy: "QA Offer", priceAmd: 100000, sortOrder: 0 }] },
    },
  });
}

beforeAll(cleanup);
afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

let ownerId: number;
beforeEach(async () => {
  await cleanup();
  ownerId = (await makeOwner()).id;
  AUTHOR.id = ownerId;
});

describe("snapshot", () => {
  it("carries the project's nested rows, not just its own columns", async () => {
    const project = await makeProject(ownerId);
    await prisma.actor.create({
      data: { projectId: project.id, name: "QA Actor", role: "Actor", photo: "/uploads/actors/qa.webp" },
    });

    const snap = await buildSnapshot(prisma, "Project", project.id);
    expect(snap).not.toBeNull();
    expect((snap!.actors as unknown[]).length).toBe(1);
    expect(snap!.title).toBe("QA Title");
  });

  it("leaves out the view counter, which nobody edits", async () => {
    const project = await makeProject(ownerId);
    const snap = await buildSnapshot(prisma, "Project", project.id);
    expect(snap).not.toHaveProperty("viewCount");
  });

  it("finds every uploads path, including ones inside nested rows", async () => {
    const project = await makeProject(ownerId);
    await prisma.actor.create({
      data: { projectId: project.id, name: "QA Actor", role: "Actor", photo: "/uploads/actors/qa.webp" },
    });
    const snap = await buildSnapshot(prisma, "Project", project.id);
    const paths = collectMediaPaths(snap!);
    expect(paths).toContain("/uploads/projects/qa-poster.webp");
    expect(paths).toContain("/uploads/actors/qa.webp");
  });
});

describe("recordVersion", () => {
  it("numbers versions from one and describes what changed", async () => {
    const project = await makeProject(ownerId);
    await recordVersion(prisma, "Project", project.id, "CREATE", AUTHOR);

    await prisma.project.update({ where: { id: project.id }, data: { synopsisHy: "after" } });
    await recordVersion(prisma, "Project", project.id, "UPDATE", AUTHOR);

    const versions = await prisma.contentVersion.findMany({
      where: { entity: "Project", entityId: project.id },
      orderBy: { version: "asc" },
    });
    expect(versions.map((v) => v.version)).toEqual([1, 2]);
    expect(versions[0].summary).toBe("created");
    expect(versions[1].summary).toContain("synopsis (hy)");
  });

  it("keeps the author's name after their account is deleted", async () => {
    const project = await makeProject(ownerId);
    await recordVersion(prisma, "Project", project.id, "CREATE", AUTHOR);

    // Hand the project to somebody else first — ownerId is a hard FK, so the
    // author could not be deleted otherwise, and it is the deletion we test.
    const successor = await makeOwner("successor");
    await prisma.project.update({ where: { id: project.id }, data: { ownerId: successor.id } });
    await prisma.user.delete({ where: { id: ownerId } });

    const version = await prisma.contentVersion.findFirst({
      where: { entity: "Project", entityId: project.id },
    });
    expect(version?.authorId).toBeNull();
    expect(version?.authorName).toBe("QA Author");
  });

  it("is rolled back with the transaction it belongs to", async () => {
    const project = await makeProject(ownerId);

    await expect(
      prisma.$transaction(async (tx) => {
        await tx.project.update({ where: { id: project.id }, data: { titleHy: "never saved" } });
        await recordVersion(tx, "Project", project.id, "UPDATE", AUTHOR);
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");

    const count = await prisma.contentVersion.count({
      where: { entity: "Project", entityId: project.id },
    });
    expect(count).toBe(0);
    const row = await prisma.project.findUnique({ where: { id: project.id } });
    expect(row?.titleHy).toBe("QA Title");
  });
});

describe("restoreToVersion", () => {
  it("puts the earlier text back and records the restore itself", async () => {
    const project = await makeProject(ownerId);
    await recordVersion(prisma, "Project", project.id, "CREATE", AUTHOR);

    await prisma.project.update({ where: { id: project.id }, data: { synopsisHy: "damaged" } });
    await recordVersion(prisma, "Project", project.id, "UPDATE", AUTHOR);

    const res = await restoreToVersion("Project", project.id, 1, AUTHOR);
    expect(res.ok).toBe(true);

    const row = await prisma.project.findUnique({ where: { id: project.id } });
    expect(row?.synopsisHy).toBe("before");

    const latest = await prisma.contentVersion.findFirst({
      where: { entity: "Project", entityId: project.id },
      orderBy: { version: "desc" },
    });
    expect(latest?.action).toBe("RESTORE");
  });

  it("brings the cast back after it was wiped", async () => {
    const project = await makeProject(ownerId);
    await prisma.actor.create({
      data: { projectId: project.id, name: "QA Actor", role: "Actor" },
    });
    await recordVersion(prisma, "Project", project.id, "CREATE", AUTHOR);

    await prisma.actor.deleteMany({ where: { projectId: project.id } });
    await recordVersion(prisma, "Project", project.id, "UPDATE", AUTHOR);

    await restoreToVersion("Project", project.id, 1, AUTHOR);
    const actors = await prisma.actor.findMany({ where: { projectId: project.id } });
    expect(actors.length).toBe(1);
    expect(actors[0].name).toBe("QA Actor");
  });

  it("recreates a cast member's directory entry if it was deleted meanwhile", async () => {
    const person = await prisma.person.create({
      data: { name: `${PREFIX}Person`, nameHy: "Անուն", role: "Actor" },
    });
    const project = await makeProject(ownerId);
    await prisma.actor.create({
      data: { projectId: project.id, personId: person.id, name: `${PREFIX}Person`, nameHy: "Անուն", role: "Actor" },
    });
    await recordVersion(prisma, "Project", project.id, "CREATE", AUTHOR);

    await prisma.actor.deleteMany({ where: { projectId: project.id } });
    await prisma.person.delete({ where: { id: person.id } });

    const res = await restoreToVersion("Project", project.id, 1, AUTHOR);
    expect(res.ok).toBe(true);

    const actors = await prisma.actor.findMany({ where: { projectId: project.id } });
    expect(actors.length).toBe(1);
    expect(actors[0].personId).not.toBeNull();
    expect(actors[0].personId).not.toBe(person.id); // a fresh directory row
  });

  it("refuses to restore a version that records a deletion", async () => {
    const project = await makeProject(ownerId);
    await recordVersion(prisma, "Project", project.id, "DELETE", AUTHOR);

    const res = await restoreToVersion("Project", project.id, 1, AUTHOR);
    expect(res.ok).toBe(false);
  });
});

describe("restoreDeletedRecord", () => {
  it("brings a deleted project back with its cast and its original id", async () => {
    const project = await makeProject(ownerId, "QA Deleted");
    await prisma.actor.create({
      data: { projectId: project.id, name: "QA Actor", role: "Actor" },
    });
    await recordVersion(prisma, "Project", project.id, "DELETE", AUTHOR);
    await prisma.project.delete({ where: { id: project.id } });

    const res = await restoreDeletedRecord("Project", project.id, AUTHOR);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.entityId).toBe(project.id);

    const row = await prisma.project.findUnique({ where: { id: project.id } });
    expect(row?.titleHy).toBe("QA Deleted");
    const actors = await prisma.actor.findMany({ where: { projectId: project.id } });
    expect(actors.length).toBe(1);
  });

  it("refuses when the record is not actually deleted", async () => {
    const project = await makeProject(ownerId);
    await recordVersion(prisma, "Project", project.id, "CREATE", AUTHOR);

    const res = await restoreDeletedRecord("Project", project.id, AUTHOR);
    expect(res.ok).toBe(false);
  });
});

// ── Ad spaces (stage 3 of docs/plan-multichannel-ads.md) ───────────────────
// Same aggregate contract as a project: the offers are part of what the owner
// edits, so they must be part of what a restore puts back.

describe("AdSpace history", () => {
  it("snapshots the space together with its offers", async () => {
    const space = await makeAdSpace(ownerId);

    const snap = await buildSnapshot(prisma, "AdSpace", space.id);
    expect(snap).not.toBeNull();
    expect((snap!.offers as unknown[]).length).toBe(1);
    expect(snap).not.toHaveProperty("viewCount");
    expect(collectMediaPaths(snap!)).toContain("/uploads/ad-spaces/qa-space.webp");
  });

  it("rolls the space back to an earlier version, offers included", async () => {
    const space = await makeAdSpace(ownerId);
    await recordVersion(prisma, "AdSpace", space.id, "CREATE", AUTHOR);

    await prisma.adSpaceOffer.deleteMany({ where: { adSpaceId: space.id } });
    await prisma.adSpace.update({ where: { id: space.id }, data: { titleHy: "damaged" } });
    await recordVersion(prisma, "AdSpace", space.id, "UPDATE", AUTHOR);

    const res = await restoreToVersion("AdSpace", space.id, 1, AUTHOR);
    expect(res.ok).toBe(true);

    const row = await prisma.adSpace.findUnique({
      where: { id: space.id },
      include: { offers: true },
    });
    expect(row?.titleHy).toBe("QA Space");
    expect(row?.offers.length).toBe(1);
    expect(row?.offers[0].name).toBe("QA Offer");
    // Dates leave the snapshot as strings — the restore has to hand Prisma a Date.
    expect(row?.availableFrom?.toISOString()).toBe("2026-09-01T00:00:00.000Z");

    const latest = await prisma.contentVersion.findFirst({
      where: { entity: "AdSpace", entityId: space.id },
      orderBy: { version: "desc" },
    });
    expect(latest?.action).toBe("RESTORE");
  });

  it("brings a deleted space back with its offers and its original id", async () => {
    const space = await makeAdSpace(ownerId, "QA Deleted Space");
    await recordVersion(prisma, "AdSpace", space.id, "DELETE", AUTHOR);
    await prisma.adSpace.delete({ where: { id: space.id } });

    const res = await restoreDeletedRecord("AdSpace", space.id, AUTHOR);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.entityId).toBe(space.id);

    const row = await prisma.adSpace.findUnique({
      where: { id: space.id },
      include: { offers: true },
    });
    expect(row?.titleHy).toBe("QA Deleted Space");
    expect(row?.code).toBe(space.code);
    expect(row?.offers.length).toBe(1);
  });
});
