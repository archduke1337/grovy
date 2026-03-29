import type { MetadataRoute } from 'next';
import { absoluteUrl } from "@/app/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-03-29T00:00:00.000Z");

  return [
    {
      url: absoluteUrl("/"),
      lastModified,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: absoluteUrl("/opensource"),
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: absoluteUrl("/tos"),
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];
}
