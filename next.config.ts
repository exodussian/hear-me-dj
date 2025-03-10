/** @type {import('next').NextConfig} */
const nextConfig = {
  // ESLint ayarları doğrudan burada olmalı, env altında değil
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Diğer çevre değişkenleri için env kullanabilirsiniz
  env: {
    // Buraya DATABASE_URL gibi çevre değişkenleri ekleyebilirsiniz
  },
}

module.exports = nextConfig