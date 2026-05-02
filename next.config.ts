import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  // turbopack disabled for cross-platform builds
};

export default nextConfig;
