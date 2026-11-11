'use client';

import { motion } from 'framer-motion';
import { Gamepad2, Music, Briefcase, User, FileText, Home } from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  onNavigate: (id: string) => void;
}

const navItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'game-portfolio', label: 'Games', icon: Gamepad2 },
  { id: 'sound-portfolio', label: 'Sound', icon: Music },
  { id: 'work-history', label: 'Work', icon: Briefcase },
  { id: 'about', label: 'About Me', icon: User },
  { id: 'contact', label: 'Resume', icon: FileText },
];

export function Sidebar({ activeSection, onNavigate }: SidebarProps) {
  return (
    <motion.aside
      initial={{ x: -200 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed top-0 left-0 h-screen w-[200px] bg-[#0d0f06] border-r border-[#1a1e10] z-40 flex flex-col justify-between py-8"
    >
      <div>
        <div className="px-6 mb-10">
          <h1 className="text-2xl font-bold text-[#94a348] tracking-wide">Adine.</h1>
          <p className="text-xs text-[#8a9a70] mt-1">Corner of the Internet</p>
        </div>

        <nav className="flex flex-col gap-1 px-3">
          {navItems?.map?.((item: any) => {
            const Icon = item?.icon;
            const isActive = activeSection === item?.id;
            return (
              <button
                key={item?.id}
                onClick={() => onNavigate?.(item?.id ?? 'home')}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-[#94a348] text-[#0a0c04] shadow-md'
                    : 'text-[#c8d4a8] hover:bg-[#151a0a] hover:text-[#94a348]'
                }`}
              >
                {Icon ? <Icon size={18} /> : null}
                {item?.label ?? ''}
              </button>
            );
          }) ?? []}
        </nav>
      </div>

      <div className="px-6">
        <div className="text-xs text-[#5a6a40]">
          <p>© 2026 Inversion</p>
          <p className="mt-1">By Adine Johnson</p>
        </div>
      </div>
    </motion.aside>
  );
}
