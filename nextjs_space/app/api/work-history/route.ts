export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const items = await prisma.workHistory.findMany({
      orderBy: [{ sortOrder: 'asc' }],
    });
    return NextResponse.json({ success: true, items: items ?? [] });
  } catch (error: any) {
    console.error('Work history API error:', error?.message);
    return NextResponse.json({ success: false, items: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { company, position, description, startDate, endDate, sortOrder } = data ?? {};
    if (!company || !position || !startDate) {
      return NextResponse.json({ success: false, error: 'Company, position, and start date are required' }, { status: 400 });
    }
    const item = await prisma.workHistory.create({
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
    console.error('Work history create error:', error?.message);
    return NextResponse.json({ success: false, error: 'Failed to create item' }, { status: 500 });
  }
}
