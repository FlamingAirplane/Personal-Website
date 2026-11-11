import { MetadataRoute } from 'next';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export default function sitemap(): MetadataRoute.Sitemap {
  let siteUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
  try {
    const headersList = headers();
    const host = headersList?.get?.('x-forwarded-host');
    if (host) siteUrl = `https://${host}`;
  } catch (e: any) {}

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];
}
