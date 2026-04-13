/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@b2b-coffee/shared-types', '@b2b-coffee/shared-ui'],
  async rewrites() {
    const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:4000';
    return [
      { source: '/api/:path*', destination: `${apiBaseUrl}/api/:path*` },
    ];
  },
};

module.exports = nextConfig;
