'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';
import type { Profile } from '@/lib/content';
import { PointCloudTitle } from './point-cloud-title';

interface Props {
  profile: Profile;
}

export function HeroSection({ profile }: Props) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background (decorative, so it has no text alternative) */}
      <div className="absolute inset-0" aria-hidden="true">
        <div className="relative w-full h-full">
          <Image src={profile.heroBgUrl} alt="" fill className="object-cover opacity-30" priority />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0c04]/60 via-[#0a0c04]/40 to-[#0a0c04]"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
        {/* The page's real heading. The big title below is a drawing. */}
        <h1 className="sr-only">
          {profile.name}: {profile.tagline}
        </h1>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-[#94a348] text-sm font-semibold tracking-widest uppercase mb-4">Welcome to</p>
          <div className="mb-4">
            <PointCloudTitle text={profile.siteName} />
          </div>
          <p className="text-[#8a9a70] text-lg md:text-xl mt-6 max-w-lg mx-auto">{profile.strapline}</p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-[#c8d4a8] text-base md:text-lg mt-4"
          >
            {profile.tagline}
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="mt-12"
        >
          <a
            href="#game-portfolio"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#94a348] text-[#0a0c04] font-semibold rounded-lg hover:bg-[#a8b850] transition-colors shadow-lg"
          >
            View My Work
            <ChevronDown size={18} aria-hidden="true" />
          </a>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        aria-hidden="true"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <ChevronDown size={28} className="text-[#94a348] opacity-60" />
      </motion.div>
    </div>
  );
}
