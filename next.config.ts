import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@zai/select-element'],
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  
  // Allow cross-domain requests from sandbox proxy (Z.ai preview panel)
  allowedDevOrigins: ["*"],
};

export default nextConfig;
