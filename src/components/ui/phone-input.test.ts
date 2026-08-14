import { describe, it, expect } from "vitest";
import { caretFloor } from "./phone-input";

/* The bug this guards: the field opens pre-filled with the dial code, and a
   caret at position 0 makes typed digits land BEFORE it — "+374" plus a typed
   "77123456" became "+7 712 345-63-74", a valid Russian number the form then
   accepted (QA pass on production, 2026-08-14). */
describe("caretFloor", () => {
  it("keeps the caret behind the dial code once a national part exists", () => {
    expect(caretFloor("+374 77 123456")).toBe(5); // right after "+374 "
    expect(caretFloor("+7 712 345-63-74")).toBe(3);
  });

  it("pushes the caret to the end while the value is only a dial code", () => {
    expect(caretFloor("+374")).toBe(4);
    expect(caretFloor("")).toBe(0);
  });

  it("allows editing inside the national part", () => {
    // A caret at 8 in "+374 77 123456" is inside the digits — above the floor,
    // so the component leaves it alone.
    expect(caretFloor("+374 77 123456")).toBeLessThan(8);
  });
});
