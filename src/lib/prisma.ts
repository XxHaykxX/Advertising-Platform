import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Cap the connection pool. Prisma defaults the pool to (physical CPUs * 2 + 1);
// on the many-core shared host that's ~65 connections, and the query engine
// spins up a matching swarm of threads on the first query — which blows past
// the CloudLinux LVE process/thread (nproc) limit and the Node process is
// killed (no stack trace), so DB-backed pages 503. A tiny fixed pool keeps the
// engine's thread/resource use well under the limit.
function pooledUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return url;
  if (/[?&]connection_limit=/.test(url)) return url;
  return url + (url.includes("?") ? "&" : "?") + "connection_limit=5&pool_timeout=15";
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: pooledUrl() } },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
