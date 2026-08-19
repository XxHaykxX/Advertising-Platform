import { describe, it, expect } from "vitest";
import http from "node:http";

// The smallest thing that fails if this stops working: a Next upgrade that
// changes how the standalone server creates/listens on its http.Server, or
// someone dropping `-r ./server-timeouts.js` from the Dockerfile CMD.
describe("server-timeouts preload", () => {
  it("applies HEADERS_TIMEOUT and REQUEST_TIMEOUT before listen()", async () => {
    process.env.HEADERS_TIMEOUT = "12345";
    process.env.REQUEST_TIMEOUT = "654321";
    await import("./server-timeouts.js");

    const server = http.createServer();
    await new Promise<void>((resolve) => server.listen(0, resolve));
    try {
      expect(server.headersTimeout).toBe(12345);
      expect(server.requestTimeout).toBe(654321);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
