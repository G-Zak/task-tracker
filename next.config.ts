import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Ensure Prisma Client is treated as external for Server Components
    serverComponentsExternalPackages: [
      '@prisma/client',
      '@prisma/adapter-pg',
    ],
  },
};

export default nextConfig;
