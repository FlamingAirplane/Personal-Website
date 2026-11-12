'use client';

import { Briefcase, Gamepad2, Music, Pencil, Trash2 } from 'lucide-react';
import type { PortfolioItem, WorkHistoryItem } from '@/lib/content';
import type { Previewer } from './fields';

function RowButtons({ label, onEdit, onDelete }: { label: string; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex gap-2 opacity-60 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
      <button type="button" aria-label={`Edit ${label}`} onClick={onEdit} className="p-2 rounded-lg hover:bg-[#94a348]/20 text-[#94a348]">
        <Pencil size={16} />
      </button>
      <button type="button" aria-label={`Delete ${label}`} onClick={onDelete} className="p-2 rounded-lg hover:bg-red-500/20 text-red-400">
        <Trash2 size={16} />
      </button>
    </div>
  );
}

export function ProjectRows({
  items,
  type,
  preview,
  onEdit,
  onDelete,
}: {
  items: PortfolioItem[];
  type: 'game' | 'sound';
  preview: Previewer;
  onEdit: (item: PortfolioItem) => void;
  onDelete: (item: PortfolioItem) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-[#8a9a70] text-lg">No {type} projects yet</p>
      </div>
    );
  }
  const Icon = type === 'game' ? Gamepad2 : Music;
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="bg-[#1a2e38] rounded-xl p-4 flex items-center gap-4 group hover:bg-[#1a2e38]/80 transition-colors">
          {item.imageUrl ? (
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#0a0c04] flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview(item.imageUrl)} alt={item.title} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-lg bg-[#0a0c04] flex-shrink-0 flex items-center justify-center">
              <Icon size={24} className="text-[#8a9a70]/40" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[#f3f7e4] truncate">{item.title}</h3>
            <p className="text-sm text-[#8a9a70]">
              {item.category} · {item.year}
              {item.slug ? ` · /projects/${item.slug}` : ''}
            </p>
          </div>
          <RowButtons label={item.title} onEdit={() => onEdit(item)} onDelete={() => onDelete(item)} />
        </div>
      ))}
    </div>
  );
}

export function WorkRows({
  items,
  onEdit,
  onDelete,
}: {
  items: WorkHistoryItem[];
  onEdit: (item: WorkHistoryItem) => void;
  onDelete: (item: WorkHistoryItem) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-[#8a9a70] text-lg">No work history yet</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="bg-[#1a2e38] rounded-xl p-4 flex items-center gap-4 group hover:bg-[#1a2e38]/80 transition-colors">
          <div className="w-12 h-12 rounded-lg bg-[#0a0c04] flex-shrink-0 flex items-center justify-center">
            <Briefcase size={20} className="text-[#8a9a70]/40" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[#f3f7e4] truncate">{item.company}</h3>
            <p className="text-sm text-[#94a348]">{item.position}</p>
            <p className="text-xs text-[#8a9a70]">
              {item.startDate}
              {item.endDate ? ` – ${item.endDate}` : ''}
            </p>
          </div>
          <RowButtons label={item.company} onEdit={() => onEdit(item)} onDelete={() => onDelete(item)} />
        </div>
      ))}
    </div>
  );
}
