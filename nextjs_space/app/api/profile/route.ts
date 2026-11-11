export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const profile = await prisma.siteProfile.findFirst();
    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    console.error('Profile GET error:', error?.message);
    return NextResponse.json({ success: false, error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const data = await req.json();
    let profile = await prisma.siteProfile.findFirst();
    if (!profile) {
      profile = await prisma.siteProfile.create({
        data: { name: data.name || 'Adine Johnson' },
      });
    }
    const updated = await prisma.siteProfile.update({
      where: { id: profile.id },
      data: {
        name: data.name ?? profile.name,
        tagline: data.tagline ?? profile.tagline,
        bio: data.bio ?? profile.bio,
        email: data.email ?? profile.email,
        phone: data.phone ?? profile.phone,
        imageUrl: data.imageUrl ?? profile.imageUrl,
        resumeCloudStoragePath: data.resumeCloudStoragePath ?? profile.resumeCloudStoragePath,
        resumeIsPublic: data.resumeIsPublic ?? profile.resumeIsPublic,
        twitterUrl: data.twitterUrl ?? profile.twitterUrl,
        instagramUrl: data.instagramUrl ?? profile.instagramUrl,
        heroBgUrl: data.heroBgUrl ?? profile.heroBgUrl,
      },
    });
    return NextResponse.json({ success: true, profile: updated });
  } catch (error: any) {
    console.error('Profile PUT error:', error?.message);
    return NextResponse.json({ success: false, error: 'Failed to update profile' }, { status: 500 });
  }
}
