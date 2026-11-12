'use client';

import { DRAFT_PREFIX } from '@/lib/room/assets';
import { collectRefs, type RoomConfig } from '@/lib/room/config';
import { useAdmin } from './admin-context';
import { buttonClass } from './controls';

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

/** Every file imported in this browser, and whether anything uses it. */
export function FilesPanel({ config }: { config: RoomConfig }) {
  const admin = useAdmin();
  const used = new Set(collectRefs(config));
  const total = admin.assets.reduce((n, a) => n + a.size, 0);

  return (
    <div className="py-2">
      <p className="pb-3 text-xs leading-relaxed text-[#8a9a70]">
        Pictures and models you import are kept in this browser until you publish them. Big files slow the site down
        for everyone, so keep pictures small and models simple.
      </p>
      {admin.assets.length === 0 ? (
        <p className="text-xs text-[#c8d4a8]">Nothing imported yet. Use “Import picture” or “Import model” on any item or place.</p>
      ) : (
        <>
          <p className="pb-2 text-xs text-[#c8d4a8]">
            {admin.assets.length} file{admin.assets.length === 1 ? '' : 's'}, {formatSize(total)} in all
            {total > 25 * 1024 * 1024 && <span className="text-[#f07a5a]"> — that is a lot for a website</span>}
          </p>
          <ul className="divide-y divide-[#1a1e10] border-y border-[#1a1e10]">
            {admin.assets.map((a) => {
              const ref = DRAFT_PREFIX + a.id;
              const inUse = used.has(ref);
              const url = admin.resolve(ref);
              return (
                <li key={a.id} className="flex items-center gap-3 py-2">
                  {a.kind === 'image' && url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt="" className="h-10 w-14 shrink-0 border border-[#2e3a1c] object-cover" />
                  ) : (
                    <span className="flex h-10 w-14 shrink-0 items-center justify-center border border-[#2e3a1c] text-[10px] uppercase text-[#8a9a70]">
                      3D
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-[#f3f7e4]">{a.name}</p>
                    <p className="text-xs text-[#8a9a70]">
                      {formatSize(a.size)} · {inUse ? 'in use' : 'not used'}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={buttonClass}
                    onClick={() => {
                      if (!inUse || window.confirm('Something is using this file. Delete it anyway?')) {
                        void admin.removeAsset(a.id);
                      }
                    }}
                  >
                    Delete
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
