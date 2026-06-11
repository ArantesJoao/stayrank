import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root — there are sibling projects with their own
  // lockfiles in the parent folder, which would otherwise be inferred.
  turbopack: {
    root: path.resolve(__dirname),
  },
  experimental: {
    // The trip/city pages are dynamic (they read auth), so the client Router
    // Cache treats them as stale immediately (default dynamic = 0s) and
    // refetches on every back-navigation. Keep a freshly-visited page warm for
    // 30s so hitting "back" is instant; mutations still revalidate via the
    // server actions' revalidatePath calls.
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
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
