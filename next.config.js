/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Proxy API requests in dev to avoid CORS issues
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_INTERNAL_URL || 'http://oasis-api-cie:3001'}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
