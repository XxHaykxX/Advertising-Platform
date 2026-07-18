import { readFileSync } from "node:fs";
import path from "node:path";

/** Minimal .env loader for integration tests (vitest does not read .env the
 *  way Next does). Parses KEY=VALUE / KEY="VALUE" lines from the repo-root
 *  .env and sets them on process.env WITHOUT overriding anything already set,
 *  so CI can inject a test DATABASE_URL via real env vars instead. No dotenv
 *  dependency. Uses process.cwd() (the repo root under both the vitest and the
 *  playwright runners) rather than import.meta, so it also loads cleanly from
 *  playwright's CommonJS globalTeardown loader. */
export function loadEnv(): void {
  const root = process.cwd();
  let raw: string;
  try {
    raw = readFileSync(path.join(root, ".env"), "utf8");
  } catch {
    return; // no .env (e.g. CI) — rely on real env vars
  }
  for (const line of raw.split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i.exec(line);
    if (!m) continue;
    const key = m[1];
    if (process.env[key] !== undefined) continue;
    let val = m[2].trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

loadEnv();
