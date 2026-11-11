export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { ProjectPageClient } from '@/components/project-page-client';

export default async function ProjectPage({ params }: { params: { slug: string } }) {
  try {
    const item = await prisma.portfolioItem.findUnique({
      where: { slug: params.slug },
    });

    if (!item) return notFound();

    const safeItem = JSON.parse(JSON.stringify(item));
    return <ProjectPageClient item={safeItem} />;
  } catch {
    return notFound();
  }
}
