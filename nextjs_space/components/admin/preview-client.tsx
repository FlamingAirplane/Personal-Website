'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { RoomCanvas } from '@/components/room/room-canvas';
import { PortfolioClient } from '@/components/portfolio-client';
import { ProjectPageClient } from '@/components/project-page-client';
import { DRAFT_KEY, readDraft, setPreviewContent, useSiteContent } from '@/lib/preview';

/** Shows the admin page's unpublished draft with the real site's pages. */
export function PreviewClient() {
  const params = useSearchParams();
  const slug = params.get('project');
  const room = params.get('view') === 'room';
  const [state, setState] = useState<{ hasDraft: boolean; version: number } | null>(null);
  const content = useSiteContent();

  useEffect(() => {
    const load = () => {
      const draft = readDraft();
      setPreviewContent(draft?.content ?? null);
      setState((s) => ({ hasDraft: Boolean(draft), version: (s?.version ?? 0) + 1 }));
    };
    load();
    const onStorage = (e: StorageEvent) => {
      if (e.key === DRAFT_KEY) load();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      setPreviewContent(null);
    };
  }, []);

  if (!state) return null;

  const items = content.portfolioItems;
  const index = slug ? items.findIndex((p) => p.slug === slug) : -1;
  const pick = (i: number) => {
    const p = items[(i + items.length) % items.length];
    return { slug: p.slug, title: p.title };
  };

  return (
    <div key={state.version}>
      {room ? (
        <RoomCanvas />
      ) : slug && index === -1 ? (
        <p className="min-h-screen bg-[#0a0c04] p-10 text-[#c8d4a8]">There is no project with the address &quot;{slug}&quot; in this draft.</p>
      ) : slug ? (
        <ProjectPageClient item={items[index]} previous={pick(index - 1)} next={pick(index + 1)} />
      ) : (
        <PortfolioClient portfolioItems={items} workHistory={content.workHistory} profile={content.profile} />
      )}
      <div
        role="status"
        className={`fixed left-1/2 z-[70] ${room ? 'top-3' : 'bottom-4'} flex -translate-x-1/2 items-center gap-3 rounded-full border border-[#94a348] bg-[#0d0f06]/95 px-4 py-2 text-xs text-[#f3f7e4] shadow-lg`}
      >
        <span className="font-semibold uppercase tracking-wider text-[#94a348]">Preview</span>
        <span>{state.hasDraft ? 'Not published yet' : 'No unpublished changes'}</span>
        <Link href="/admin/" className="underline text-[#94a348]">
          Back to admin
        </Link>
      </div>
    </div>
  );
}
