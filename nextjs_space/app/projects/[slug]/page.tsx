import { notFound } from 'next/navigation';
import { ProjectPageClient } from '@/components/project-page-client';
import { portfolioItems } from '@/lib/content';

// One static page per project in lib/content.ts.
export function generateStaticParams() {
  return portfolioItems.map((item) => ({ slug: item.slug }));
}

export const dynamicParams = false;

export default function ProjectPage({ params }: { params: { slug: string } }) {
  const item = portfolioItems.find((p) => p.slug === params.slug);
  if (!item) return notFound();
  return <ProjectPageClient item={item} />;
}
