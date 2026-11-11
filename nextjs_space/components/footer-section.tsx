'use client';

import { motion } from 'framer-motion';
import { Gamepad2, Music, Briefcase, User } from 'lucide-react';

export function FooterSection() {
  const scrollTo = (id: string) => {
    document?.getElementById?.(id)?.scrollIntoView?.({ behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-[#1a1e10] bg-[#0a0c04]">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <nav className="flex flex-wrap gap-2">
            {[
              { id: 'game-portfolio', label: 'Work', icon: Briefcase },
              { id: 'game-portfolio', label: 'Games', icon: Gamepad2 },
              { id: 'sound-portfolio', label: 'Sound', icon: Music },
              { id: 'about', label: 'About Me', icon: User },
            ]?.map?.((item: any) => {
              const Icon = item?.icon;
              return (
                <button
                  key={item?.label}
                  onClick={() => scrollTo(item?.id ?? 'home')}
                  className="flex items-center gap-2 px-4 py-2 bg-[#94a348] text-[#0a0c04] text-sm font-semibold rounded-lg hover:bg-[#a8b850] transition-colors"
                >
                  {Icon ? <Icon size={14} /> : null}
                  {item?.label ?? ''}
                </button>
              );
            }) ?? []}
          </nav>

          <div className="text-center md:text-right">
            <p className="text-[#8a9a70] text-sm">Designed and Made by Adine Johnson</p>
            <p className="text-[#5a6a40] text-xs mt-1">© Copyright Inversion 2026</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
