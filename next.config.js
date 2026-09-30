/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [320, 420, 640, 750, 828, 1080],
    imageSizes: [56, 96, 128, 220, 300],
  },
};
module.exports = nextConfig;
