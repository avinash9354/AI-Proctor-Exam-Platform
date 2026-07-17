/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@exam-platform/shared'],
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: '**' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/v1/:path*`,
      },
      {
        source: '/api/exam/:path*',
        destination: `${process.env.NEXT_PUBLIC_EXAM_API_URL || 'http://localhost:4002'}/v1/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
