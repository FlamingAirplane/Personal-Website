export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const data = await req.json();
    const { company, position, description, startDate, endDate, sortOrder } = data ?? {};
    if (!company || !position || !startDate) {
      return NextResponse.json({ success: false, error: 'Company, position, and start date are required' }, { status: 400 });
    }
    const item = await prisma.workHistory.update({
      where: { id: params.id },
      data: {
        company,
        position,
        description: description || null,
        startDate,
        endDate: endDate || null,
        sortOrder: parseInt(sortOrder ?? '0', 10),
      },
    });
    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    console.error('Work history update error:', error?.message);
    return NextResponse.json({ success: false, error: 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.workHistory.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Work history delete error:', error?.message);
    return NextResponse.json({ success: false, error: 'Failed to delete item' }, { status: 500 });
  }
}
