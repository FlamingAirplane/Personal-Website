export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getFileUrl } from '@/lib/s3';

export async function POST(request: Request) {
  try {
    const data = await request?.json?.();
    const cloud_storage_path = data?.cloud_storage_path ?? '';
    const isPublic = data?.isPublic ?? false;
    const contentType = data?.contentType ?? 'application/octet-stream';

    if (!cloud_storage_path) {
      return NextResponse.json({ success: false, message: 'cloud_storage_path is required' }, { status: 400 });
    }

    const url = await getFileUrl(cloud_storage_path, contentType, isPublic);
    return NextResponse.json({ success: true, url });
  } catch (error: any) {
    console.error('Get URL error:', error?.message);
    return NextResponse.json({ success: false, message: 'Failed to get file URL' }, { status: 500 });
  }
}
