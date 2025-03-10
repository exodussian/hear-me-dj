/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Build sırasında TypeScript hatalarını görmezden gel
    ignoreBuildErrors: true,
  },
  eslint: {
    // Build sırasında ESLint hatalarını görmezden gel
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig