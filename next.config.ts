/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXTAUTH_URL: "http://localhost:3000",
    NEXTAUTH_SECRET: "rasgele-guvenli-bir-string",
    GOOGLE_CLIENT_ID: "84271347914-c62816s9vjpp07r0ui80tavp070e3c0v.apps.googleusercontent.com",
    GOOGLE_CLIENT_SECRET: "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",
  },
}

module.exports = nextConfig