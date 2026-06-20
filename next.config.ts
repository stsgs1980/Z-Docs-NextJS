import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";
const repoName = "StsDev-Wiki-Template";

const nextConfig: NextConfig = {
  output: isGitHubPages ? "export" : "standalone",
  basePath: isGitHubPages ? `/${repoName}` : "",
  assetPrefix: isGitHubPages ? `/${repoName}/` : "",
  trailingSlash: true,
  images: {
    unoptimized: isGitHubPages ? true : false,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Allow cross-domain requests from sandbox proxy (Z.ai preview panel)
  allowedDevOrigins: ["*"],
  // CI runners have ~7GB RAM; 4 default workers cause OOM during static generation.
  // 1 worker is slower but stays within memory limits.
  experimental: isGitHubPages
    ? { cpus: 1, workerThreads: false }
    : undefined,
};

export default nextConfig;
