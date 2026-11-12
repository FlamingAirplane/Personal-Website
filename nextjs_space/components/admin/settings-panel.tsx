'use client';

import { useState } from 'react';
import { Save, Settings, SlidersVertical } from 'lucide-react';
import type { SiteSettings } from '@/lib/content';
import { Field, PRIMARY_BUTTON, Slider } from './fields';

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="flex-1">
      <label className="block text-sm text-[#8a9a70] mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded cursor-pointer border border-[#2a4a58] bg-transparent"
        />
        <span className="text-sm text-[#c8d4a8] font-mono">{value}</span>
      </div>
    </div>
  );
}

/** The big title's text and particles, and the custom cursor. */
export function SettingsPanel({
  titleText,
  settings,
  busy,
  onSave,
}: {
  titleText: string;
  settings: SiteSettings;
  busy: boolean;
  onSave: (titleText: string, settings: SiteSettings, message: string) => void;
}) {
  const [title, setTitle] = useState(titleText);
  const [draft, setDraft] = useState(settings);
  const set = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => setDraft({ ...draft, [key]: value });

  return (
    <div className="bg-[#1a2e38] rounded-xl p-6 border border-[#2a4a58]">
      <h2 className="text-lg font-bold text-[#94a348] mb-4 flex items-center gap-2">
        <SlidersVertical size={20} /> Title &amp; Particle Settings
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Title Text" value={title} onChange={setTitle} placeholder="Adine." hint="The big title on the home page and the logo in the menu." />
        <Slider label="Mouse Radius" unit="px" min={20} max={200} value={draft.particleMouseRadius} onChange={(v) => set('particleMouseRadius', v)} />
        <Slider label="Push Force" min={1} max={20} value={draft.particlePushForce} onChange={(v) => set('particlePushForce', v)} />
        <Slider label="Return Speed" unit="%" min={1} max={20} value={draft.particleReturnSpeed} onChange={(v) => set('particleReturnSpeed', v)} />
        <Slider label="Friction" unit="%" min={50} max={99} value={draft.particleFriction} onChange={(v) => set('particleFriction', v)} />
        <Slider label="Particle Gap" unit="px" min={1} max={8} value={draft.particleGap} onChange={(v) => set('particleGap', v)} />
      </div>

      <h2 className="text-lg font-bold text-[#94a348] mt-8 mb-4 flex items-center gap-2">
        <Settings size={20} /> Custom Cursor Settings
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2 flex items-center gap-3">
          <label className="text-sm text-[#8a9a70]" id="cursor-enabled-label">
            Cursor Enabled
          </label>
          <button
            type="button"
            role="switch"
            aria-checked={draft.cursorEnabled}
            aria-labelledby="cursor-enabled-label"
            onClick={() => set('cursorEnabled', !draft.cursorEnabled)}
            className={`relative w-12 h-6 rounded-full transition-colors ${draft.cursorEnabled ? 'bg-[#94a348]' : 'bg-[#1a1e10]'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${draft.cursorEnabled ? 'translate-x-6' : ''}`} />
          </button>
        </div>
        <Slider label="Default Size" unit="px" min={4} max={30} value={draft.cursorSize} onChange={(v) => set('cursorSize', v)} />
        <Slider label="Hover Size" unit="px" min={15} max={80} value={draft.cursorHoverSize} onChange={(v) => set('cursorHoverSize', v)} />
        <Slider label="Lag / Smoothness" unit="%" min={5} max={50} value={draft.cursorLag} onChange={(v) => set('cursorLag', v)} hint="Lower = more lag, Higher = snappier" />
        <div className="flex gap-4">
          <ColorField label="Color on Light BG" value={draft.cursorColorLight} onChange={(v) => set('cursorColorLight', v)} />
          <ColorField label="Color on Dark BG" value={draft.cursorColorDark} onChange={(v) => set('cursorColorDark', v)} />
        </div>
      </div>

      <button type="button" onClick={() => onSave(title, draft, 'Admin: update title, particles and cursor')} disabled={busy} className={`${PRIMARY_BUTTON} mt-5`}>
        <Save size={16} /> Save Settings
      </button>
    </div>
  );
}
