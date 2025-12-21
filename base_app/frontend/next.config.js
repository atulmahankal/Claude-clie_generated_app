/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',

  // Environment variables
  env: {
    BASE_BACKEND_URL: process.env.BASE_BACKEND_URL || 'http://base-app-backend:3000',
  },

  // Transpile shared-ui package
  transpilePackages: ['@jam/shared-ui'],
};

module.exports = nextConfig;
