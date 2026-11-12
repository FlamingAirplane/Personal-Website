'use client';

import { useState, type ReactNode } from 'react';
import { Box, Eye, RotateCcw, Save } from 'lucide-react';
import { withRoomDefaults, DEFAULT_ROOM_SETTINGS, type HotspotOverride, type RoomSettings } from '@/lib/room/room-defaults';
import { DEFAULT_HOTSPOTS } from '@/lib/room/room-settings';
import type { PanelId } from '@/lib/room/room-data';
import type { WorldId } from '@/lib/room/environments';
import { INPUT, PRIMARY_BUTTON, Slider } from './fields';

const WORLDS: { id: WorldId; label: string }[] = [
  { id: 'nebula', label: 'Nebula' },
  { id: 'forest', label: 'Forest' },
  { id: 'sunset', label: 'Sunset' },
  { id: 'city', label: 'City at night' },
];

const PANELS: { id: PanelId | 'none'; label: string }[] = [
  { id: 'games', label: 'Games' },
  { id: 'playable', label: 'Play now' },
  { id: 'sound', label: 'Sound' },
  { id: 'work', label: 'Work' },
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Skills' },
  { id: 'none', label: 'Nothing (just say the line)' },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <h3 className="text-base font-bold text-[#94a348] mt-8 mb-4 first:mt-0">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </>
  );
}

function Toggle({ label, value, onChange, hint }: { label: string; value: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <div className="md:col-span-2">
      <div className="flex items-center gap-3">
        <span className="text-sm text-[#8a9a70]">{label}</span>
        <button
          type="button"
          role="switch"
          aria-checked={value}
          aria-label={label}
          onClick={() => onChange(!value)}
          className={`relative w-12 h-6 rounded-full transition-colors ${value ? 'bg-[#94a348]' : 'bg-[#1a1e10]'}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${value ? 'translate-x-6' : ''}`} />
        </button>
      </div>
      {hint && <p className="text-xs text-[#8a9a70]/60 mt-1">{hint}</p>}
    </div>
  );
}

