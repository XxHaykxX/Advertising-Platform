import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained build (.next/standalone/server.js) for Node hosting on Hostinger.
  output: "standalone",
};

export default nextConfig;
