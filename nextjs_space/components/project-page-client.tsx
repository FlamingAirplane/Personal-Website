'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Calendar, ExternalLink, Gamepad2, Music, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { parseGallery, type PortfolioItem } from '@/lib/content';
import { useSiteLinks } from '@/lib/preview';
import { EnterRoomLink } from './mode-gate';

interface ProjectLink {
  slug: string;
  title: string;
}

interface Props {
  item: PortfolioItem;
  previous: ProjectLink;
  next: ProjectLink;
}

export function ProjectPageClient({ item, previous, next }: Props) {
  const [imgError, setImgError] = useState(false);
  const links = useSiteLinks();
  const galleryImages = parseGallery(item);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const TypeIcon = item.type === 'sound' ? Music : Gamepad2;
  const tags = (item.tags ?? '').split(',').map((t) => t.trim()).filter(Boolean);

  // The enlarged image: Escape closes it, and focus goes in and comes back.
  useEffect(() => {
    if (!selectedImage) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedImage(null);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      openerRef.current?.focus();
    };
  }, [selectedImage]);

  return (
    <div className="min-h-screen bg-[#0a0c04] text-[#f3f7e4]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0d0f06]/95 backdrop-blur-sm border-b border-[#1a1e10]">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link
            href={links.home}
            className="flex min-w-0 items-center gap-2 rounded-lg p-2 text-sm font-semibold text-[#94a348] hover:bg-[#1a1e10] transition-colors"
          >
            <ArrowLeft size={20} aria-hidden="true" className="shrink-0" />
            <span>All work</span>
          </Link>
          <p className="hidden min-w-0 items-center gap-2 sm:flex" aria-hidden="true">
            <TypeIcon size={18} className="shrink-0 text-[#94a348]" />
            <span className="truncate font-bold">{item.title}</span>
          </p>
          <EnterRoomLink className="shrink-0 border border-[#2e3a1c] px-3 py-2 font-mono text-[11px] uppercase tracking-widest text-[#94a348] transition-colors hover:border-[#94a348] hover:text-[#f3f7e4]" />
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Hero Image */}
          {item.imageUrl && !imgError && (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-[#142028] mb-8">
              <Image
                src={item.imageUrl}
                alt=""
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
              {item.category}
            </span>
            <div className="flex items-center gap-1 text-[#8a9a70] text-sm">
              <Calendar size={14} aria-hidden="true" />
              <span>{item.year}</span>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span key={tag} className="px-2 py-1 bg-[#1a2e38] text-[#94a348] text-xs rounded-md font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#f3f7e4] mb-6">{item.title}</h1>

          {/* Description */}
          {item.description && (
            <p className="text-[#c8d4a8] text-lg leading-relaxed mb-8">{item.description}</p>
          )}

          {/* Write-up: plain text with "## heading", "### heading" and "- item" lines */}
          {item.subpageContent && (
            <div className="max-w-none mb-8">
              <div className="bg-[#1a2e38] rounded-xl p-6 md:p-8">
                {item.subpageContent.split('\n').map((paragraph, i) => {
                  const trimmed = paragraph.trim();
                  if (!trimmed) return <br key={i} />;
                  if (trimmed.startsWith('## ')) {
                    return <h2 key={i} className="text-2xl font-bold text-[#94a348] mt-6 mb-3">{trimmed.slice(3)}</h2>;
                  }
                  if (trimmed.startsWith('### ')) {
                    return <h3 key={i} className="text-xl font-bold text-[#f3f7e4] mt-4 mb-2">{trimmed.slice(4)}</h3>;
                  }
                  if (trimmed.startsWith('- ')) {
                    return <p key={i} className="text-[#c8d4a8] ml-4 mb-1">• {trimmed.slice(2)}</p>;
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
                    key={url}
                    type="button"
                    onClick={(e) => {
                      openerRef.current = e.currentTarget;
                      setSelectedImage(url);
                    }}
                    aria-label={`Enlarge image ${i + 1} of ${galleryImages.length}`}
                    className="relative aspect-video rounded-lg overflow-hidden bg-[#142028] hover:ring-2 hover:ring-[#94a348] transition-all"
                  >
                    <Image src={url} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Project Link */}
          {item.projectLink && item.projectLink !== '#' && (
            <a
              href={item.projectLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#94a348] text-[#0a0c04] font-semibold rounded-lg hover:bg-[#a8b850] transition-colors text-lg"
            >
              View Live Project <ExternalLink size={18} aria-hidden="true" />
            </a>
          )}
        </motion.div>

        {/* On to the neighbouring projects */}
        <nav aria-label="More projects" className="mt-12 grid gap-4 border-t border-[#1a1e10] pt-8 sm:grid-cols-2">
          <Link
            href={links.project(previous.slug)}
            className="rounded-xl bg-[#1a2e38] p-5 transition-colors hover:bg-[#21394a]"
          >
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#94a348]">
              <ArrowLeft size={14} aria-hidden="true" /> Previous
            </span>
            <span className="mt-2 block font-bold">{previous.title}</span>
          </Link>
          <Link
            href={links.project(next.slug)}
            className="rounded-xl bg-[#1a2e38] p-5 text-right transition-colors hover:bg-[#21394a]"
          >
            <span className="flex items-center justify-end gap-2 text-xs font-semibold uppercase tracking-wider text-[#94a348]">
              Next <ArrowRight size={14} aria-hidden="true" />
            </span>
            <span className="mt-2 block font-bold">{next.title}</span>
          </Link>
        </nav>
      </main>

      {/* Enlarged gallery image */}
      {selectedImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged image"
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            ref={closeRef}
            type="button"
            onClick={() => setSelectedImage(null)}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-lg bg-[#0a0c04]/80 p-2 text-[#f3f7e4] hover:text-[#94a348]"
          >
            <X size={24} aria-hidden="true" />
          </button>
          <div className="relative max-w-5xl w-full aspect-video">
            <Image src={selectedImage} alt={`${item.title}, enlarged gallery image`} fill className="object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
