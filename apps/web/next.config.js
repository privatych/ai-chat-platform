/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@ai-chat/shared'],
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ai.itoq.ru',
        pathname: '/api/images/**',
      },
      {
        protocol: 'https',
        hostname: 'ai.itoq.ru',
        pathname: '/uploads/images/**',
      },
    ],
  },
};

module.exports = nextConfig;
