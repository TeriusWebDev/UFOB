const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    localPatterns: [{ pathname: '/uploads/**' }],
  },
  experimental: {
    // whatsapp-web.js e puppeteer rodam apenas via server.js (fora do webpack)
    serverComponentsExternalPackages: ['whatsapp-web.js', 'puppeteer', 'puppeteer-core', 'unzipper'],
  },
}

module.exports = withPWA(nextConfig)
