import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["hnswlib-node"],
  experimental: {
    // @ts-expect-error - outputFileTracingIncludes is supported by Next.js but not in this type yet.
    outputFileTracingIncludes: {
      "app/api/chat/[identifier]/route": ["node_modules/hnswlib-node/**"],
    },
  },
};

export default nextConfig;
