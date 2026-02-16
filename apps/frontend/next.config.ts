import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  turbopack: {
    // Monorepo root (pnpm workspace) so Turbopack uses a single lockfile and avoids the multiple-lockfile warning.
    root: path.resolve(process.cwd(), "..", ".."),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
