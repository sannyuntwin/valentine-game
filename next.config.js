/** @type {import('next').NextConfig} */

const nextConfig = {
  // Add production URL for metadata generation
  basePath: process.env.NODE_ENV === 'production' ? '' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',

  // Generate proper metadata
  generateEtags: true,

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'your-valentine-game.vercel.app',
      },
    ],
    unoptimized: false,
  },

  // Social media metadata
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'x-content-type-options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },

  // Security headers
  async redirects() {
    return [];
  },
};

module.exports = nextConfig;
