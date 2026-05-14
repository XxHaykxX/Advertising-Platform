/**
 * After `next build` with output: 'standalone', the .next/standalone/ folder
 * contains a minimal server + traced deps but is MISSING:
 *   - public/                   → static assets the app serves
 *   - .next/static/             → hashed JS/CSS bundles
 *   - node_modules/.prisma/client → query engine binary for current platform
 *
 * Next.js doesn't copy these automatically (see vercel/next.js#48173).
 * We copy them here so `node .next/standalone/server.js` actually works.
 *
 * Cross-platform (uses fs.cpSync — Node 16.7+).
 */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = process.cwd();
const STANDALONE = path.join(ROOT, '.next', 'standalone');

if (!fs.existsSync(STANDALONE)) {
  console.error(
    '[post-build] .next/standalone not found — is `output: "standalone"` set in next.config.js?'
  );
  process.exit(1);
}

function copy(src, dest, label) {
  const srcAbs = path.join(ROOT, src);
  const destAbs = path.join(STANDALONE, dest);
  if (!fs.existsSync(srcAbs)) {
    console.warn(`[post-build] skip ${label}: ${src} does not exist`);
    return;
  }
  fs.cpSync(srcAbs, destAbs, { recursive: true });
  console.log(`[post-build] copied ${label}: ${src} → .next/standalone/${dest}`);
}

copy('public', 'public', 'public assets');
copy('.next/static', '.next/static', 'static bundles');

// Prisma query engine binary — Next.js' file tracer often misses this.
// We copy the full .prisma/client folder (binary + generated client) to be safe.
copy('node_modules/.prisma/client', 'node_modules/.prisma/client', 'Prisma client');
copy(
  'node_modules/@prisma/client',
  'node_modules/@prisma/client',
  '@prisma/client package'
);

// Replace the auto-generated server.js with our custom one that handles
// unix-socket binding for Hostinger LSWS — see the file header for why.
const customServer = path.join(ROOT, 'scripts', 'custom-standalone-server.js');
const targetServer = path.join(STANDALONE, 'server.js');
if (fs.existsSync(customServer)) {
  fs.copyFileSync(customServer, targetServer);
  console.log('[post-build] overwrote server.js with custom unix-socket aware version');
} else {
  console.warn('[post-build] custom-standalone-server.js missing — keeping default');
}

console.log('[post-build] standalone assets ready.');
