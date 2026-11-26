import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/app/lib/seo";

/**
 * `robots.txt`, generated rather than static.
 *
 * This used to be `public/robots.txt` with the sitemap URL hard-coded, which
 * meant it could never follow `NEXT_PUBLIC_SITE_URL` — a deployment on any
 * other host would advertise a sitemap on a domain it did not own. Reading
 * `getSiteUrl()` here makes `seo.ts` the single source of truth for canonical
 * URLs, matching `sitemap.ts`.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: "/api/",
      },
      // Answer-engine crawlers get the same rules. Kept explicit so a future
      // `Disallow: /` for everything else does not silently cut them off.
      {
        userAgent: ["GPTBot", "OAI-SearchBot", "ClaudeBot", "PerplexityBot"],
        allow: "/",
        disallow: "/api/",
      },
    ],
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