function Color({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm text-[#8a9a70] mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-10 h-10 rounded cursor-pointer border border-[#2a4a58] bg-transparent" />
        <span className="text-sm text-[#c8d4a8] font-mono">{value}</span>
      </div>
    </div>
  );
}

function WorldSelect({ label, value, onChange }: { label: string; value: WorldId; onChange: (v: WorldId) => void }) {
  return (
    <div>
      <label className="block text-sm text-[#8a9a70] mb-1">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value as WorldId)} className={INPUT}>
        {WORLDS.map((w) => (
          <option key={w.id} value={w.id}>
            {w.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Everything about the 3D room that can be adjusted without editing code. */
export function RoomSettingsPanel({
  settings,
  busy,
  onSave,
  onPreview,
}: {
  settings: RoomSettings;
  busy: boolean;
  onSave: (settings: RoomSettings, message: string) => void;
  onPreview: () => void;
}) {
  const [draft, setDraft] = useState(settings);
  const set = <K extends keyof RoomSettings>(key: K, value: RoomSettings[K]) => setDraft({ ...draft, [key]: value });
  const setOverride = (id: string, patch: HotspotOverride) =>
    setDraft({ ...draft, hotspots: { ...draft.hotspots, [id]: { ...draft.hotspots[id], ...patch } } });

  return (
    <div className="bg-[#1a2e38] rounded-xl p-6 border border-[#2a4a58]">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-bold text-[#94a348] flex items-center gap-2">
          <Box size={20} /> Room Settings
        </h2>
        <p className="text-xs text-[#8a9a70]">
          Save adds these to your draft. Preview Room shows the draft once saved.
        </p>
      </div>

      <Section title="Walls and ceiling">
        <Toggle label="Project the scenery on the ceiling" value={draft.ceilingProjection} onChange={(v) => set('ceilingProjection', v)} hint="Off leaves a plain ceiling in the ceiling colour." />
        <WorldSelect label="Place shown with the lights off" value={draft.darkWorld} onChange={(v) => set('darkWorld', v)} />
        <WorldSelect label="Place shown first with the lights on" value={draft.defaultWorld} onChange={(v) => set('defaultWorld', v)} />
        <Slider label="Change Time" unit=" s" min={0.2} max={3} step={0.1} value={draft.wallSwitchSeconds} onChange={(v) => set('wallSwitchSeconds', v)} hint="How long the walls take to switch places." />
        <Slider label="Panel Size" unit=" m" min={0.25} max={1} step={0.05} value={draft.panelSize} onChange={(v) => set('panelSize', v)} hint="The seams and pixel grid on the walls." />
      </Section>

      <Section title="Light">
        {WORLDS.map((w) => (
          <Slider
            key={w.id}
            label={`${w.label} Brightness`}
            min={0}
            max={8}
            step={0.1}
            value={draft.worldLight[w.id]}
            onChange={(v) => set('worldLight', { ...draft.worldLight, [w.id]: v })}
            hint="How strongly this place lights the room."
          />
        ))}
        <Slider label="Ambient Light" min={0} max={1.5} step={0.02} value={draft.ambientLight} onChange={(v) => set('ambientLight', v)} />
        <Slider label="Dark Fog" min={0} max={0.2} step={0.005} value={draft.darkFog} onChange={(v) => set('darkFog', v)} hint="Thickness with the lights off." />
        <Toggle label="Lights on at the first visit" value={draft.startLit} onChange={(v) => set('startLit', v)} hint="After that, the room remembers the switch for each visitor." />
      </Section>

      <Section title="Colours">
        <Color label="Floor" value={draft.colorFloor} onChange={(v) => set('colorFloor', v)} />
        <Color label="Ceiling" value={draft.colorCeiling} onChange={(v) => set('colorCeiling', v)} />
        <Color label="Wood (desk)" value={draft.colorWood} onChange={(v) => set('colorWood', v)} />
        <Color label="Trim and legs" value={draft.colorTrim} onChange={(v) => set('colorTrim', v)} />
        <Color label="Screen bezels" value={draft.colorBezel} onChange={(v) => set('colorBezel', v)} />
      </Section>

      <Section title="Moving around">
        <Slider label="Walk Speed" unit=" m/s" min={0.5} max={6} step={0.1} value={draft.walkSpeed} onChange={(v) => set('walkSpeed', v)} />
        <Slider label="Key Turn Speed" unit=" rad/s" min={0.5} max={4} step={0.1} value={draft.turnSpeed} onChange={(v) => set('turnSpeed', v)} />
        <Slider label="Mouse Look Speed" min={1} max={12} step={0.5} value={draft.lookSensitivity} onChange={(v) => set('lookSensitivity', v)} hint="Higher turns the view faster when you drag." />
        <Slider label="Look Up/Down Limit" unit="°" min={20} max={85} value={draft.lookLimit} onChange={(v) => set('lookLimit', v)} />
        <Slider label="Eye Height" unit=" m" min={1} max={2.2} step={0.05} value={draft.eyeHeight} onChange={(v) => set('eyeHeight', v)} />
        <Slider label="Distance Kept From Walls" unit=" m" min={0.1} max={1} step={0.05} value={draft.wallMargin} onChange={(v) => set('wallMargin', v)} />
        <Slider label="Body Radius" unit=" m" min={0.1} max={0.6} step={0.05} value={draft.bodyRadius} onChange={(v) => set('bodyRadius', v)} hint="How close you get to furniture. Too big and some objects cannot be reached." />
        <Slider label="Field of View (wide screens)" unit="°" min={40} max={100} value={draft.fovLandscape} onChange={(v) => set('fovLandscape', v)} />
        <Slider label="Field of View (phones)" unit="°" min={40} max={110} value={draft.fovPortrait} onChange={(v) => set('fovPortrait', v)} />
      </Section>

      <Section title="Where you start">
        <Slider label="Start X (west to east)" unit=" m" min={-3} max={3} step={0.1} value={draft.startX} onChange={(v) => set('startX', v)} />
        <Slider label="Start Z (north to south)" unit=" m" min={-2.5} max={2.5} step={0.1} value={draft.startZ} onChange={(v) => set('startZ', v)} hint="Keep clear of furniture." />
        <Slider label="Start Facing" unit="°" min={-180} max={180} step={5} value={draft.startYaw} onChange={(v) => set('startYaw', v)} hint="0 faces north; positive turns left." />
        <Slider label="Start Tilt" unit="°" min={-45} max={45} step={5} value={draft.startPitch} onChange={(v) => set('startPitch', v)} />
      </Section>

      <Section title="Look and speed">
        <Slider label="Pixel Resolution" unit=" px" min={80} max={480} step={10} value={draft.resolution} onChange={(v) => set('resolution', v)} hint="Pixels along the screen's short side. Lower is chunkier." />
        <Slider label="Longest Side Limit" unit=" px" min={200} max={1600} step={20} value={draft.resolutionLongSide} onChange={(v) => set('resolutionLongSide', v)} />
        <Slider label="Dither Strength" min={0} max={8} step={0.5} value={draft.dither} onChange={(v) => set('dither', v)} hint="The cross-hatch in the bit-crushed look." />
        <Slider label="Idle Frame Gap" unit=" ms" min={16} max={200} step={2} value={draft.idleFrameMs} onChange={(v) => set('idleFrameMs', v)} hint="Time between frames while nothing moves. Higher saves battery." />
        <Slider label="Message Time" unit=" s" min={1} max={12} step={0.5} value={draft.messageSeconds} onChange={(v) => set('messageSeconds', v)} hint="How long a spoken line stays on screen." />
      </Section>

      <h3 className="text-base font-bold text-[#94a348] mt-8 mb-2">Objects</h3>
      <p className="text-xs text-[#8a9a70]/70 mb-4">Leave a box empty to keep the original.</p>
      <div className="space-y-4">
        {DEFAULT_HOTSPOTS.map((spot) => {
          const over = draft.hotspots[spot.id] ?? {};
          const canSpeak = spot.action.type === 'inspect';
          const isAction = spot.action.type !== 'inspect';
          return (
            <div key={spot.id} className="rounded-lg bg-[#0d0f06]/50 border border-[#2a4a58] p-4">
              <p className="text-sm font-semibold text-[#c8d4a8] mb-3">{spot.label}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#8a9a70] mb-1">Name (shown on hover)</label>
                  <input className={INPUT} value={over.label ?? ''} placeholder={spot.label} onChange={(e) => setOverride(spot.id, { label: e.target.value })} />
                </div>
                {canSpeak && (
                  <div>
                    <label className="block text-xs text-[#8a9a70] mb-1">Line said when used without a panel</label>
                    <input
                      className={INPUT}
                      value={over.line ?? ''}
                      placeholder={spot.action.type === 'inspect' ? spot.action.line : ''}
                      onChange={(e) => setOverride(spot.id, { line: e.target.value })}
                    />
                  </div>
                )}
                {!isAction && (
                  <>
                    <div>
                      <label className="block text-xs text-[#8a9a70] mb-1">Scenery shown on the walls</label>
                      <select className={INPUT} value={over.world ?? ''} onChange={(e) => setOverride(spot.id, { world: e.target.value as WorldId | '' })}>
                        <option value="">Original ({WORLDS.find((w) => w.id === spot.world)?.label ?? 'none'})</option>
                        {WORLDS.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-[#8a9a70] mb-1">Content panel it opens</label>
                      <select className={INPUT} value={over.panel ?? ''} onChange={(e) => setOverride(spot.id, { panel: e.target.value as PanelId | 'none' | '' })}>
                        <option value="">Original ({PANELS.find((p) => p.id === spot.panel)?.label ?? 'none'})</option>
                        {PANELS.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={() => onSave(draft, 'Admin: update room settings')} disabled={busy} className={PRIMARY_BUTTON}>
          <Save size={16} /> Save Room Settings
        </button>
        <button type="button" onClick={onPreview} className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold bg-[#1a1e10] text-[#c8d4a8] hover:bg-[#1a1e10]/80">
          <Eye size={16} /> Preview Room
        </button>
        <button
          type="button"
          onClick={() => setDraft(withRoomDefaults(DEFAULT_ROOM_SETTINGS))}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold bg-[#1a1e10] text-[#c8d4a8] hover:bg-[#1a1e10]/80"
        >
          <RotateCcw size={16} /> Reset Form to Original
        </button>
      </div>
    </div>
  );
}
