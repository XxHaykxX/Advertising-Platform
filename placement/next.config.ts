import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained build (.next/standalone/server.js) for Node hosting on Hostinger.
  output: "standalone",
  images: { remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }] },
};

export default nextConfig;
