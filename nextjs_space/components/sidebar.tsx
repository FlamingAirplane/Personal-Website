'use client';

import { motion } from 'framer-motion';
import { useSiteContent } from '@/lib/preview';
import { EnterRoomLink } from './mode-gate';
import { navItems } from './nav-items';

interface SidebarProps {
  activeSection: string;
}

export function Sidebar({ activeSection }: SidebarProps) {
  const { profile } = useSiteContent();
  const NAV_ITEMS = navItems(profile);
  return (
    <motion.aside
      initial={{ x: -200 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed top-0 left-0 h-screen w-[200px] bg-[#0d0f06] border-r border-[#1a1e10] z-40 flex flex-col justify-between py-8"
    >
      <div>
        <div className="px-6 mb-10">
          <a href="#home" className="block text-2xl font-bold text-[#94a348] tracking-wide">
            {profile.siteName}
          </a>
          <p className="text-xs text-[#8a9a70] mt-1">{profile.strapline}</p>
        </div>

        <nav aria-label="Sections" className="flex flex-col gap-1 px-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                aria-current={isActive ? 'true' : undefined}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-[#94a348] text-[#0a0c04] shadow-md'
                    : 'text-[#c8d4a8] hover:bg-[#151a0a] hover:text-[#94a348]'
                }`}
              >
                <Icon size={18} aria-hidden="true" />
                {item.label}
              </a>
            );
          })}
        </nav>
      </div>

      <div className="px-6">
        <EnterRoomLink className="mb-6 block border border-[#2e3a1c] px-3 py-2 text-center font-mono text-xs uppercase tracking-widest text-[#94a348] transition-colors hover:border-[#94a348] hover:text-[#f3f7e4]" />
        <div className="text-xs text-[#8a9a70]">
          <p>© 2026 Inversion</p>
          <p className="mt-1">By {profile.name}</p>
        </div>
      </div>
    </motion.aside>
  );
}
