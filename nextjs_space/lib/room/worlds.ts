// The places the walls can show, as they are right now: the four built-in
// ones, the ones you added, and one for each item that has its own
// background picture. Built from the config.

import { BUILTIN_WORLD_IDS, DEFAULT_IMAGE_SPEC, type ImageSpec, type RoomConfig } from './config';
import type { Resolver } from './assets';
import { ENVIRONMENTS } from './environments';

export interface WorldDef {
  id: string;
  label: string;
  /** How strongly the screens light the room. */
  light: number;
  followsClock: boolean;
  /** A drawing made in code, shown until the picture (if any) has loaded. */
  paint?: (ctx: CanvasRenderingContext2D) => void;
  /** The picture, with an address the browser can load. */
  image?: { spec: ImageSpec; url: string };
  /** A picture for the ceiling, with an address. Empty means "continue the walls upwards". */
  ceilingUrl: string;
}

export const ITEM_WORLD_PREFIX = 'item-';

export function itemWorldId(hotspotId: string) {
  return ITEM_WORLD_PREFIX + hotspotId;
}

export function buildWorlds(config: RoomConfig, resolve: Resolver): Record<string, WorldDef> {
  const worlds: Record<string, WorldDef> = {};

  for (const id of BUILTIN_WORLD_IDS) {
    const base = ENVIRONMENTS[id];
    const over = config.worlds.overrides[id] ?? {};
    const spec: ImageSpec | null = over.image ?? (base.image ? { ...DEFAULT_IMAGE_SPEC, src: base.image } : null);
    worlds[id] = {
      id,
      label: over.label || base.label,
      light: over.light ?? base.light,
      followsClock: over.followsClock ?? base.followsClock,
      paint: base.paint,
      image: spec ? { spec, url: resolve(spec.src) } : undefined,
      ceilingUrl: resolve(over.ceilingImage ?? ''),
    };
  }

  for (const w of config.worlds.custom) {
    worlds[w.id] = {
      id: w.id,
      label: w.label,
      light: w.light,
      followsClock: w.followsClock,
      image: { spec: w.image, url: resolve(w.image.src) },
      ceilingUrl: resolve(w.ceilingImage),
    };
  }

  for (const [hotspotId, h] of Object.entries(config.hotspots)) {
    if (!h.background?.src) continue;
    const id = itemWorldId(hotspotId);
    worlds[id] = {
      id,
      label: `Background for ${hotspotId}`,
      light: 3,
      followsClock: false,
      image: { spec: h.background, url: resolve(h.background.src) },
      ceilingUrl: '',
    };
  }

  return worlds;
}

/** The ids of the worlds you can choose from in the admin page. */
export function chooseableWorlds(config: RoomConfig): { id: string; label: string }[] {
  const list = BUILTIN_WORLD_IDS.map((id) => ({
    id: id as string,
    label: config.worlds.overrides[id]?.label || ENVIRONMENTS[id].label,
  }));
  for (const w of config.worlds.custom) list.push({ id: w.id, label: w.label });
  return list;
}
