/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Security: Limit request body size to prevent DoS attacks
  experimental: {
    serverActions: {
      bodySizeLimit: '1mb', // Limit Server Actions payload size
    },
  },
  // Protect against RSC payload DoS
  onDemandEntries: {
    maxInactiveAge: 60 * 1000, // 1 minute
    pagesBufferLength: 5,
  },
};
module.exports = nextConfig;
