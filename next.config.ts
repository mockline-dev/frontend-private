import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  output: 'standalone',

  // Optimize package imports
  experimental: {
    optimizePackageImports: ['lucide-react', '@monaco-editor/react']
  },

  // Security headers
  headers: async () => (!isProd ? [] : [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        { key: 'Content-Security-Policy', value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://apis.google.com https://accounts.google.com https://www.gstatic.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com",
          "img-src 'self' data: https: blob:",
          "connect-src 'self' ws://localhost:* wss://localhost:* http://localhost:* https://localhost:* https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://accounts.google.com https://www.gstatic.com https://firebase.googleapis.com https://firestore.googleapis.com",
          "frame-src 'self' https://mockline-1a0e0.firebaseapp.com https://accounts.google.com https://www.gstatic.com",
          "worker-src 'self' blob:",
        ].join('; ') }
      ]
    }
  ]),

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: []
  }
};

export default nextConfig;
