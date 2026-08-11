import { beforeEach, describe, expect, it } from "vitest";
import { lockBodyScroll } from "./body-scroll-lock";

/** The vitest run is node-environment (no jsdom in this project), and the lock
 *  only ever touches these four properties — a stub is cheaper than a DOM. */
const body = { style: { overflow: "", paddingRight: "" } };

beforeEach(() => {
  body.style.overflow = "";
  body.style.paddingRight = "";
  Object.assign(globalThis, {
    document: { body, documentElement: { clientWidth: 1000 } },
    window: { innerWidth: 1000 },
  });
});

/** The whole point of the counter is that release order doesn't matter — that
 *  is exactly what four independent save/restore pairs got wrong. */
describe("lockBodyScroll", () => {
  it("keeps the page locked until the last holder releases", () => {
    const releaseSheet = lockBodyScroll();
    const releaseMenu = lockBodyScroll();
    expect(body.style.overflow).toBe("hidden");

    // The sheet closes first — the menu is still open, so the page must not
    // start scrolling again.
    releaseSheet();
    expect(body.style.overflow).toBe("hidden");

    releaseMenu();
    expect(body.style.overflow).toBe("");
  });

  it("restores whatever the page had before the first lock", () => {
    body.style.overflow = "clip";
    const release = lockBodyScroll();
    expect(body.style.overflow).toBe("hidden");
    release();
    expect(body.style.overflow).toBe("clip");
  });

  it("ignores a repeated release", () => {
    const releaseA = lockBodyScroll();
    const releaseB = lockBodyScroll();
    releaseA();
    releaseA();
    expect(body.style.overflow).toBe("hidden");
    releaseB();
    expect(body.style.overflow).toBe("");
  });

  it("pads for the scrollbar it removes, and only while locked", () => {
    Object.assign(globalThis, {
      document: { body, documentElement: { clientWidth: 985 } },
      window: { innerWidth: 1000 },
    });
    const release = lockBodyScroll();
    expect(body.style.paddingRight).toBe("15px");
    release();
    expect(body.style.paddingRight).toBe("");
  });
});
