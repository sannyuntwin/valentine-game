/** @type {import('next').NextConfig} */

const nextConfig = {
  // Add production URL for metadata generation
  basePath: process.env.NODE_ENV === 'production' ? '' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
  
  // Generate proper metadata
  generateEtags: true,
  
  // Image optimization
  images: {
    domains: ['your-valentine-game.vercel.app'], // Update with your actual Vercel URL
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
