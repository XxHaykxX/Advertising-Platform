/**
 * Custom standalone server for Hostinger LSWS.
 *
 * Why: Next.js' auto-generated .next/standalone/server.js calls
 *   server.listen(port, hostname)
 * with hostname=process.env.HOSTNAME. On Hostinger, HOSTNAME is a unix
 * socket path (e.g. /usr/local/lsws/extapp-sock/<domain>:_.sock). Node's
 * server.listen(port, hostname) treats hostname as an IP, fails to resolve
 * the socket-path form, and falls back to TCP 0.0.0.0 — which LSWS can't
 * reach, so it kills the process and respawns it in a loop.
 *
 * Fix: detect unix-socket hostnames (start with "/") and bind via
 * server.listen(socketPath) so Node creates the socket file LSWS expects.
 *
 * This file is copied to .next/standalone/server.js by
 * scripts/copy-standalone-assets.js after `next build`.
 */
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');

process.env.NODE_ENV = 'production';
process.chdir(__dirname);

const port = parseInt(process.env.PORT, 10) || 3000;
const rawHostname = process.env.HOSTNAME ?? '';
const isUnixSocket = rawHostname.startsWith('/');
const hostname = isUnixSocket ? rawHostname : rawHostname || '0.0.0.0';

const next = require('next');
const app = next({
  dev: false,
  dir: __dirname,
  // Pass a real hostname so Next's internal routing doesn't choke on the
  // socket path. The actual bind happens via server.listen() below.
  hostname: isUnixSocket ? '0.0.0.0' : hostname,
  port,
});
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const server = http.createServer((req, res) => {
      handle(req, res).catch((err) => {
        console.error('Request handler error:', err);
        res.statusCode = 500;
        res.end('Internal server error');
      });
    });

    server.on('error', (err) => {
      console.error('Server error:', err);
      process.exit(1);
    });

    if (isUnixSocket) {
      // Clean up a stale socket file from a previous run — bind fails if
      // the path exists.
      try {
        fs.unlinkSync(rawHostname);
      } catch (err) {
        if (err.code !== 'ENOENT') {
          console.warn('Could not unlink stale socket:', err.message);
        }
      }

      // Ensure parent dir exists (Hostinger normally provides it, but
      // belt-and-braces).
      try {
        fs.mkdirSync(path.dirname(rawHostname), { recursive: true });
      } catch (_) {
        /* ignore */
      }

      server.listen(rawHostname, () => {
        // LSWS runs as a different uid — grant it access to the socket.
        try {
          fs.chmodSync(rawHostname, 0o666);
        } catch (err) {
          console.warn('Could not chmod socket:', err.message);
        }
        console.log(`▲ Next.js listening on unix:${rawHostname}`);
      });
    } else {
      server.listen(port, hostname, () => {
        console.log(`▲ Next.js listening on http://${hostname}:${port}`);
      });
    }
  })
  .catch((err) => {
    console.error('Failed to start Next.js:', err);
    process.exit(1);
  });
