/* Preload script for the standalone server's runtime container:
 *
 *   node -r ./server-timeouts.js server.js
 *
 * Why this file exists at all: the standalone `server.js` that Next writes
 * (template in node_modules/next/dist/build/utils.js, ~line 1090) reads
 * KEEP_ALIVE_TIMEOUT and sets `server.keepAliveTimeout` for us
 * (node_modules/next/dist/server/lib/start-server.js:249-251) — but it never
 * touches `headersTimeout` or `requestTimeout`, and there is no supported
 * hook to set them after the fact either: `startServer()` resolves to
 * `{ distDir }`, not the http.Server it created, so nothing outside that
 * function can reach the instance once it exists. A future Next release
 * that exposes these two (or returns the server) should retire this file.
 *
 * Why `requestTimeout` matters here specifically: it bounds the whole
 * request, headers *and* body, and Node's own default is 300_000ms (5 min).
 * On Hostinger that has never fired, because Passenger buffers the POST body
 * to disk before the app sees any of it — so the clock only starts once the
 * upload is already in hand. An ALB streams to its target, so on ECS this
 * timer becomes the first thing a slow phone upload runs into. That makes it
 * a behaviour change introduced by the migration, not a bug being uncovered.
 *
 * Patches http.Server.prototype.listen so both properties land on the
 * instance before Next calls .listen() on it (start-server.js:267/431).
 * Next always creates the server via http.createServer() and calls
 * server.listen() on that same object afterwards, so this fires in time
 * regardless of load order between this preload and Next's own
 * require('http') — both get the one cached `http` module.
 */
'use strict';

const http = require('http');

function envMs(name, fallback) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

// Headers arrive up front even on a slow upload — the body is what's slow —
// so Node's own default is already the right size. Kept explicit (read from
// env, not left implicit) so it's visible and tunable alongside the other two.
const HEADERS_TIMEOUT = envMs('HEADERS_TIMEOUT', 60_000);

// NOT derived from the ALB idle timeout, even though it is tempting: that one
// measures *inactivity* and an upload in progress resets it indefinitely, while
// this one bounds the request's *total* wall clock, progress or not. Sizing
// this one to the ALB's 900s would cap every upload at fifteen minutes however
// well it was going.
//
// Sized from the upload instead. Worst case worth carrying: a ~500 MB clip off
// a phone over a 2 Mbit/s mobile uplink, which is 500 × 8 ÷ 2 ≈ 2000 seconds —
// call it 33 minutes. 2_400_000 ms (40 min) covers that with headroom.
//
// Read that as the real ceiling: MAX_BYTES_VIDEO is null (see
// src/lib/uploads-store.ts) so there is no size limit, but there IS a time
// limit, and the two multiply into "as much as uploads in 40 minutes". A
// client on a worse link than we assumed hits it, and it looks like a random
// failure rather than a limit. Raise this number, not the ALB's, if that
// happens.
//
// Deliberately finite: 0 disables the only timer bounding a slow-loris-style
// connection that never finishes its body, trading one failure mode for
// another rather than fixing anything.
const REQUEST_TIMEOUT = envMs('REQUEST_TIMEOUT', 2_400_000);

const originalListen = http.Server.prototype.listen;
http.Server.prototype.listen = function patchedListen(...args) {
  this.headersTimeout = HEADERS_TIMEOUT;
  this.requestTimeout = REQUEST_TIMEOUT;
  return originalListen.apply(this, args);
};
