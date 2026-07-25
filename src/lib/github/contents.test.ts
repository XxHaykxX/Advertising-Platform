import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { githubConfigured, githubRepoSlug, readRepoFile, commitRepoFile } from "./contents";

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    // Only `get` is used (the 403 branch checks x-ratelimit-remaining).
    headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

beforeEach(() => {
  vi.stubEnv("GITHUB_SYNC_TOKEN", "test-token");
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("githubConfigured / githubRepoSlug", () => {
  it("is configured once GITHUB_SYNC_TOKEN is set", () => {
    expect(githubConfigured()).toBe(true);
  });

  it("is not configured when the token is empty", () => {
    vi.stubEnv("GITHUB_SYNC_TOKEN", "");
    expect(githubConfigured()).toBe(false);
  });

  it("defaults the repo slug when GITHUB_SYNC_REPO is unset", () => {
    expect(githubRepoSlug()).toBe("XxHaykxX/Advertising-Platform");
  });

  it("reads the repo slug from env when set", () => {
    vi.stubEnv("GITHUB_SYNC_REPO", "owner/other-repo");
    expect(githubRepoSlug()).toBe("owner/other-repo");
  });
});

describe("readRepoFile", () => {
  it("decodes a base64 body (with embedded newlines) as UTF-8", async () => {
    // Cyrillic + Armenian text, base64-encoded, GitHub wraps content at 60 cols.
    const text = 'export const x = "Привет, Բարեւ";';
    const b64 = Buffer.from(text, "utf8").toString("base64");
    const wrapped = b64.match(/.{1,20}/g)!.join("\n");
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      jsonResponse(200, { content: wrapped, encoding: "base64", sha: "abc123" }),
    );

    const result = await readRepoFile("src/lib/i18n.ts");

    expect(result).toEqual({ content: text, sha: "abc123" });
    const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe(
      "https://api.github.com/repos/XxHaykxX/Advertising-Platform/contents/src/lib/i18n.ts?ref=main",
    );
    expect(init.headers.Authorization).toBe("Bearer test-token");
  });

  it("throws before calling fetch when the token is missing", async () => {
    vi.stubEnv("GITHUB_SYNC_TOKEN", "");
    await expect(readRepoFile("src/lib/i18n.ts")).rejects.toThrow("GITHUB_SYNC_TOKEN");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("maps HTTP 401 to an invalid-token message", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(jsonResponse(401, {}));
    await expect(readRepoFile("src/lib/i18n.ts")).rejects.toThrow(/недействителен|истёк/);
  });

  it("rejects a blob GitHub refused to inline (over 1 MB)", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      jsonResponse(200, { content: "", encoding: "none", sha: "abc123" }),
    );
    await expect(readRepoFile("src/lib/i18n.ts")).rejects.toThrow(/слишком большой/);
  });

  it("maps a rate-limited 403 to a retry message, not a permission one", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      jsonResponse(403, { message: "API rate limit exceeded" }, { "x-ratelimit-remaining": "0" }),
    );
    await expect(readRepoFile("src/lib/i18n.ts")).rejects.toThrow(/ограничил запросы/);
  });

  it("maps a timeout to a readable message", async () => {
    const timeout = new Error("The operation was aborted due to timeout");
    timeout.name = "TimeoutError";
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(timeout);
    await expect(readRepoFile("src/lib/i18n.ts")).rejects.toThrow(/GitHub недоступен/);
  });

  it("maps HTTP 403 to a missing-write-permission message", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(jsonResponse(403, {}));
    await expect(readRepoFile("src/lib/i18n.ts")).rejects.toThrow(/Contents: write/);
  });

  it("maps HTTP 404 to a not-found message", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(jsonResponse(404, {}));
    await expect(readRepoFile("src/lib/i18n.ts")).rejects.toThrow(/не найдены/);
  });

  it("maps HTTP 409 to a conflict message", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(jsonResponse(409, {}));
    await expect(readRepoFile("src/lib/i18n.ts")).rejects.toThrow(/изменился на GitHub/);
  });
});

describe("commitRepoFile", () => {
  it("PUTs base64-encoded UTF-8 content with sha and branch, returns commit info", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      jsonResponse(200, {
        commit: { sha: "deadbeef", html_url: "https://github.com/owner/repo/commit/deadbeef" },
      }),
    );

    const content = 'export const x = "Привет, Բարեւ";';
    const result = await commitRepoFile({
      path: "src/lib/i18n.ts",
      content,
      sha: "abc123",
      message: "i18n: sync from admin editor",
    });

    expect(result).toEqual({
      commitSha: "deadbeef",
      commitUrl: "https://github.com/owner/repo/commit/deadbeef",
    });

    const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe(
      "https://api.github.com/repos/XxHaykxX/Advertising-Platform/contents/src/lib/i18n.ts",
    );
    expect(init.method).toBe("PUT");
    const body = JSON.parse(init.body as string);
    expect(body.content).toBe(Buffer.from(content, "utf8").toString("base64"));
    expect(body.sha).toBe("abc123");
    expect(body.branch).toBe("main");
    expect(body.message).toBe("i18n: sync from admin editor");
  });

  it("maps HTTP 422 (sha conflict) to a conflict message", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(jsonResponse(422, {}));
    await expect(
      commitRepoFile({ path: "src/lib/i18n.ts", content: "x", sha: "stale", message: "m" }),
    ).rejects.toThrow(/изменился на GitHub/);
  });

  it("throws before calling fetch when the token is missing", async () => {
    vi.stubEnv("GITHUB_SYNC_TOKEN", "");
    await expect(
      commitRepoFile({ path: "src/lib/i18n.ts", content: "x", sha: "s", message: "m" }),
    ).rejects.toThrow("GITHUB_SYNC_TOKEN");
    expect(fetch).not.toHaveBeenCalled();
  });
});
