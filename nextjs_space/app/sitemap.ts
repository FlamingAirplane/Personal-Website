import { MetadataRoute } from 'next';
import { portfolioItems } from '@/lib/content';
import { SITE_URL } from '@/lib/site';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/room/`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
    ...portfolioItems.map((item) => ({
      url: `${SITE_URL}/projects/${item.slug}/`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ];
}
