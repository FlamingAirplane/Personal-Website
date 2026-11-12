'use client';

import { Briefcase, Gamepad2, Music, User } from 'lucide-react';
import { useSiteContent } from '@/lib/preview';

const LINKS = [
  { id: 'game-portfolio', label: 'Games', icon: Gamepad2 },
  { id: 'sound-portfolio', label: 'Sound', icon: Music },
  { id: 'work-history', label: 'Work', icon: Briefcase },
  { id: 'about', label: 'About Me', icon: User },
];

export function FooterSection() {
  const { profile } = useSiteContent();
  return (
    <footer className="border-t border-[#1a1e10] bg-[#0a0c04]">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <nav aria-label="Footer" className="flex flex-wrap gap-2">
            {LINKS.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="flex items-center gap-2 px-4 py-2 bg-[#94a348] text-[#0a0c04] text-sm font-semibold rounded-lg hover:bg-[#a8b850] transition-colors"
                >
                  <Icon size={14} aria-hidden="true" />
                  {item.label}
                </a>
              );
            })}
          </nav>

          <div className="text-center md:text-right">
            <p className="text-[#8a9a70] text-sm">Designed and Made by {profile.name}</p>
            <p className="text-[#8a9a70] text-xs mt-1">© Copyright Inversion 2026</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
