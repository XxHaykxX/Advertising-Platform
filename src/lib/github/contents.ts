// Server-only. Thin wrapper around the GitHub Contents API, used by the
// in-admin translation editor to commit an updated src/lib/i18n.ts straight
// to `main` — Hostinger's git auto-deploy then picks it up on push (see
// src/lib/i18n-validate.ts for the checks run before anything is written
// here). Every failure is re-thrown as an Error with a Russian message,
// since the text is shown directly in the admin UI.
import "server-only";

const API_BASE = "https://api.github.com";
const TIMEOUT_MS = 15_000;

function token(): string {
  return process.env.GITHUB_SYNC_TOKEN ?? "";
}

export function githubConfigured(): boolean {
  return token().trim() !== "";
}

export function githubRepoSlug(): string {
  return process.env.GITHUB_SYNC_REPO || "XxHaykxX/Advertising-Platform";
}

function branch(): string {
  return process.env.GITHUB_SYNC_BRANCH || "main";
}

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${token()}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "igovazd-admin",
  };
}

function contentsUrl(path: string): string {
  return `${API_BASE}/repos/${githubRepoSlug()}/contents/${path}`;
}

/** Maps a failed fetch/response into the readable Russian Error shown in the
 *  admin UI. Never includes the token. */
async function githubError(res: Response): Promise<Error> {
  const body = await res.text().catch(() => "");
  switch (res.status) {
    case 401:
      return new Error("GitHub-токен недействителен или истёк");
    case 403:
      // 403 covers both "token lacks the scope" and "you are rate limited";
      // the remaining-requests header is what tells them apart.
      if (res.headers.get("x-ratelimit-remaining") === "0") {
        return new Error("GitHub временно ограничил запросы — повторите через несколько минут");
      }
      return new Error("Нет прав Contents: write на репозиторий");
    case 404:
      return new Error("Репозиторий/файл/ветка не найдены (или у токена нет доступа)");
    case 409:
    case 422:
      return new Error("Файл изменился на GitHub — обновите страницу и повторите");
    default:
      return new Error(`GitHub API: HTTP ${res.status} ${body.slice(0, 200)}`);
  }
}

function requireConfigured(): void {
  if (!githubConfigured()) {
    throw new Error("GitHub-токен не настроен (GITHUB_SYNC_TOKEN)");
  }
}

/** Wraps a fetch call so network errors/timeouts surface as a readable
 *  Russian message instead of a raw AbortError/TypeError. */
async function githubFetch(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (e) {
    // AbortSignal.timeout() rejects with a DOMException named "TimeoutError"
    // (not AbortError) — miss it and the raw English message reaches the admin.
    const name = e instanceof Error ? e.name : "";
    if (name === "TimeoutError" || name === "AbortError" || e instanceof TypeError) {
      throw new Error("GitHub недоступен (таймаут или нет сети)");
    }
    throw e;
  }
}

/** Reads a file from the repo at `path` (on the configured branch), decoded
 *  as UTF-8, plus the blob `sha` needed to commit an update to it. */
export async function readRepoFile(path: string): Promise<{ content: string; sha: string }> {
  requireConfigured();
  const res = await githubFetch(`${contentsUrl(path)}?ref=${branch()}`, {
    headers: headers(),
    cache: "no-store",
  });
  if (!res.ok) throw await githubError(res);
  const json = await res.json();
  // The Contents API inlines `content` only for blobs up to 1 MB; above that it
  // answers 200 with an empty content and `encoding: "none"`. Catch that here,
  // otherwise the caller would rewrite an empty file and blame a phantom drift.
  if (json.encoding !== "base64" || typeof json.content !== "string" || json.content === "") {
    throw new Error("Файл словаря слишком большой для GitHub Contents API (>1 МБ)");
  }
  const clean = json.content.replace(/\n/g, "");
  return { content: Buffer.from(clean, "base64").toString("utf8"), sha: json.sha };
}

/** Commits an updated `content` to `path` on the configured branch. `sha`
 *  must be the blob sha last read via readRepoFile — GitHub rejects the
 *  write (409/422) if the file changed on the remote in the meantime. */
export async function commitRepoFile(args: {
  path: string;
  content: string;
  sha: string;
  message: string;
}): Promise<{ commitSha: string; commitUrl: string }> {
  requireConfigured();
  const { path, content, sha, message } = args;
  const res = await githubFetch(contentsUrl(path), {
    method: "PUT",
    headers: { ...headers(), "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      content: Buffer.from(content, "utf8").toString("base64"),
      sha,
      branch: branch(),
    }),
  });
  if (!res.ok) throw await githubError(res);
  const json = await res.json();
  return { commitSha: json.commit.sha, commitUrl: json.commit.html_url };
}
