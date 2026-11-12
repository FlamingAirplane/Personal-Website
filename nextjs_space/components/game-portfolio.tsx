'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useInView } from 'react-intersection-observer';
import { Gamepad2, ExternalLink, Calendar, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { hasProjectPageContent } from '@/lib/content';
import { useSiteLinks } from '@/lib/preview';
import { TiltCard } from './tilt-card';

interface Props {
  items: any[];
}

export function GamePortfolio({ items }: Props) {
  const safeItems = items ?? [];
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <div ref={ref} className="py-20 px-6 md:px-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="max-w-5xl mx-auto"
      >
        <div className="flex items-center gap-3 mb-8">
          <Gamepad2 className="text-[#94a348]" size={28} aria-hidden="true" />
          <h2 className="text-3xl font-bold text-[#f3f7e4] tracking-tight">Game Portfolio</h2>
        </div>

        {(safeItems?.length ?? 0) === 0 ? (
          <p className="text-[#8a9a70]">Portfolio items coming soon...</p>
        ) : (
          <div className="space-y-6">
            {safeItems?.map?.((item: any, index: number) => (
              <PortfolioCard key={item?.id ?? index} item={item} index={index} inView={inView} />
            )) ?? []}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function PortfolioCard({ item, index, inView }: { item: any; index: number; inView: boolean }) {
  const [imgError, setImgError] = useState(false);
  const links = useSiteLinks();
  const safeItem = item ?? {};
  const isEven = index % 2 === 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: isEven ? -40 : 40 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <TiltCard className="bg-[#1a2e38] rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 group">
        <div className={`flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
          {/* Image */}
          <div className="relative w-full md:w-2/5 aspect-video md:aspect-auto md:min-h-[200px] bg-[#142028] overflow-hidden">
            {(safeItem?.imageUrl && !imgError) ? (
              <Image
                src={safeItem.imageUrl}
                alt={safeItem?.title ?? 'Portfolio item'}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="flex items-center justify-center h-full min-h-[200px]">
                <Gamepad2 size={48} className="text-[#2c5463] opacity-50" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-[#94a348] text-xs font-semibold uppercase tracking-wider">{safeItem?.category ?? ''}</p>
                <h3 className="text-xl font-bold text-[#f3f7e4] mt-1">{safeItem?.title ?? 'Untitled'}</h3>
              </div>
              <div className="flex items-center gap-1 text-[#8a9a70] text-sm">
                <Calendar size={14} aria-hidden="true" />
                <span>{safeItem?.year ?? ''}</span>
              </div>
            </div>

            <p className="text-[#c8d4a8] text-sm mt-3 leading-relaxed">
              {safeItem?.description ?? ''}
            </p>

            {safeItem?.tags && (
              <div className="flex flex-wrap gap-2 mt-4">
                {(safeItem.tags ?? '')?.split?.(',')?.map?.((tag: string, i: number) => (
                  <span key={i} className="px-2 py-1 bg-[#0a0c04]/50 text-[#94a348] text-xs rounded-md font-medium">
                    {tag?.trim?.() ?? ''}
                  </span>
                )) ?? []}
              </div>
            )}

            <div className="flex flex-wrap gap-3 mt-4">
              {/* Only offered once the project page has more than this card does. */}
              {safeItem?.slug && hasProjectPageContent(safeItem) && (
                <Link
                  href={links.project(safeItem.slug)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#94a348] text-[#0a0c04] text-sm font-semibold rounded-lg hover:bg-[#a8b850] transition-colors"
                >
                  Read More <ArrowRight size={14} />
                </Link>
              )}
              {safeItem?.projectLink && safeItem.projectLink !== '#' && (
                <a
                  href={safeItem.projectLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 border border-[#94a348] text-[#94a348] text-sm font-semibold rounded-lg hover:bg-[#94a348] hover:text-[#0a0c04] transition-colors"
                >
                  View Project <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>
        </div>
      </TiltCard>
    </motion.div>
  );
}
