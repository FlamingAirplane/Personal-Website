import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProjectPageClient } from '@/components/project-page-client';
import { portfolioItems } from '@/lib/content';
import { SITE_URL } from '@/lib/site';

// One static page per project in lib/content.ts.
export function generateStaticParams() {
  return portfolioItems.map((item) => ({ slug: item.slug }));
}


// Each project gets its own title, description and share image.
export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const item = portfolioItems.find((p) => p.slug === params.slug);
  if (!item) return {};
  const url = `${SITE_URL}/projects/${item.slug}/`;
  // Image paths already start with the site's base path, so resolve from the domain.
  const image = item.imageUrl ? new URL(item.imageUrl, SITE_URL).href : `${SITE_URL}/og-image.png`;
  const title = `${item.title} (${item.category})`;
  return {
    title,
    description: item.description,
    alternates: { canonical: url },
    openGraph: { type: 'article', title, description: item.description, url, images: [image] },
    twitter: { card: 'summary_large_image', title, description: item.description, images: [image] },
  };
}

export default function ProjectPage({ params }: { params: { slug: string } }) {
  const index = portfolioItems.findIndex((p) => p.slug === params.slug);
  if (index === -1) return notFound();
  const pick = (i: number) => {
    const p = portfolioItems[(i + portfolioItems.length) % portfolioItems.length];
    return { slug: p.slug, title: p.title };
  };
  return <ProjectPageClient item={portfolioItems[index]} previous={pick(index - 1)} next={pick(index + 1)} />;
}
