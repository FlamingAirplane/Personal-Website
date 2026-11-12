import { Suspense } from 'react';
import type { Metadata } from 'next';
import { PreviewClient } from '@/components/admin/preview-client';

export const metadata: Metadata = {
  title: 'Preview',
  robots: { index: false, follow: false },
};

export default function PreviewPage() {
  return (
    <Suspense>
      <PreviewClient />
    </Suspense>
  );
}
