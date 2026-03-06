/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Enable static export for 2k concurrent user scaling (CDN delivery)
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
