import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Standalone output — required for Docker / Railway deployment
  output: 'standalone',

  // Trace files from monorepo root so Docker COPY picks them up
  outputFileTracingRoot: path.resolve(__dirname, '..'),

  // Memory optimization — prevent OOM on large codebases
  typedRoutes: false,

  // Skip ESLint during CI builds — we run lint separately
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Suppress non-critical TS warnings during build
  // Real errors will still fail the build
  typescript: {
    ignoreBuildErrors: false,
  },

  // Allow images from common CDN hosts
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.unsplash.com' },
      { protocol: 'https', hostname: '**.cloudinary.com' },
      { protocol: 'https', hostname: '**.s3.amazonaws.com' },
    ],
  },
};

export default nextConfig;
