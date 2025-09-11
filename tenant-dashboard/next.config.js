/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['@mui/material', '@mui/icons-material'],
  },
  env: {
    CUSTOM_KEY: 'tenant-dashboard',
  },
}

module.exports = nextConfig