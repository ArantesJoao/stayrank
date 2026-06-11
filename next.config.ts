import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root — there are sibling projects with their own
  // lockfiles in the parent folder, which would otherwise be inferred.
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      // Microlink preview images come from arbitrary listing hosts.
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
