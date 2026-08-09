import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.redditmedia.com',
      },
      {
        protocol: 'https',
        hostname: '*.redd.it',
      },
      {
        protocol: 'https',
        hostname: 'preview.redd.it',
      },
    ],
  },
  // Transpile @react-pdf/renderer for Turbopack compatibility
  transpilePackages: ['@react-pdf/renderer'],
};

export default nextConfig;