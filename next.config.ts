import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '15mb', // Permitir archivos hasta 15 MB (margen para metadata)
    },
  },
}

export default nextConfig
