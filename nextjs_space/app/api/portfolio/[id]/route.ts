export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const data = await req.json();
    const { title, category, description, imageUrl, projectLink, year, type, tags, sortOrder, slug, subpageContent, galleryImages } = data ?? {};
    if (!title || !category || !year || !type) {
      return NextResponse.json({ success: false, error: 'Title, category, year, and type are required' }, { status: 400 });
    }
    const item = await prisma.portfolioItem.update({
      where: { id: params.id },
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
    console.error('Portfolio update error:', error?.message);
    return NextResponse.json({ success: false, error: 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.portfolioItem.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Portfolio delete error:', error?.message);
    return NextResponse.json({ success: false, error: 'Failed to delete item' }, { status: 500 });
  }
}
