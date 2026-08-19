# syntax=docker/dockerfile:1.7
#
# Image for the ECS Fargate task (AWS migration). Hostinger is unaffected by
# this file — it builds from the repo root with its own managed Node runner and
# never reads a Dockerfile. Both targets are built from the same next.config.ts;
# the only difference is NEXT_OUTPUT below.
#
# Debian (bookworm), not Alpine: prisma/schema.prisma pins
# `debian-openssl-3.0.x` among its binaryTargets, and musl would need a fourth
# target added to the schema.

# ---------- deps ----------
FROM node:22-bookworm-slim AS deps
WORKDIR /app
# prisma/ has to be here before `npm ci`, because postinstall runs
# `prisma generate` and that reads schema.prisma.
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# ---------- build ----------
FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# Selects `output: "standalone"` in next.config.ts. Hostinger builds without it
# and keeps the plain `next start` layout it needs.
ENV NEXT_OUTPUT=standalone

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* is inlined into the client bundle at build time, so it has to be
# correct here rather than at runtime.
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

# A placeholder, not a credential. Two facts, both verified by building this
# image on 2026-08-19:
#   * the variable must EXIST — Next collects page data for every route at build
#     time, and PrismaClient's constructor throws
#     "Invalid value undefined for datasource" the moment one of them imports it
#     (/api/auth/google/callback is the first to go);
#   * it is never CONNECTED to — every route in this app renders `ƒ`
#     (server-rendered on demand) apart from /icon.svg, /opengraph-image and
#     /robots.txt, none of which query.
# So the build needs no real database and no secret plumbing at all. The real
# URL arrives at runtime from SSM. If a page is ever made static and does query
# during the build, this fails loudly rather than silently shipping a stale page.
ENV DATABASE_URL="mysql://placeholder:placeholder@127.0.0.1:3306/placeholder"

RUN npm run build

# ---------- runtime ----------
FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# node:22-bookworm-slim ships without the `openssl` binary, and Prisma probes it
# to pick a query engine. Without it Prisma logs "failed to detect the
# libssl/openssl version" and falls back to the openssl-1.1.x engine — which
# bookworm (OpenSSL 3) cannot load, so the app boots fine, serves every static
# page fine, and dies on the first database query. Caught by running the image
# on 2026-08-19; the fallback is silent at build time.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN useradd --system --uid 1001 --create-home nextjs

COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nextjs /app/.next/static ./.next/static
# Next's output tracing usually picks the Prisma query engine up on its own, but
# "usually" fails at runtime with a bare "Query engine binary not found" and no
# build-time warning. Copying it explicitly costs a layer and removes the class
# of failure.
COPY --from=build --chown=nextjs:nextjs /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
