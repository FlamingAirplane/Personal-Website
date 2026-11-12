'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { hasProjectPageContent, type PortfolioItem } from '@/lib/content';
import { useSiteContent } from '@/lib/preview';
import { withBase } from '@/lib/site';
import type { PanelId } from '@/lib/room/room-data';

const LINK = 'text-[#94a348] underline hover:text-[#f3f7e4]';

function Projects({ items, empty }: { items: PortfolioItem[]; empty: string }) {
  if (items.length === 0) return <p className="text-[#8a9a70]">{empty}</p>;
  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item.id} className="flex gap-3">
          {item.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.imageUrl} alt="" className="h-16 w-24 shrink-0 object-cover" />
          )}
          <div className="min-w-0">
            <p className="font-bold text-[#f3f7e4]">{item.title}</p>
            <p className="text-xs text-[#8a9a70]">
              {item.category} · {item.year}
            </p>
            <p className="mt-1 text-xs text-[#c8d4a8]">{item.description}</p>
            <p className="mt-1 flex flex-wrap gap-3 text-xs">
              {hasProjectPageContent(item) && (
                <a href={withBase(`/projects/${item.slug}/`)} className={LINK}>
                  Read more
                </a>
              )}
              {item.projectLink && item.projectLink !== '#' && (
                <a href={item.projectLink} target="_blank" rel="noopener noreferrer" className={LINK}>
                  {item.type === 'sound' ? 'Listen' : 'Play'}
                </a>
              )}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Content from the site's data, shown in front of the room. */
export function RoomPanel({ id, onClose }: { id: PanelId; onClose: () => void }) {
  const { profile, portfolioItems, workHistory } = useSiteContent();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  let title = '';
  let body: ReactNode = null;

  if (id === 'games') {
    title = 'Games';
    body = <Projects items={portfolioItems.filter((p) => p.type === 'game')} empty="No games yet." />;
  } else if (id === 'playable') {
    title = 'Play now';
    body = (
      <Projects
        items={portfolioItems.filter((p) => p.type === 'game' && p.projectLink && p.projectLink !== '#')}
        empty="Nothing to play online yet."
      />
    );
  } else if (id === 'sound') {
    title = 'Sound';
    body = <Projects items={portfolioItems.filter((p) => p.type === 'sound')} empty="No sound work yet." />;
  } else if (id === 'work') {
    title = 'Work';
    body = (
      <ul className="space-y-4">
        {workHistory.map((job) => (
          <li key={job.id}>
            <p className="font-bold text-[#f3f7e4]">{job.position}</p>
            <p className="text-xs text-[#8a9a70]">
              {job.company} · {job.startDate} - {job.endDate || 'Present'}
            </p>
            <p className="mt-1 text-xs text-[#c8d4a8]">{job.description}</p>
          </li>
        ))}
      </ul>
    );
  } else if (id === 'about') {
    title = `About ${profile.name}`;
    body = (
      <div className="space-y-3 text-xs text-[#c8d4a8]">
        <p>{profile.bio}</p>
        {profile.quote && <p className="border-l-2 border-[#94a348] pl-3 italic">{profile.quote}</p>}
        {profile.email && (
          <p>
            <a href={`mailto:${profile.email}`} className={LINK}>
              {profile.email}
            </a>
          </p>
        )}
        {profile.resumeUrl && (
          <p>
            <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer" className={LINK}>
              Resume (PDF)
            </a>
          </p>
        )}
      </div>
    );
  } else {
    title = 'Skills';
    body = (
      <div className="space-y-3 text-xs text-[#c8d4a8]">
        <p>{profile.expertise}</p>
        <ul className="flex flex-wrap gap-2">
          {profile.skills.map((skill) => (
            <li key={skill} className="border border-[#2e3a1c] px-2 py-1 text-[#f3f7e4]">
              {skill}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <section
      role="dialog"
      aria-label={title}
      className="absolute bottom-16 right-3 top-14 z-20 flex w-[min(24rem,calc(100%-1.5rem))] flex-col border border-[#2e3a1c] bg-[#05060a]/90 text-sm backdrop-blur-sm"
    >
      <div className="flex items-center justify-between border-b border-[#2e3a1c] px-4 py-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-[#94a348]">{title}</h2>
        <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className="text-[#c8d4a8] hover:text-[#f3f7e4]">
          <X size={18} aria-hidden="true" />
        </button>
      </div>
      <div className="overflow-y-auto px-4 py-4">{body}</div>
    </section>
  );
}
