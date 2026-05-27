import type { MetadataRoute } from 'next';
import { absoluteUrl } from "@/app/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date().toISOString().split('T')[0];

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
