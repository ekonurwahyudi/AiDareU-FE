import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  // Enable standalone output for Docker
  output: 'standalone',
  // swcMinify deprecated in Next.js 15
  // App Router (src/app) sudah diaktifkan secara default di Next.js 15
  experimental: {
    // appDir: true, // Hapus ini karena tidak valid lagi
  },
  // Proxy API requests to Laravel backend - only for /api/proxy/** to avoid conflicts with Next API routes
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/:path*`
      }
    ]
  },
  // Anda bisa menggunakan Pages Router (pages) bersamaan dengan App Router
  // pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
};

export default nextConfig;
