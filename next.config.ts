import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Content-Security-Policy.
 *
 * `connect-src` covers the two upstream music APIs (proxied server-side,
 * listed only because the client preconnects to them) and `ipapi.co`, which
 * the location route calls on the server. Nothing else is reachable.
 *
 * `script-src` needs `'unsafe-eval'` only in development for React Refresh.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://www.youtube.com https://www.google.com${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https://i.ytimg.com https://*.googleusercontent.com https://*.saavncdn.com https://*.yt3.ggpht.com",
  "media-src 'self' blob: https://*.googlevideo.com https://*.saavncdn.com",
  "connect-src 'self' https://ytapi.gauravramyadav.workers.dev https://jiosaavn-api.gauravramyadav.workers.dev https://ipapi.co",
  "frame-src https://www.youtube.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "**.saavncdn.com" },
      { protocol: "https", hostname: "**.googleusercontent.com" },
      { protocol: "https", hostname: "**.yt3.ggpht.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "@heroui/react"],
  },
  async headers() {
    return [
      // Security headers for every response. Caching is decided per-route:
      // a blanket public cache would let a CDN serve stale HTML for pages
      // whose content changes per user.
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      // Framework output is content-hashed and safe to cache forever.
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // Media proxies are cached briefly so seeking within a track hits the
      // browser/edge cache instead of the upstream provider.
      {
        source: "/api/stream",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600" }],
      },
      // Everything else under /api is dynamic and must not be cached.
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, must-revalidate" }],
      },
    ];
  },
  staticPageGenerationTimeout: 120,
};

export default nextConfig;
