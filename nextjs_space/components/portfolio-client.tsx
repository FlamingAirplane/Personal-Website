'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { hasResumeSection, type PortfolioItem, type Profile, type WorkHistoryItem } from '@/lib/content';
import { Sidebar } from './sidebar';
import { HeroSection } from './hero-section';
import { GamePortfolio } from './game-portfolio';
import { SoundPortfolio } from './sound-portfolio';
import { WorkHistorySection } from './work-history-section';
import { AboutSection } from './about-section';
import { ContactSection } from './contact-section';
import { FooterSection } from './footer-section';
import { FloatingParticles } from './floating-particles';
import { EnterRoomLink } from './mode-gate';
import { navItems } from './nav-items';

interface Props {
  portfolioItems: PortfolioItem[];
  workHistory: WorkHistoryItem[];
  profile: Profile;
}

export function PortfolioClient({ portfolioItems, workHistory, profile }: Props) {
  const [activeSection, setActiveSection] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const gameItems = portfolioItems.filter((item) => item.type === 'game');
  const soundItems = portfolioItems.filter((item) => item.type === 'sound');
  const showResume = hasResumeSection(profile);
  const NAV_ITEMS = navItems(profile);

  // Highlight the menu entry for the section being read.
  useEffect(() => {
    let queued = false;
    const update = () => {
      queued = false;
      const line = window.innerHeight * 0.35;
      let current = NAV_ITEMS[0].id;
      for (const { id } of NAV_ITEMS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) current = id;
      }
      // The last section is short, so it may never reach the line.
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (atBottom) current = NAV_ITEMS[NAV_ITEMS.length - 1].id;
      setActiveSection(current);
    };
    // At most once per frame, however fast the scroll events arrive.
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [NAV_ITEMS.length]);

  return (
    <div className="flex min-h-screen bg-[#0a0c04]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:bg-[#94a348] focus:px-4 focus:py-2 focus:font-semibold focus:text-[#0a0c04]"
      >
        Skip to content
      </a>

      <FloatingParticles />

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar activeSection={activeSection} />
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#0a0c04]/95 backdrop-blur-sm border-b border-[#1a1e10]">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <a href="#home" className="text-xl font-bold text-[#94a348]">
            {profile.siteName}
          </a>
          <div className="flex items-center gap-2">
            <EnterRoomLink className="border border-[#2e3a1c] px-3 py-2 font-mono text-[11px] uppercase tracking-widest text-[#94a348] transition-colors hover:border-[#94a348] hover:text-[#f3f7e4]" />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              className="p-2 text-[#f3f7e4] hover:text-[#94a348] transition-colors"
            >
              {mobileMenuOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              id="mobile-menu"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-[#1a1e10]"
            >
              <nav aria-label="Sections" className="flex flex-col gap-1 p-4">
                {NAV_ITEMS.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={() => setMobileMenuOpen(false)}
                    aria-current={activeSection === item.id ? 'true' : undefined}
                    className={`text-left px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      activeSection === item.id
                        ? 'bg-[#94a348] text-[#0a0c04]'
                        : 'text-[#f3f7e4] hover:bg-[#1a1e10]'
                    }`}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Content. Sections scroll to just below the fixed mobile header. */}
      <main id="main" tabIndex={-1} className="flex-1 lg:ml-[200px] outline-none">
        <div className="pt-16 lg:pt-0 [&>section]:scroll-mt-14 lg:[&>section]:scroll-mt-0">
          <section id="home">
            <HeroSection profile={profile} />
          </section>
          <section id="game-portfolio">
            <GamePortfolio items={gameItems} />
          </section>
          <section id="sound-portfolio">
            <SoundPortfolio items={soundItems} />
          </section>
          <section id="work-history">
            <WorkHistorySection items={workHistory} />
          </section>
          <section id="about">
            <AboutSection profile={profile} />
          </section>
          {showResume && (
            <section id="contact">
              <ContactSection profile={profile} />
            </section>
          )}
          <FooterSection />
        </div>
      </main>
    </div>
  );
}
