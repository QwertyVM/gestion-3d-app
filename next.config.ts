import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // TypeScript validation is handled via tsc
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
