export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { generatePresignedUploadUrl } from '@/lib/s3';

export async function POST(request: Request) {
  try {
    const data = await request?.json?.();
    const fileName = data?.fileName ?? '';
    const contentType = data?.contentType ?? 'application/octet-stream';
    const isPublic = data?.isPublic ?? false;

    if (!fileName) {
      return NextResponse.json({ success: false, message: 'fileName is required' }, { status: 400 });
    }

    const result = await generatePresignedUploadUrl(fileName, contentType, isPublic);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Presigned upload error:', error?.message);
    return NextResponse.json({ success: false, message: 'Failed to generate upload URL' }, { status: 500 });
  }
}
