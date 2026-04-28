import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
    turbopack: {
        rules: {
            '*.svg': {
                loaders: ['@svgr/webpack'],
                as: '*.js'
            }
        }
    },
    output: 'standalone',

    // Optimize package imports
    experimental: {
        optimizePackageImports: ['lucide-react', '@monaco-editor/react']
    },

    // Security headers
    headers: async () =>
        !isProd
            ? []
            : [
                  {
                      source: '/auth/:path*',
                      headers: [{ key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' }]
                  },
                  {
                      source: '/(.*)',
                      headers: [
                          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
                          { key: 'X-Content-Type-Options', value: 'nosniff' },
                          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
                          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
                          {
                              key: 'Content-Security-Policy',
                              value: [
                                  "default-src 'self'",
                                  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://apis.google.com https://accounts.google.com https://www.gstatic.com",
                                  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                                  "font-src 'self' https://fonts.gstatic.com",
                                  "img-src 'self' data: https: blob:",
                                  `connect-src 'self' ws://localhost:* wss://localhost:* http://localhost:* https://localhost:* ${process.env.NEXT_PUBLIC_SOCKET_URL ?? ''} ${(process.env.NEXT_PUBLIC_SOCKET_URL ?? '').replace(/^https?:/, 'wss:').replace(/^http:/, 'ws:')} https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://accounts.google.com https://www.gstatic.com https://firebase.googleapis.com https://firestore.googleapis.com`,
                                  `frame-src 'self' https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com https://accounts.google.com https://www.gstatic.com https://lh3.googleusercontent.com`,
                                  "worker-src 'self' blob:"
                              ].join('; ')
                          }
                      ]
                  }
              ],

    // Image optimization
    images: {
        formats: ['image/avif', 'image/webp'],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
                port: '',
                pathname: '/**'
            }
        ]
    }
};

export default nextConfig;
