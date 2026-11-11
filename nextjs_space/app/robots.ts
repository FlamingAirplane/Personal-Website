import { MetadataRoute } from 'next';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  let siteUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
  try {
    const headersList = headers();
    const host = headersList?.get?.('x-forwarded-host');
    if (host) siteUrl = `https://${host}`;
  } catch (e: any) {}

  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
