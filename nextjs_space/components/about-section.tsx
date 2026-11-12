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
          <User className="text-[#94a348]" size={28} aria-hidden="true" />
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

            {safeProfile?.quote && (
              <div className="bg-[#1a2e38] rounded-xl p-6 shadow-md mb-6">
                <Quote size={24} className="text-[#94a348] mb-3 opacity-60" aria-hidden="true" />
                <p className="text-[#f3f7e4] italic text-lg mb-3">&ldquo;{safeProfile.quote}&rdquo;</p>
              </div>
            )}

            <div className="bg-[#1a2e38] rounded-xl p-6 shadow-md">
              <h4 className="text-[#94a348] font-semibold mb-3">Profile</h4>
              <p className="text-[#c8d4a8] leading-relaxed">{safeProfile?.bio ?? ''}</p>
            </div>

            {(safeProfile?.expertise || (safeProfile?.skills?.length ?? 0) > 0) && (
              <div className="mt-6 bg-[#1a2e38] rounded-xl p-6 shadow-md">
                <h4 className="text-[#94a348] font-semibold mb-3">Expertise</h4>
                {safeProfile?.expertise && (
                  <p className="text-[#c8d4a8] leading-relaxed">{safeProfile.expertise}</p>
                )}
                <div className="flex flex-wrap gap-2 mt-4">
                  {(safeProfile?.skills ?? []).map((skill: string) => (
                    <span key={skill} className="px-3 py-1 bg-[#0a0c04]/50 text-[#94a348] text-xs font-medium rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
