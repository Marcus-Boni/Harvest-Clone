import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Microsoft Graph API — foto de perfil via URL (alternativa ao base64)
      {
        protocol: "https",
        hostname: "graph.microsoft.com",
      },
      // CDN de avatares da Microsoft
      {
        protocol: "https",
        hostname: "*.microsoft.com",
      },
    ],
  },
};

export default nextConfig;
