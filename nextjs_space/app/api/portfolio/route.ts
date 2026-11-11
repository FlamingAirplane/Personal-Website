export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const items = await prisma.portfolioItem.findMany({
      orderBy: [{ sortOrder: 'asc' }, { year: 'desc' }],
    });
    return NextResponse.json({ success: true, items: items ?? [] });
  } catch (error: any) {
    console.error('Portfolio API error:', error?.message);
    return NextResponse.json({ success: false, items: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { title, category, description, imageUrl, projectLink, year, type, tags, sortOrder, slug, subpageContent, galleryImages } = data ?? {};
    if (!title || !category || !year || !type) {
      return NextResponse.json({ success: false, error: 'Title, category, year, and type are required' }, { status: 400 });
    }
    const item = await prisma.portfolioItem.create({
      data: {
        title,
        category,
        description: description || null,
        imageUrl: imageUrl || null,
        projectLink: projectLink || null,
        year: parseInt(year, 10),
        type,
        tags: tags || null,
        sortOrder: parseInt(sortOrder ?? '0', 10),
        slug: slug || null,
        subpageContent: subpageContent || null,
        galleryImages: galleryImages || null,
      },
    });
    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    console.error('Portfolio create error:', error?.message);
    return NextResponse.json({ success: false, error: 'Failed to create item' }, { status: 500 });
  }
}
