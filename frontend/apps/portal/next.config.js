/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@b2b-coffee/shared-types', '@b2b-coffee/shared-ui'],
  async rewrites() {
    return [
      { source: '/api/:path*', destination: 'http://localhost:4000/api/:path*' },
    ];
  },
};

module.exports = nextConfig;
