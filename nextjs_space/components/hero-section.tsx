'use client';

import { withBase } from '@/lib/site';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';
import { PointCloudTitle } from './point-cloud-title';

interface Props {
  profile: any;
}

export function HeroSection({ profile }: Props) {
  const safeProfile = profile ?? {};
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="relative w-full h-full">
          <Image
            src={safeProfile.heroBgUrl || withBase('/images/hero-bg.jpeg')}
            alt="Hero background - scenic landscape"
            fill
            className="object-cover opacity-30"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0c04]/60 via-[#0a0c04]/40 to-[#0a0c04]"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-[#94a348] text-sm font-semibold tracking-widest uppercase mb-4">Welcome to</p>
          <div className="mb-4">
            <PointCloudTitle />
          </div>
          <p className="text-[#8a9a70] text-lg md:text-xl mt-6 max-w-lg mx-auto">
            Corner of the Internet
          </p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-[#c8d4a8] text-base md:text-lg mt-4"
          >
            Game Designer & Sound Designer attending SCAD
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="mt-12"
        >
          <button
            onClick={() => document?.getElementById?.('game-portfolio')?.scrollIntoView?.({ behavior: 'smooth' })}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#94a348] text-[#0a0c04] font-semibold rounded-lg hover:bg-[#a8b850] transition-colors shadow-lg"
          >
            View My Work
            <ChevronDown size={18} />
          </button>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <ChevronDown size={28} className="text-[#94a348] opacity-60" />
      </motion.div>
    </div>
  );
}
