// Stub used by vitest to satisfy `import "server-only"` in modules under test.
// Vitest aliases the `server-only` package to this empty module so pure helpers
// living in server-only files can be unit-tested outside the Next server runtime.
export {};
