import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse"],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
