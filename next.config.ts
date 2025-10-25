import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  // swcMinify deprecated in Next.js 15
  // App Router (src/app) sudah diaktifkan secara default di Next.js 15
  experimental: {
    // appDir: true, // Hapus ini karena tidak valid lagi
  },
  // Proxy API requests to Laravel backend - only for /api/proxy/** to avoid conflicts with Next API routes
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8000/api/:path*'
      }
    ]
  },
  // Anda bisa menggunakan Pages Router (pages) bersamaan dengan App Router
  // pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
};

export default nextConfig;
