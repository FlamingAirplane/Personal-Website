'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Calendar, ExternalLink, Gamepad2, Music } from 'lucide-react';
import { useState } from 'react';

interface Props {
  item: any;
}

export function ProjectPageClient({ item }: Props) {
  const safeItem = item ?? {};
  const [imgError, setImgError] = useState(false);
  const galleryImages: string[] = (() => {
    try {
      return JSON.parse(safeItem.galleryImages || '[]');
    } catch {
      return [];
    }
  })();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const TypeIcon = safeItem.type === 'sound' ? Music : Gamepad2;

  return (
    <div className="min-h-screen bg-[#0a0c04] text-[#f3f7e4]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0d0f06]/95 backdrop-blur-sm border-b border-[#1a1e10]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="p-2 rounded-lg hover:bg-[#1a1e10] transition-colors">
            <ArrowLeft size={20} className="text-[#94a348]" />
          </Link>
          <div className="flex items-center gap-2">
            <TypeIcon size={18} className="text-[#94a348]" />
            <h1 className="text-lg font-bold text-[#f3f7e4] truncate">{safeItem.title}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Hero Image */}
          {safeItem.imageUrl && !imgError && (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-[#142028] mb-8">
              <Image
                src={safeItem.imageUrl}
                alt={safeItem.title ?? 'Project'}
                fill
                className="object-cover"
                onError={() => setImgError(true)}
                priority
              />
            </div>
          )}

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <span className="px-3 py-1 bg-[#94a348] text-[#0a0c04] text-xs font-bold rounded-lg uppercase">
              {safeItem.category}
            </span>
            <div className="flex items-center gap-1 text-[#8a9a70] text-sm">
              <Calendar size={14} />
              <span>{safeItem.year}</span>
            </div>
            {safeItem.tags && (
              <div className="flex flex-wrap gap-2">
                {safeItem.tags.split(',').map((tag: string, i: number) => (
                  <span key={i} className="px-2 py-1 bg-[#1a2e38] text-[#94a348] text-xs rounded-md font-medium">
                    {tag.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#f3f7e4] mb-6">{safeItem.title}</h1>

          {/* Description */}
          {safeItem.description && (
            <p className="text-[#c8d4a8] text-lg leading-relaxed mb-8">{safeItem.description}</p>
          )}

          {/* Subpage Content (Markdown-style) */}
          {safeItem.subpageContent && (
            <div className="prose prose-invert max-w-none mb-8">
              <div className="bg-[#1a2e38] rounded-xl p-6 md:p-8">
                {safeItem.subpageContent.split('\n').map((paragraph: string, i: number) => {
                  const trimmed = paragraph.trim();
                  if (!trimmed) return <br key={i} />;
                  if (trimmed.startsWith('## ')) {
                    return <h2 key={i} className="text-2xl font-bold text-[#94a348] mt-6 mb-3">{trimmed.slice(3)}</h2>;
                  }
                  if (trimmed.startsWith('### ')) {
                    return <h3 key={i} className="text-xl font-bold text-[#f3f7e4] mt-4 mb-2">{trimmed.slice(4)}</h3>;
                  }
                  if (trimmed.startsWith('- ')) {
                    return <li key={i} className="text-[#c8d4a8] ml-4 list-disc">{trimmed.slice(2)}</li>;
                  }
                  return <p key={i} className="text-[#c8d4a8] leading-relaxed mb-3">{trimmed}</p>;
                })}
              </div>
            </div>
          )}

          {/* Gallery */}
          {galleryImages.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[#f3f7e4] mb-4">Gallery</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {galleryImages.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(url)}
                    className="relative aspect-video rounded-lg overflow-hidden bg-[#142028] hover:ring-2 hover:ring-[#94a348] transition-all"
                  >
                    <Image src={url} alt={`Gallery ${i + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Project Link */}
          {safeItem.projectLink && safeItem.projectLink !== '#' && (
            <a
              href={safeItem.projectLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#94a348] text-[#0a0c04] font-semibold rounded-lg hover:bg-[#a8b850] transition-colors text-lg"
            >
              View Live Project <ExternalLink size={18} />
            </a>
          )}
        </motion.div>
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl w-full aspect-video">
            <Image src={selectedImage} alt="Gallery full view" fill className="object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
