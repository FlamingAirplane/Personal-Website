'use client';

import { useRef } from 'react';
import { Plus, Save, X } from 'lucide-react';
import type { PortfolioItem } from '@/lib/content';
import { youtubeThumbnail } from '@/lib/content';
import { Field, ImageField, PRIMARY_BUTTON, QUIET_BUTTON, TextArea, type Previewer, type Uploader } from './fields';

function readGallery(item: PortfolioItem): string[] {
  try {
    const list = JSON.parse(item.galleryImages || '[]');
    return Array.isArray(list) ? list.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/** The form for adding or editing a game or sound project. */
export function ProjectForm({
  item,
  isNew,
  busy,
  onChange,
  onSave,
  onCancel,
  upload,
  preview,
}: {
  item: PortfolioItem;
  isNew: boolean;
  busy: boolean;
  onChange: (item: PortfolioItem) => void;
  onSave: () => void;
  onCancel: () => void;
  upload: Uploader;
  preview: Previewer;
}) {
  const galleryInput = useRef<HTMLInputElement>(null);
  const gallery = readGallery(item);
  const setGallery = (list: string[]) => onChange({ ...item, galleryImages: JSON.stringify(list) });
  const set = <K extends keyof PortfolioItem>(key: K, value: PortfolioItem[K]) => onChange({ ...item, [key]: value });
  const videoThumb = youtubeThumbnail(item.youtubeUrl);

  async function addGalleryImage(file?: File) {
    if (!file) return;
    const path = await upload(file);
    if (path) setGallery([...gallery, path]);
    if (galleryInput.current) galleryInput.current.value = '';
  }

  return (
    <div className="bg-[#1a2e38] rounded-xl p-6 mb-6 border border-[#2a4a58]">
      <h2 className="text-lg font-bold text-[#94a348] mb-4">{isNew ? 'New Project' : 'Edit Project'}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Title" value={item.title} onChange={(v) => set('title', v)} placeholder="Project title" required />
        <Field label="Category" value={item.category} onChange={(v) => set('category', v)} placeholder="e.g. Game Design & Sound Design" required />
        <Field label="Year" type="number" value={String(item.year)} onChange={(v) => set('year', parseInt(v, 10) || 0)} required />
        <div>
          <label className="block text-sm text-[#8a9a70] mb-1">Type</label>
          <select
            value={item.type}
            onChange={(e) => set('type', e.target.value as PortfolioItem['type'])}
            className="w-full px-3 py-2 rounded-lg bg-[#0a0c04] border border-[#2a4a58] text-[#f3f7e4] text-sm focus:outline-none focus:border-[#94a348]"
          >
            <option value="game">Game</option>
            <option value="sound">Sound</option>
          </select>
        </div>
        <TextArea label="Description" value={item.description} onChange={(v) => set('description', v)} placeholder="Short description..." />
        <div className="md:col-span-2">
          <ImageField label="Cover Image" value={item.imageUrl} onChange={(v) => set('imageUrl', v)} upload={upload} preview={preview} />
        </div>
        <Field
          label="YouTube Link"
          value={item.youtubeUrl ?? ''}
          onChange={(v) => set('youtubeUrl', v)}
          placeholder="https://youtu.be/..."
          hint={
            item.youtubeUrl
              ? videoThumb
                ? 'Its thumbnail is the cover whenever the Cover Image above is empty.'
                : 'That does not look like a YouTube video link.'
              : 'Optional. Its thumbnail becomes the cover when there is no Cover Image.'
          }
        />
        <Field label="Project Link" value={item.projectLink} onChange={(v) => set('projectLink', v)} placeholder="https://... (# for none)" hint="Defaults to the YouTube link when empty or #." />
        <Field label="Embed Link (plays inside the room)" value={item.embedUrl ?? ''} onChange={(v) => set('embedUrl', v.trim())} placeholder="https://..." hint="Optional. A web game shown in the room's arcade machine." />
        <Field label="Source Code Link" value={item.sourceUrl ?? ''} onChange={(v) => set('sourceUrl', v.trim())} placeholder="https://github.com/..." hint="Optional. Shown as a View Code link in the room." />
        <Field label="Tags" value={item.tags} onChange={(v) => set('tags', v)} placeholder="Unity, C#, 3D" hint="Separate with commas." />
        <Field
          label="URL Slug (for the project page)"
          value={item.slug}
          onChange={(v) => set('slug', v.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
          placeholder="my-project"
          hint="Filled in from the title when left empty."
        />
        <Field label="Sort Order" type="number" value={String(item.sortOrder ?? 0)} onChange={(v) => set('sortOrder', parseInt(v, 10) || 0)} hint="Lower numbers show first." />
        <TextArea
          label="Project Page Content"
          value={item.subpageContent ?? ''}
          onChange={(v) => set('subpageContent', v)}
          rows={8}
          mono
          hint="Use ## for headings, ### for subheadings, - for bullet points. Adds a Read More button to the project."
          placeholder={'## About This Project\n\nDetailed description...'}
        />
        <div className="md:col-span-2">
          <label className="block text-sm text-[#8a9a70] mb-2">Gallery Images</label>
          <div className="flex flex-wrap gap-3 mb-3">
            {gallery.map((path, i) => (
              <div key={`${path}-${i}`} className="relative w-24 h-24 rounded-lg overflow-hidden bg-[#0a0c04] group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview(path)} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  aria-label="Remove image"
                  onClick={() => setGallery(gallery.filter((_, n) => n !== i))}
                  className="absolute top-1 right-1 p-1 bg-red-500/80 rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                >
                  <X size={12} className="text-white" />
                </button>
              </div>
            ))}
            <button
              type="button"
              aria-label="Add gallery image"
              onClick={() => galleryInput.current?.click()}
              className="w-24 h-24 rounded-lg border-2 border-dashed border-[#2a4a58] flex items-center justify-center hover:border-[#94a348] transition-colors"
            >
              <Plus size={24} className="text-[#8a9a70]" />
            </button>
          </div>
          <input ref={galleryInput} type="file" accept="image/*" className="hidden" onChange={(e) => addGalleryImage(e.target.files?.[0])} />
        </div>
      </div>
      <div className="flex gap-3 mt-5">
        <button type="button" onClick={onSave} disabled={busy} className={PRIMARY_BUTTON}>
          <Save size={16} /> {busy ? 'Saving...' : 'Save'}
        </button>
        <button type="button" onClick={onCancel} disabled={busy} className={QUIET_BUTTON}>
          <X size={16} /> Cancel
        </button>
      </div>
    </div>
  );
}
