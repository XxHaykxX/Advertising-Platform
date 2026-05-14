/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // Don't bundle Prisma into webpack — keep it as a real require so the
    // standalone build copies node_modules/@prisma + .prisma intact.
    serverComponentsExternalPackages: ['@prisma/client', '.prisma/client', 'bcryptjs'],
    serverActions: {
      bodySizeLimit: '10mb',
    },
    // File tracer sometimes misses the Prisma query engine binary; pull in
    // the whole .prisma/client folder explicitly.
    outputFileTracingIncludes: {
      '/**/*': ['./node_modules/.prisma/client/**/*'],
    },
  },
};

module.exports = nextConfig;
