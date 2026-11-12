'use client';

import { Save, X } from 'lucide-react';
import type { WorkHistoryItem } from '@/lib/content';
import { Field, PRIMARY_BUTTON, QUIET_BUTTON, TextArea } from './fields';

/** The form for adding or editing a job. */
export function WorkForm({
  item,
  isNew,
  busy,
  onChange,
  onSave,
  onCancel,
}: {
  item: WorkHistoryItem;
  isNew: boolean;
  busy: boolean;
  onChange: (item: WorkHistoryItem) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const set = <K extends keyof WorkHistoryItem>(key: K, value: WorkHistoryItem[K]) => onChange({ ...item, [key]: value });

  return (
    <div className="bg-[#1a2e38] rounded-xl p-6 mb-6 border border-[#2a4a58]">
      <h2 className="text-lg font-bold text-[#94a348] mb-4">{isNew ? 'New Work Entry' : 'Edit Work Entry'}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Company" value={item.company} onChange={(v) => set('company', v)} placeholder="Company name" required />
        <Field label="Position" value={item.position} onChange={(v) => set('position', v)} placeholder="Job title" required />
        <Field label="Start Date" value={item.startDate} onChange={(v) => set('startDate', v)} placeholder="Jan 2024" required />
        <Field label="End Date" value={item.endDate} onChange={(v) => set('endDate', v)} placeholder="Present" />
        <TextArea label="Description" value={item.description} onChange={(v) => set('description', v)} placeholder="Role description..." />
        <Field label="Sort Order" type="number" value={String(item.sortOrder ?? 0)} onChange={(v) => set('sortOrder', parseInt(v, 10) || 0)} hint="Lower numbers show first." />
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
