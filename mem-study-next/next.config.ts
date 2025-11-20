import type { NextConfig } from "next";

// redirecting
const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/home",
        permanent: true,
      },
    ];
  },

  async rewrites() {
    const isProd = process.env.NODE_ENV === "production";
    return isProd
      ? [] // AWS handles /api routing in prod
      : [
          {
            source: "/api/:path*",
            destination: "http://localhost:5000/api/:path*", // proxy for local dev
          },
        ];
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
