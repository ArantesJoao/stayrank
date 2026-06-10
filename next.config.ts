import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root — there are sibling projects with their own
  // lockfiles in the parent folder, which would otherwise be inferred.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
