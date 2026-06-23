import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      allowedOrigins: ["*.apps.whop.com"],
    },
  },
};

export default nextConfig;
