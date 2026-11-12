'use client';

import { useRef, useState } from 'react';
import { Image as ImageIcon, Loader2, Upload } from 'lucide-react';
import { withBase } from '@/lib/site';

export const INPUT =
  'w-full px-3 py-2 rounded-lg bg-[#0a0c04] border border-[#2a4a58] text-[#f3f7e4] text-sm focus:outline-none focus:border-[#94a348]';
export const PRIMARY_BUTTON =
  'flex items-center gap-2 px-5 py-2 bg-[#94a348] text-[#0a0c04] font-semibold rounded-lg hover:bg-[#a8b850] transition-colors text-sm disabled:opacity-50';
export const QUIET_BUTTON =
  'flex items-center gap-2 px-5 py-2 bg-[#1a1e10] text-[#c8d4a8] rounded-lg hover:bg-[#252a14] transition-colors text-sm disabled:opacity-50';

/** Uploads a file to the repository and returns its site path, or null when it failed (the page shows why). */
export type Uploader = (file: File) => Promise<string | null>;

/** Where to show a picture from: a just-uploaded file shows at once, before the site has republished. */
export type Previewer = (path: string) => string;

export const previewPath: Previewer = (path) => withBase(path);

export function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm text-[#8a9a70] mb-1">
        {label}
        {required && ' *'}
      </label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className={INPUT} placeholder={placeholder} />
      {hint && <p className="text-xs text-[#8a9a70]/60 mt-1">{hint}</p>}
    </div>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  hint,
  mono = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  hint?: string;
  mono?: boolean;
}) {
  return (
    <div className="md:col-span-2">
      <label className="block text-sm text-[#8a9a70] mb-1">{label}</label>
      {hint && <p className="text-xs text-[#8a9a70]/60 mb-2">{hint}</p>}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className={`${INPUT} resize-y ${mono ? 'font-mono' : ''}`}
        placeholder={placeholder}
      />
    </div>
  );
}

export function Slider({
  label,
  unit = '',
  value,
  min,
  max,
  onChange,
  hint,
}: {
  label: string;
  unit?: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm text-[#8a9a70] mb-1">
        {label} ({value}
        {unit})
      </label>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-full accent-[#94a348]"
      />
      {hint && <p className="text-xs text-[#8a9a70]/60 mt-1">{hint}</p>}
    </div>
  );
}

/** A picture: upload one, or paste an address. Shows a small preview. */
export function ImageField({
  label,
  value,
  onChange,
  upload,
  preview,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  upload: Uploader;
  preview: Previewer;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function pick(file?: File) {
    if (!file) return;
    setBusy(true);
    const path = await upload(file);
    if (path) onChange(path);
    setBusy(false);
    if (input.current) input.current.value = '';
  }

  return (
    <div>
      <label className="block text-sm text-[#8a9a70] mb-1">{label}</label>
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#0a0c04] flex-shrink-0 flex items-center justify-center">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview(value)}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
            />
          ) : (
            <ImageIcon size={20} className="text-[#8a9a70]/40" />
          )}
        </div>
        <button type="button" onClick={() => input.current?.click()} disabled={busy} className={QUIET_BUTTON}>
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} {busy ? 'Uploading...' : 'Upload'}
        </button>
        <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${INPUT} mt-2`}
        placeholder="Or paste an address, e.g. /images/portfolio/cover.jpg"
      />
    </div>
  );
}
