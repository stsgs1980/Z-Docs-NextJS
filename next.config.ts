import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  reactStrictMode: true,

  // Allow cross-domain requests from sandbox proxy (Z.ai preview panel)
  allowedDevOrigins: ["*"],

  // Fix Turbopack workspace root inference in Z.ai sandbox
  turbopack: {
    root: "/home/z/my-project",
  },
};

export default nextConfig;