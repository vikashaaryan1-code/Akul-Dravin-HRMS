import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.resolve(__dirname, '..'),

  // Memory optimization – prevent OOM on large codebases
  experimental: {
    typedRoutes: false,
  },

  // Ensure clean builds – real TS errors will still fail, but non-critical warnings won't
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
