export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFileUrl } from '@/lib/s3';

export async function GET() {
  try {
    const profile = await prisma.siteProfile.findFirst();
    
    if (!profile?.resumeCloudStoragePath) {
      return NextResponse.json({ url: null, message: 'Resume not available' });
    }

    const url = await getFileUrl(
      profile.resumeCloudStoragePath,
      'application/pdf',
      profile?.resumeIsPublic ?? true
    );

    return NextResponse.json({ url });
  } catch (error: any) {
    console.error('Resume API error:', error?.message);
    return NextResponse.json({ url: null, message: 'Failed to get resume' }, { status: 500 });
  }
}
