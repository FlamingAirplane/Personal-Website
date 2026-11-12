'use client';

import { useEffect, useMemo, useState } from 'react';
import { loadDraftUrls, makeResolver } from '@/lib/room/assets';
import { collectRefs, DEFAULT_CONFIG, resolveConfig, type RoomConfig } from '@/lib/room/config';
import { loadDraft } from '@/lib/room/draft';
import { withBase } from '@/lib/site';
import { RoomCanvas } from './room-canvas';

/**
 * The room as visitors see it: the published settings from
 * /room/room-config.json. Add ?draft=1 to the address to see your unpublished
 * draft from the admin page instead (only works in the browser that made it).
 */
export function RoomLoader() {
  const [loaded, setLoaded] = useState<{ config: RoomConfig; urls: Map<string, string> } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let config = DEFAULT_CONFIG;
      const wantsDraft = new URLSearchParams(window.location.search).get('draft') === '1';
      const draft = wantsDraft ? loadDraft() : null;
      if (draft) {
        config = draft;
      } else {
        try {
          const response = await fetch(withBase('/room/room-config.json'), { cache: 'no-cache' });
          if (response.ok) config = resolveConfig(await response.json());
        } catch {
          /* no published settings: use the defaults */
        }
      }
      const urls = await loadDraftUrls(collectRefs(config));
      if (!cancelled) setLoaded({ config, urls });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const resolve = useMemo(() => makeResolver(loaded?.urls ?? new Map()), [loaded]);

  if (!loaded) {
    return (
      <main className="fixed inset-0 flex items-center justify-center bg-[#05060a] font-mono text-sm uppercase tracking-widest text-[#8a9a70]">
        {DEFAULT_CONFIG.text.loading}
      </main>
    );
  }
  return <RoomCanvas config={loaded.config} resolve={resolve} />;
}
