import type { NextConfig } from "next";
/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/uploads/images/posts/**', // Более конкретный путь, если все изображения постов там
      }
    ],
  },
};

export default nextConfig;
