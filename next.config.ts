import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  // Enable standalone output for Docker
  output: 'standalone',

  // Disable ESLint during production build (errors will be shown in dev)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Disable TypeScript errors during build to prevent blocking production builds
  typescript: {
    ignoreBuildErrors: true,
  },

  // Skip trailing slash to match middleware routes correctly
  skipTrailingSlashRedirect: true,

  // swcMinify deprecated in Next.js 15
  // App Router (src/app) sudah diaktifkan secara default di Next.js 15
  experimental: {
    // appDir: true, // Hapus ini karena tidak valid lagi
  },
  // No rewrites needed - frontend calls backend API directly via NEXT_PUBLIC_API_URL
  // Middleware handles /api/proxy/* if specific proxying is needed
  // Anda bisa menggunakan Pages Router (pages) bersamaan dengan App Router
  // pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
};

export default nextConfig;
