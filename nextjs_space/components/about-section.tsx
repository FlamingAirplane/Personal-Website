'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useInView } from 'react-intersection-observer';
import { User, Quote } from 'lucide-react';
import { useState } from 'react';

interface Props {
  profile: any;
}

export function AboutSection({ profile }: Props) {
  const safeProfile = profile ?? {};
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  const [imgError, setImgError] = useState(false);

  return (
    <div ref={ref} className="py-20 px-6 md:px-12 bg-[#0d0f06]">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="max-w-5xl mx-auto"
      >
        <div className="flex items-center gap-3 mb-8">
          <User className="text-[#94a348]" size={28} />
          <h2 className="text-3xl font-bold text-[#f3f7e4] tracking-tight">About Me</h2>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Profile Image */}
          <div className="w-full md:w-1/3">
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#1a2e38] shadow-lg">
              {(safeProfile?.imageUrl && !imgError) ? (
                <Image
                  src={safeProfile.imageUrl}
                  alt={safeProfile?.name ?? 'Adine Johnson'}
                  fill
                  className="object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <User size={64} className="text-[#2c5463] opacity-50" />
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-[#f3f7e4] mb-2">{safeProfile?.name ?? 'Adine Johnson'}</h3>
            <p className="text-[#94a348] font-medium mb-6">{safeProfile?.tagline ?? 'Game Designer & Sound Designer'}</p>

            <div className="bg-[#1a2e38] rounded-xl p-6 shadow-md mb-6">
              <Quote size={24} className="text-[#94a348] mb-3 opacity-60" />
              <p className="text-[#f3f7e4] italic text-lg mb-3">
                "The truest form of joy is making others happy"
              </p>
            </div>

            <div className="bg-[#1a2e38] rounded-xl p-6 shadow-md">
              <h4 className="text-[#94a348] font-semibold mb-3">Profile</h4>
              <p className="text-[#c8d4a8] leading-relaxed">
                {safeProfile?.bio ?? 'Hello, I am Adine Johnson and I am a junior systems designer student majoring in Game Design at Savannah College of Art and Design (SCAD). I am a lover of all types of games and enjoy playing, studying, and making them in my spare time. I also am very fond of reading, writing, and learning about anything.'}
              </p>
            </div>

            <div className="mt-6 bg-[#1a2e38] rounded-xl p-6 shadow-md">
              <h4 className="text-[#94a348] font-semibold mb-3">Expertise</h4>
              <p className="text-[#c8d4a8] leading-relaxed">
                My goal is to create elegant Game Design and awe-inspiring Sound Design. My core passion lies in the meticulous craft of creating elegant game design, focusing on intuitive mechanics, compelling narratives, and engaging player experiences. Complementing this, I am deeply committed to developing awe-inspiring sound design, where every auditory element is carefully sculpted to enhance immersion, convey emotion, and elevate the overall interactive journey.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                {['Game Design', 'Game Art', 'Game Tech', 'Sound Design', 'SFX Design', 'BG SFX Design']?.map?.((skill: string) => (
                  <span key={skill} className="px-3 py-1 bg-[#0a0c04]/50 text-[#94a348] text-xs font-medium rounded-full">
                    {skill}
                  </span>
                )) ?? []}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
