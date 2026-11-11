export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    let settings = await prisma.siteSettings.findFirst();
    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: {
          particleMouseRadius: 70,
          particlePushForce: 8,
          particleReturnSpeed: 6,
          particleFriction: 85,
          particleGap: 3,
          titleText: 'Adine.',
          cursorEnabled: true,
          cursorSize: 12,
          cursorHoverSize: 40,
          cursorLag: 15,
          cursorColorLight: '#0a0c04',
          cursorColorDark: '#c8d4a8',
        },
      });
    }
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error('Site settings GET error:', error?.message);
    return NextResponse.json({ success: false, error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const data = await req.json();
    let settings = await prisma.siteSettings.findFirst();
    if (!settings) {
      settings = await prisma.siteSettings.create({ data: {} });
    }
    const updated = await prisma.siteSettings.update({
      where: { id: settings.id },
      data: {
        particleMouseRadius: data.particleMouseRadius ?? 70,
        particlePushForce: data.particlePushForce ?? 8,
        particleReturnSpeed: data.particleReturnSpeed ?? 6,
        particleFriction: data.particleFriction ?? 85,
        particleGap: data.particleGap ?? 3,
        titleText: data.titleText ?? 'Adine.',
        cursorEnabled: data.cursorEnabled ?? true,
        cursorSize: data.cursorSize ?? 12,
        cursorHoverSize: data.cursorHoverSize ?? 40,
        cursorLag: data.cursorLag ?? 15,
        cursorColorLight: data.cursorColorLight ?? '#0a0c04',
        cursorColorDark: data.cursorColorDark ?? '#c8d4a8',
      },
    });
    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    console.error('Site settings PUT error:', error?.message);
    return NextResponse.json({ success: false, error: 'Failed to update settings' }, { status: 500 });
  }
}
