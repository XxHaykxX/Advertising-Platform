/**
 * Custom standalone server for Hostinger LSWS.
 *
 * The auto-generated .next/standalone/server.js calls
 *   server.listen(port, hostname)
 * which only supports TCP. Hostinger LSWS hands the app HOSTNAME=
 *   /usr/local/lsws/extapp-sock/<domain>:_.sock
 * and expects the app to bind that unix socket. With TCP the LSWS
 * proxy can't reach the app — respawn loop, 503 for users.
 *
 * Earlier attempt: rewrite the bootstrap to `require('next')` and use
 * `next()` programmatically. That blows up in standalone because the
 * full `next` package pulls in webpack which isn't shipped to standalone
 * (Cannot find module './bundle5').
 *
 * Current approach: keep the standalone bootstrap exactly as Next.js
 * generated it (same `startServer({...})` call), but monkey-patch
 * `http.Server.prototype.listen` BEFORE startServer runs. The patch
 * detects the socket-path HOSTNAME and rewrites the listen() call to
 * bind a unix socket instead of TCP. Also handles stale-socket cleanup
 * and chmod so LSWS (different uid) can read/write.
 *
 * This file is copied to .next/standalone/server.js by
 * scripts/copy-standalone-assets.js after `next build`.
 */
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

process.env.NODE_ENV = 'production';
process.chdir(__dirname);

const port = parseInt(process.env.PORT, 10) || 3000;
const rawHostname = process.env.HOSTNAME ?? '';
const isUnixSocket = rawHostname.startsWith('/');

// Monkey-patch listen() — runs once for the server startServer creates.
// We have to patch the prototype before requiring next, because the
// startServer module captures the server reference in its closure.
if (isUnixSocket) {
  const originalListen = http.Server.prototype.listen;
  let patched = false;
  http.Server.prototype.listen = function patchedListen(...args) {
    if (patched) {
      return originalListen.apply(this, args);
    }
    patched = true;
    // Original Next.js call shape: server.listen(port, hostname) or
    // server.listen(port, hostname, callback). Replace with unix socket.
    try {
      fs.unlinkSync(rawHostname);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.warn('[custom-server] stale socket unlink failed:', err.message);
      }
    }
    try {
      fs.mkdirSync(path.dirname(rawHostname), { recursive: true });
    } catch (_) {
      /* directory probably already exists */
    }
    this.once('listening', () => {
      try {
        fs.chmodSync(rawHostname, 0o666);
        console.log(`[custom-server] listening on unix:${rawHostname}`);
      } catch (err) {
        console.warn('[custom-server] socket chmod failed:', err.message);
      }
    });
    return originalListen.call(this, rawHostname);
  };
}

// ─── Below mirrors the auto-generated standalone server.js bootstrap ──
const dir = path.join(__dirname);
let keepAliveTimeout = parseInt(process.env.KEEP_ALIVE_TIMEOUT, 10);
if (
  Number.isNaN(keepAliveTimeout) ||
  !Number.isFinite(keepAliveTimeout) ||
  keepAliveTimeout < 0
) {
  keepAliveTimeout = undefined;
}

// Read the embedded next config — written into this file by Next.js' build,
// but we no longer auto-generate so we read it from a sidecar file we leave
// alongside, falling back to a minimal config that startServer can run with.
let nextConfig;
try {
  // The original server.js inlines the config as JSON. We saved a copy.
  nextConfig = JSON.parse(
    fs.readFileSync(path.join(__dirname, '.next', 'required-server-files.json'), 'utf8')
  ).config;
} catch (err) {
  console.error('[custom-server] could not load Next.js config:', err.message);
  process.exit(1);
}

process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(nextConfig);

require('next/dist/server/require-hook');
const { startServer } = require('next/dist/server/lib/start-server');

startServer({
  dir,
  isDev: false,
  config: nextConfig,
  hostname: isUnixSocket ? '0.0.0.0' : rawHostname || '0.0.0.0',
  port,
  allowRetry: false,
  keepAliveTimeout,
}).catch((err) => {
  console.error('[custom-server] startServer failed:', err);
  process.exit(1);
});
