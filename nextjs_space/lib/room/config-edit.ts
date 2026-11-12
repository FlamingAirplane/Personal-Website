// Small helpers the admin page uses to change one thing in a config.
// A patch value of `undefined` removes that setting (back to its default).

import {
  DEFAULT_EXTRA,
  type CardCfg,
  type ExtraCfg,
  type HotspotCfg,
  type ObjectCfg,
  type RoomConfig,
} from './config';

function applyPatch<T extends object>(base: T | undefined, patch: Partial<T>): T {
  const next = { ...(base ?? {}), ...patch } as Record<string, unknown>;
  for (const key of Object.keys(next)) if (next[key] === undefined) delete next[key];
  return next as T;
}

export function patchObject(c: RoomConfig, id: string, patch: Partial<ObjectCfg>): RoomConfig {
  return { ...c, objects: { ...c.objects, [id]: applyPatch(c.objects[id], patch) } };
}

export function resetObject(c: RoomConfig, id: string): RoomConfig {
  const objects = { ...c.objects };
  delete objects[id];
  const hotspots = { ...c.hotspots };
  delete hotspots[id];
  return { ...c, objects, hotspots };
}

export function patchHotspot(c: RoomConfig, id: string, patch: Partial<HotspotCfg>): RoomConfig {
  return { ...c, hotspots: { ...c.hotspots, [id]: applyPatch(c.hotspots[id], patch) } };
}

export function patchCard(c: RoomConfig, id: string, patch: Partial<CardCfg>): RoomConfig {
  const card = { title: '', text: '', image: '', link: '', linkLabel: 'Open', ...(c.hotspots[id]?.card ?? {}), ...patch };
  return patchHotspot(c, id, { card });
}

export function patchExtra(c: RoomConfig, id: string, patch: Partial<ExtraCfg>): RoomConfig {
  return { ...c, extras: c.extras.map((e) => (e.id === id ? { ...e, ...patch } : e)) };
}

export function removeExtra(c: RoomConfig, id: string): RoomConfig {
  const hotspots = { ...c.hotspots };
  delete hotspots[id];
  return { ...c, extras: c.extras.filter((e) => e.id !== id), hotspots };
}

export function newExtraId(c: RoomConfig): string {
  const used = new Set(c.extras.map((e) => e.id));
  for (let n = 1; ; n++) if (!used.has(`item-${n}`) && !used.has(`my-${n}`)) return `my-${n}`;
}

/** A new picture or model, placed somewhere sensible in front of where you start. */
export function addExtra(c: RoomConfig, kind: 'image' | 'model', src: string, label: string): { config: RoomConfig; id: string } {
  const id = newExtraId(c);
  const extra: ExtraCfg = {
    ...DEFAULT_EXTRA,
    id,
    kind,
    src,
    label,
    // Pictures hang at eye level on the north wall; models stand in the middle of the room.
    x: kind === 'image' ? 0 : c.player.startX,
    y: kind === 'image' ? 1.5 : 0,
    z: kind === 'image' ? -c.room.depth / 2 + 0.06 : c.player.startZ - 2,
    solid: kind === 'model',
  };
  return { config: { ...c, extras: [...c.extras, extra] }, id };
}
