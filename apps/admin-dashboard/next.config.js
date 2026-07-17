/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  transpilePackages: ['@exam-platform/shared'],
  async rewrites() {
    const AUTH = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
    const EXAM = process.env.NEXT_PUBLIC_EXAM_API_URL || 'http://localhost:4002';
    return [
      { source: '/api/auth/:path*', destination: `${AUTH}/v1/:path*` },
      { source: '/api/exam/:path*', destination: `${EXAM}/v1/:path*` },
    ];
  },
};
