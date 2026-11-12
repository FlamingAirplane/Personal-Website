'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Briefcase, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface Props {
  items: any[];
}

export function WorkHistorySection({ items }: Props) {
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
          <Briefcase className="text-[#94a348]" size={28} aria-hidden="true" />
          <h2 className="text-3xl font-bold text-[#f3f7e4] tracking-tight">Work History</h2>
        </div>

        {(safeItems?.length ?? 0) === 0 ? (
          <p className="text-[#8a9a70]">Work history coming soon...</p>
        ) : (
          <div className="space-y-4">
            {safeItems?.map?.((item: any, index: number) => (
              <WorkItem key={item?.id ?? index} item={item} index={index} inView={inView} />
            )) ?? []}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function WorkItem({ item, index, inView }: { item: any; index: number; inView: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const safeItem = item ?? {};
  const panelId = `work-${safeItem?.id ?? index}`;

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="bg-[#1a2e38] rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow"
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-controls={panelId}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h3 className="text-[#f3f7e4] font-bold">{safeItem?.company ?? 'Company'}</h3>
            <span className="text-[#94a348] text-sm font-medium">— {safeItem?.position ?? 'Position'}</span>
          </div>
          <p className="text-[#8a9a70] text-sm mt-1">
            {safeItem?.startDate ?? ''}{safeItem?.endDate ? ` – ${safeItem.endDate}` : ''}
          </p>
        </div>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          <ChevronDown size={20} className="text-[#94a348]" aria-hidden="true" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && safeItem?.description && (
          <motion.div
            key="content"
            id={panelId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-5 pb-5">
              <p className="text-[#c8d4a8] text-sm leading-relaxed border-t border-[#0a0c04]/30 pt-4">
                {safeItem.description}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
