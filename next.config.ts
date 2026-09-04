import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PERFORMANCE: Prefer WebP for optimized images, set default quality
  images: {
    formats: ["image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // BUILD FIX: keep isomorphic-dompurify (and its nested jsdom) out of the server bundle.
  // Turbopack inlines jsdom's CJS and computes a wrong __dirname during SSR prerender, so
  // style-rules.js resolves default-stylesheet.css to a bogus "C:\ROOT\..." path and the build
  // crashes on /dashboard/add-article. Externalizing the direct import keeps the whole subtree
  // (isomorphic-dompurify -> jsdom) as runtime requires with a correct __dirname.
  serverExternalPackages: ["isomorphic-dompurify", "jsdom"],

  // SECURITY: Add security headers to all responses
  async headers() {
    return [
      {
        // Cache static assets (country images, logos) for 30 days
        source: "/countryImages/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=2592000, immutable",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://api.otpusk.com https://export.otpusk.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://export.otpusk.com",
              "img-src 'self' data: blob: https: http:",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://www.google-analytics.com https://generativelanguage.googleapis.com https://*.googleapis.com https://api.otpusk.com https://export.otpusk.com",
              "frame-src 'self' https://www.otpusk.com",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
