'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './sidebar';
import { HeroSection } from './hero-section';
import { GamePortfolio } from './game-portfolio';
import { SoundPortfolio } from './sound-portfolio';
import { WorkHistorySection } from './work-history-section';
import { AboutSection } from './about-section';
import { ContactSection } from './contact-section';
import { FooterSection } from './footer-section';
import { Menu, X } from 'lucide-react';
import { FloatingParticles } from './floating-particles';

interface Props {
  portfolioItems: any[];
  workHistory: any[];
  profile: any;
}

export function PortfolioClient({ portfolioItems, workHistory, profile }: Props) {
  const [activeSection, setActiveSection] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const safePortfolio = portfolioItems ?? [];
  const safeWork = workHistory ?? [];
  const safeProfile = profile ?? {};

  const gameItems = safePortfolio?.filter?.((item: any) => item?.type === 'game') ?? [];
  const soundItems = safePortfolio?.filter?.((item: any) => item?.type === 'sound') ?? [];

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'game-portfolio', 'sound-portfolio', 'work-history', 'about', 'contact'];
      for (const sectionId of sections) {
        const el = document?.getElementById?.(sectionId);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 200 && rect.bottom > 200) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };
    window?.addEventListener?.('scroll', handleScroll);
    return () => window?.removeEventListener?.('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document?.getElementById?.(id);
    el?.scrollIntoView?.({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-[#0a0c04]">
      <FloatingParticles />
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar activeSection={activeSection} onNavigate={scrollTo} />
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#0a0c04]/95 backdrop-blur-sm border-b border-[#1a1e10]">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-[#94a348]">Adine.</h1>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#f3f7e4] hover:text-[#94a348] transition-colors"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-[#1a1e10]"
            >
              <nav className="flex flex-col gap-1 p-4">
                {[
                  { id: 'home', label: 'Home' },
                  { id: 'game-portfolio', label: 'Games' },
                  { id: 'sound-portfolio', label: 'Sound' },
                  { id: 'work-history', label: 'Work' },
                  { id: 'about', label: 'About Me' },
                  { id: 'contact', label: 'Resume' },
                ]?.map?.((item: any) => (
                  <button
                    key={item?.id}
                    onClick={() => scrollTo(item?.id ?? 'home')}
                    className={`text-left px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      activeSection === item?.id
                        ? 'bg-[#94a348] text-[#0a0c04]'
                        : 'text-[#f3f7e4] hover:bg-[#1a1e10]'
                    }`}
                  >
                    {item?.label}
                  </button>
                )) ?? []}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:ml-[200px]">
        <div className="pt-16 lg:pt-0">
          <section id="home">
            <HeroSection profile={safeProfile} />
          </section>
          <section id="game-portfolio">
            <GamePortfolio items={gameItems} />
          </section>
          <section id="sound-portfolio">
            <SoundPortfolio items={soundItems} />
          </section>
          <section id="work-history">
            <WorkHistorySection items={safeWork} />
          </section>
          <section id="about">
            <AboutSection profile={safeProfile} />
          </section>
          <section id="contact">
            <ContactSection profile={safeProfile} />
          </section>
          <FooterSection />
        </div>
      </main>
    </div>
  );
}
