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
 *
 * HONEST LIMITATION: `'unsafe-inline'` is required by four inline scripts in
 * `app/layout.tsx` (theme observer, service-worker registration, three
 * JSON-LD blocks). It means this directive does NOT mitigate script injection
 * — an injected inline script would execute. The other directives (object-src,
 * base-uri, form-action) are real controls; script-src is not. Do not treat
 * this policy as XSS protection without adding a nonce or hashes first.
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
      // No /api cache rules at all. Next already marks dynamic route handlers
      // as uncacheable, and a rule here would override the per-route
      // Cache-Control headers the handlers set themselves (the last matching
      // rule wins). Route handlers own their cache policy.
      //
      // In particular there used to be a `/api/stream` rule pinning
      // `public, max-age=3600`. That also stamped the route's 400/403
      // rejections as publicly cacheable, so an edge cache could keep serving
      // a stale rejection after the caller became valid. The stream route now
      // sets `max-age` on successful media and `no-store` on every error.
    ];
  },
  staticPageGenerationTimeout: 120,
};

export default nextConfig;
