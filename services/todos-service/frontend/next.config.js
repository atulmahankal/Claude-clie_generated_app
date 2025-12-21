/** @type {import('next').NextConfig} */
const nextConfig = {
  // Base path for micro-frontend routing
  basePath: '/todos',
  assetPrefix: '/todos',

  // Enable standalone output for Docker
  output: 'standalone',

  // Environment variables
  env: {
    GRPC_SERVICE_URL: process.env.TODOS_GRPC_URL || 'todos-service:50052',
    BASE_APP_URL: process.env.BASE_APP_URL || 'http://localhost:3000',
  },

  // Transpile shared-ui package
  transpilePackages: ['@jam/shared-ui'],
};

module.exports = nextConfig;
