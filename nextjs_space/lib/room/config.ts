// Every number, colour, word and file the room is made from, in one object.
//
// The published copy lives in public/room/room-config.json. The admin page
// (/room/admin/) edits a draft of it in the browser and exports a new copy.
// Anything missing from the file falls back to DEFAULT_CONFIG, and anything
// out of range is clamped, so a half-written file can never break the room.

import { PALETTE_HEX } from './palette';

/* --------------------------------- types --------------------------------- */

export const BUILTIN_WORLD_IDS = ['nebula', 'forest', 'sunset', 'city'] as const;
export type BuiltinWorldId = (typeof BUILTIN_WORLD_IDS)[number];

/** How a picture is laid onto the wall screens. */
export interface ImageSpec {
  /** A file reference (see assets.ts). Empty means "none". */
  src: string;
  /** How many times the picture repeats around the room. */
  repeat: number;
  /** "cover" crops to fit the wall band; "stretch" squashes the whole picture into it. */
  fit: 'cover' | 'stretch';
  /** Which part of a cropped picture stays in view, 0 (top) to 1 (bottom). */
  focusY: number;
}

export interface ModelCfg {
  /** A .glb file reference. */
  src: string;
  /** Scale the model to this height in metres. 0 keeps its own size. */
  fitHeight: number;
  /** Extra scale on top of fitHeight. */
  scale: number;
  x: number;
  y: number;
  z: number;
  /** Degrees. */
  rotY: number;
  /** Hide the built-in object so only the model shows. */
  hideBuiltIn: boolean;
}

/** Where and how a built-in object stands. All values are changes from its default. */
export interface ObjectCfg {
  visible: boolean;
  /** Metres to move it east (+) or west (-). */
  x: number;
  /** Metres to raise it. */
  y: number;
  /** Metres to move it south (+) or north (-). */
  z: number;
  /** Degrees to turn it. */
  rotY: number;
  scale: number;
  model: ModelCfg | null;
}

export interface CardCfg {
  title: string;
  text: string;
  /** A file reference. */
  image: string;
  link: string;
  linkLabel: string;
}

/** What happens when you walk up to an item and look at it. */
export interface HotspotCfg {
  /** Can it be clicked at all? */
  interactive: boolean;
  /** The name shown on hover. Empty keeps the built-in one. */
  label: string;
  /** The line of text shown on arrival. Empty keeps the built-in one. */
  line: string;
  /** The place the walls switch to. Empty keeps the built-in one. */
  world: string;
  /** Your own background picture for the walls while you look at this item. */
  background: ImageSpec | null;
  /** A card with a title, text, picture and link. */
  card: CardCfg | null;
  /** How far away you stand, in metres. 0 picks a distance to suit its size. */
  standDistance: number;
}

/** An object you add yourself: a picture or a 3D model. */
export interface ExtraCfg {
  id: string;
  label: string;
  kind: 'image' | 'model';
  /** A file reference. */
  src: string;
  /** Pictures: how wide, in metres. */
  width: number;
  /** Models: scale to this height in metres. 0 keeps the model's own size. */
  fitHeight: number;
  scale: number;
  /** Room coordinates in metres: x east/west, y up, z south/north. 0, 0, 0 is the middle of the floor. */
  x: number;
  y: number;
  z: number;
  rotY: number;
  /** Do you walk around it? */
  solid: boolean;
  visible: boolean;
}

export interface WorldOverride {
  label?: string;
  light?: number;
  followsClock?: boolean;
  /** Replaces the built-in picture. */
  image?: ImageSpec;
  ceilingImage?: string;
}

export interface CustomWorld {
  id: string;
  label: string;
  light: number;
  followsClock: boolean;
  image: ImageSpec;
  ceilingImage: string;
}

export interface RoomConfig {
  version: 1;
  room: {
    width: number;
    depth: number;
    height: number;
    eyeHeight: number;
    wallMargin: number;
    bodyRadius: number;
  };
  player: {
    startX: number;
    startZ: number;
    /** Degrees. */
    startYaw: number;
    walkSpeed: number;
    turnSpeed: number;
    lookSpeed: number;
    fov: number;
    fovPortrait: number;
    /** Degrees. */
    pitchLimit: number;
    bob: number;
    glide: boolean;
  };
  look: {
    shortSide: number;
    longSideMax: number;
    ditherStrength: number;
    idleFps: number;
    palette: string[];
  };
  light: {
    startLit: 'remember' | 'dark' | 'lit';
    ambient: number;
    fogDark: number;
    fogColor: string;
    wallLight: number;
    accentDark: number;
    accentLit: number;
  };
  surfaces: {
    floorColor: string;
    floorSeams: boolean;
    ceilingMode: 'screen' | 'solid';
    ceilingColor: string;
    bezelColor: string;
  };
  walls: {
    panel: number;
    seams: number;
    grid: number;
    glitchSeconds: number;
    flicker: number;
    deadPanel: boolean;
    rollBand: boolean;
    saturation: number;
    brightness: number;
    timeOfDay: 'real' | 'fixed' | 'off';
    fixedHour: number;
  };
  worlds: {
    defaultWorld: string;
    darkWorld: string;
    overrides: Record<string, WorldOverride>;
    custom: CustomWorld[];
  };
  objects: Record<string, Partial<ObjectCfg>>;
  hotspots: Record<string, Partial<HotspotCfg>>;
  extras: ExtraCfg[];
  text: {
    hintMouse: string;
    hintTouch: string;
    loading: string;
    lightsOn: string;
    lightsOff: string;
    standardSite: string;
  };
}

/* -------------------------------- defaults -------------------------------- */

export const DEFAULT_IMAGE_SPEC: ImageSpec = { src: '', repeat: 1, fit: 'cover', focusY: 0.5 };

export const DEFAULT_MODEL: ModelCfg = {
  src: '',
  fitHeight: 0,
  scale: 1,
  x: 0,
  y: 0,
  z: 0,
  rotY: 0,
  hideBuiltIn: true,
};

export const DEFAULT_OBJECT: ObjectCfg = { visible: true, x: 0, y: 0, z: 0, rotY: 0, scale: 1, model: null };

export const DEFAULT_CARD: CardCfg = { title: '', text: '', image: '', link: '', linkLabel: 'Open' };

export const DEFAULT_HOTSPOT: HotspotCfg = {
  interactive: true,
  label: '',
  line: '',
  world: '',
  background: null,
  card: null,
  standDistance: 0,
};

export const DEFAULT_EXTRA: Omit<ExtraCfg, 'id' | 'kind' | 'src'> = {
  label: 'New item',
  width: 1,
  fitHeight: 1,
  scale: 1,
  x: 0,
  y: 0,
  z: 0,
  rotY: 0,
  solid: false,
  visible: true,
};

export const DEFAULT_CONFIG: RoomConfig = {
  version: 1,
  room: { width: 7, depth: 6, height: 3, eyeHeight: 1.6, wallMargin: 0.4, bodyRadius: 0.3 },
  player: {
    startX: 0,
    startZ: 0.9,
    startYaw: 0,
    walkSpeed: 2.6,
    turnSpeed: 1.9,
    lookSpeed: 0.0045,
    fov: 62,
    fovPortrait: 78,
    pitchLimit: 80,
    bob: 0.022,
    glide: true,
  },
  look: { shortSide: 200, longSideMax: 720, ditherStrength: 2, idleFps: 20, palette: [...PALETTE_HEX] },
  light: {
    startLit: 'remember',
    ambient: 0.32,
    fogDark: 0.06,
    fogColor: '#0b0d24',
    wallLight: 1,
    accentDark: 1,
    accentLit: 1,
  },
  surfaces: {
    floorColor: '#8a5636',
    floorSeams: true,
    ceilingMode: 'screen',
    ceilingColor: '#3a4048',
    bezelColor: '#0b0d18',
  },
  walls: {
    panel: 0.5,
    seams: 0.8,
    grid: 0.55,
    glitchSeconds: 0.9,
    flicker: 1,
    deadPanel: true,
    rollBand: true,
    saturation: 1.5,
    brightness: 1.2,
    timeOfDay: 'real',
    fixedHour: 12,
  },
  worlds: { defaultWorld: 'forest', darkWorld: 'nebula', overrides: {}, custom: [] },
  objects: {},
  hotspots: {},
  extras: [],
  text: {
    hintMouse: 'Click to walk. Drag to look around.',
    hintTouch: 'Tap to walk. Drag to look around.',
    loading: 'Loading the room…',
    lightsOn: 'Lights on.',
    lightsOff: 'Lights off.',
    standardSite: 'Standard site',
  },
};

/** Limits for the admin sliders, also used to clamp whatever a file contains. */
export const LIMITS = {
  width: [4, 16],
  depth: [4, 16],
  height: [2.2, 6],
} as const;

/* ------------------------------ cleaning input ----------------------------- */

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const num = (v: unknown, d: number, min: number, max: number) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : d;
const str = (v: unknown, d: string, max = 4000) => (typeof v === 'string' ? v.slice(0, max) : d);
const bool = (v: unknown, d: boolean) => (typeof v === 'boolean' ? v : d);
const color = (v: unknown, d: string) => (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : d);
const pick = <T extends string>(v: unknown, options: readonly T[], d: T): T =>
  typeof v === 'string' && (options as readonly string[]).includes(v) ? (v as T) : d;
const ref = (v: unknown) => (typeof v === 'string' && v.length < 600 ? v.trim() : '');
const id = (v: unknown) => (typeof v === 'string' && /^[a-z0-9][a-z0-9_-]{0,39}$/i.test(v) ? v : null);

function cleanImage(raw: unknown): ImageSpec | null {
  if (!isObj(raw)) return null;
  const src = ref(raw.src);
  if (!src) return null;
  return {
    src,
    repeat: Math.round(num(raw.repeat, 1, 1, 12)),
    fit: pick(raw.fit, ['cover', 'stretch'] as const, 'cover'),
    focusY: num(raw.focusY, 0.5, 0, 1),
  };
}

function cleanModel(raw: unknown): ModelCfg | null {
  if (!isObj(raw)) return null;
  const src = ref(raw.src);
  if (!src) return null;
  return {
    src,
    fitHeight: num(raw.fitHeight, 0, 0, 12),
    scale: num(raw.scale, 1, 0.01, 50),
    x: num(raw.x, 0, -20, 20),
    y: num(raw.y, 0, -20, 20),
    z: num(raw.z, 0, -20, 20),
    rotY: num(raw.rotY, 0, -360, 360),
    hideBuiltIn: bool(raw.hideBuiltIn, true),
  };
}

function cleanCard(raw: unknown): CardCfg | null {
  if (!isObj(raw)) return null;
  const card: CardCfg = {
    title: str(raw.title, '', 200),
    text: str(raw.text, '', 4000),
    image: ref(raw.image),
    link: str(raw.link, '', 600),
    linkLabel: str(raw.linkLabel, 'Open', 60),
  };
  return card.title || card.text || card.image || card.link ? card : null;
}

function cleanObject(raw: unknown): Partial<ObjectCfg> {
  const out: Partial<ObjectCfg> = {};
  if (!isObj(raw)) return out;
  if (typeof raw.visible === 'boolean') out.visible = raw.visible;
  for (const key of ['x', 'y', 'z'] as const) {
    if (typeof raw[key] === 'number') out[key] = num(raw[key], 0, -20, 20);
  }
  if (typeof raw.rotY === 'number') out.rotY = num(raw.rotY, 0, -360, 360);
  if (typeof raw.scale === 'number') out.scale = num(raw.scale, 1, 0.05, 20);
  const model = cleanModel(raw.model);
  if (model) out.model = model;
  return out;
}

function cleanHotspot(raw: unknown): Partial<HotspotCfg> {
  const out: Partial<HotspotCfg> = {};
  if (!isObj(raw)) return out;
  if (typeof raw.interactive === 'boolean') out.interactive = raw.interactive;
  if (typeof raw.label === 'string') out.label = str(raw.label, '', 120);
  if (typeof raw.line === 'string') out.line = str(raw.line, '', 600);
  if (typeof raw.world === 'string') out.world = str(raw.world, '', 60);
  if (typeof raw.standDistance === 'number') out.standDistance = num(raw.standDistance, 0, 0, 8);
  const background = cleanImage(raw.background);
  if (background) out.background = background;
  const card = cleanCard(raw.card);
  if (card) out.card = card;
  return out;
}

function cleanExtra(raw: unknown): ExtraCfg | null {
  if (!isObj(raw)) return null;
  const extraId = id(raw.id);
  const src = ref(raw.src);
  if (!extraId || !src) return null;
  const d = DEFAULT_EXTRA;
  return {
    id: extraId,
    label: str(raw.label, d.label, 120),
    kind: pick(raw.kind, ['image', 'model'] as const, 'image'),
    src,
    width: num(raw.width, d.width, 0.05, 20),
    fitHeight: num(raw.fitHeight, d.fitHeight, 0, 12),
    scale: num(raw.scale, d.scale, 0.05, 20),
    x: num(raw.x, d.x, -20, 20),
    y: num(raw.y, d.y, -5, 10),
    z: num(raw.z, d.z, -20, 20),
    rotY: num(raw.rotY, d.rotY, -360, 360),
    solid: bool(raw.solid, d.solid),
    visible: bool(raw.visible, d.visible),
  };
}

function cleanWorldOverride(raw: unknown): WorldOverride {
  const out: WorldOverride = {};
  if (!isObj(raw)) return out;
  if (typeof raw.label === 'string') out.label = str(raw.label, '', 80);
  if (typeof raw.light === 'number') out.light = num(raw.light, 1, 0, 12);
  if (typeof raw.followsClock === 'boolean') out.followsClock = raw.followsClock;
  const image = cleanImage(raw.image);
  if (image) out.image = image;
  if (typeof raw.ceilingImage === 'string') out.ceilingImage = ref(raw.ceilingImage);
  return out;
}

function cleanCustomWorld(raw: unknown): CustomWorld | null {
  if (!isObj(raw)) return null;
  const worldId = id(raw.id);
  const image = cleanImage(raw.image);
  if (!worldId || !image) return null;
  return {
    id: worldId,
    label: str(raw.label, worldId, 80),
    light: num(raw.light, 3, 0, 12),
    followsClock: bool(raw.followsClock, false),
    image,
    ceilingImage: ref(raw.ceilingImage),
  };
}

/** Turn anything (a parsed file, an old draft) into a complete, valid config. */
export function resolveConfig(raw: unknown): RoomConfig {
  const d = DEFAULT_CONFIG;
  const r = isObj(raw) ? raw : {};
  const sec = (key: string) => (isObj(r[key]) ? (r[key] as Record<string, unknown>) : {});

  const room = sec('room');
  const player = sec('player');
  const look = sec('look');
  const light = sec('light');
  const surfaces = sec('surfaces');
  const walls = sec('walls');
  const worlds = sec('worlds');
  const text = sec('text');

  const palette = Array.isArray(look.palette)
    ? look.palette.filter((c): c is string => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c)).map((c) => c.toLowerCase())
    : [];

  const objects: RoomConfig['objects'] = {};
  if (isObj(r.objects)) {
    for (const [key, value] of Object.entries(r.objects)) {
      if (id(key)) objects[key] = cleanObject(value);
    }
  }
  const hotspots: RoomConfig['hotspots'] = {};
  if (isObj(r.hotspots)) {
    for (const [key, value] of Object.entries(r.hotspots)) {
      if (id(key)) hotspots[key] = cleanHotspot(value);
    }
  }
  const overrides: RoomConfig['worlds']['overrides'] = {};
  if (isObj(worlds.overrides)) {
    for (const [key, value] of Object.entries(worlds.overrides)) {
      if (id(key)) overrides[key] = cleanWorldOverride(value);
    }
  }
  const custom = Array.isArray(worlds.custom)
    ? worlds.custom.map(cleanCustomWorld).filter((w): w is CustomWorld => w !== null).slice(0, 30)
    : [];
  const extras = Array.isArray(r.extras)
    ? r.extras.map(cleanExtra).filter((e): e is ExtraCfg => e !== null).slice(0, 80)
    : [];

  return {
    version: 1,
    room: {
      width: num(room.width, d.room.width, ...LIMITS.width),
      depth: num(room.depth, d.room.depth, ...LIMITS.depth),
      height: num(room.height, d.room.height, ...LIMITS.height),
      eyeHeight: num(room.eyeHeight, d.room.eyeHeight, 0.5, 2.6),
      wallMargin: num(room.wallMargin, d.room.wallMargin, 0.1, 1.5),
      bodyRadius: num(room.bodyRadius, d.room.bodyRadius, 0.1, 0.8),
    },
    player: {
      startX: num(player.startX, d.player.startX, -8, 8),
      startZ: num(player.startZ, d.player.startZ, -8, 8),
      startYaw: num(player.startYaw, d.player.startYaw, -360, 360),
      walkSpeed: num(player.walkSpeed, d.player.walkSpeed, 0.5, 8),
      turnSpeed: num(player.turnSpeed, d.player.turnSpeed, 0.3, 6),
      lookSpeed: num(player.lookSpeed, d.player.lookSpeed, 0.001, 0.02),
      fov: num(player.fov, d.player.fov, 30, 110),
      fovPortrait: num(player.fovPortrait, d.player.fovPortrait, 30, 120),
      pitchLimit: num(player.pitchLimit, d.player.pitchLimit, 20, 89),
      bob: num(player.bob, d.player.bob, 0, 0.15),
      glide: bool(player.glide, d.player.glide),
    },
    look: {
      shortSide: Math.round(num(look.shortSide, d.look.shortSide, 60, 540)),
      longSideMax: Math.round(num(look.longSideMax, d.look.longSideMax, 120, 1600)),
      ditherStrength: num(look.ditherStrength, d.look.ditherStrength, 0, 12),
      idleFps: Math.round(num(look.idleFps, d.look.idleFps, 5, 60)),
      palette: palette.length >= 2 ? palette.slice(0, 64) : [...d.look.palette],
    },
    light: {
      startLit: pick(light.startLit, ['remember', 'dark', 'lit'] as const, d.light.startLit),
      ambient: num(light.ambient, d.light.ambient, 0, 3),
      fogDark: num(light.fogDark, d.light.fogDark, 0, 0.4),
      fogColor: color(light.fogColor, d.light.fogColor),
      wallLight: num(light.wallLight, d.light.wallLight, 0, 4),
      accentDark: num(light.accentDark, d.light.accentDark, 0, 4),
      accentLit: num(light.accentLit, d.light.accentLit, 0, 4),
    },
    surfaces: {
      floorColor: color(surfaces.floorColor, d.surfaces.floorColor),
      floorSeams: bool(surfaces.floorSeams, d.surfaces.floorSeams),
      ceilingMode: pick(surfaces.ceilingMode, ['screen', 'solid'] as const, d.surfaces.ceilingMode),
      ceilingColor: color(surfaces.ceilingColor, d.surfaces.ceilingColor),
      bezelColor: color(surfaces.bezelColor, d.surfaces.bezelColor),
    },
    walls: {
      panel: num(walls.panel, d.walls.panel, 0.2, 2),
      seams: num(walls.seams, d.walls.seams, 0, 1),
      grid: num(walls.grid, d.walls.grid, 0, 1),
      glitchSeconds: num(walls.glitchSeconds, d.walls.glitchSeconds, 0.1, 4),
      flicker: num(walls.flicker, d.walls.flicker, 0, 10),
      deadPanel: bool(walls.deadPanel, d.walls.deadPanel),
      rollBand: bool(walls.rollBand, d.walls.rollBand),
      saturation: num(walls.saturation, d.walls.saturation, 0, 3),
      brightness: num(walls.brightness, d.walls.brightness, 0.2, 3),
      timeOfDay: pick(walls.timeOfDay, ['real', 'fixed', 'off'] as const, d.walls.timeOfDay),
      fixedHour: num(walls.fixedHour, d.walls.fixedHour, 0, 24),
    },
    worlds: {
      defaultWorld: str(worlds.defaultWorld, d.worlds.defaultWorld, 60),
      darkWorld: str(worlds.darkWorld, d.worlds.darkWorld, 60),
      overrides,
      custom,
    },
    objects,
    hotspots,
    extras,
    text: {
      hintMouse: str(text.hintMouse, d.text.hintMouse, 200),
      hintTouch: str(text.hintTouch, d.text.hintTouch, 200),
      loading: str(text.loading, d.text.loading, 200),
      lightsOn: str(text.lightsOn, d.text.lightsOn, 200),
      lightsOff: str(text.lightsOff, d.text.lightsOff, 200),
      standardSite: str(text.standardSite, d.text.standardSite, 60),
    },
  };
}

/* --------------------------- reading and editing --------------------------- */

/** A copy of the config with one value changed, by dotted path ("walls.panel"). */
export function setAt(config: RoomConfig, path: string, value: unknown): RoomConfig {
  const next = structuredClone(config) as unknown as Record<string, unknown>;
  const keys = path.split('.');
  let node = next;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!isObj(node[keys[i]])) node[keys[i]] = {};
    node = node[keys[i]] as Record<string, unknown>;
  }
  const last = keys[keys.length - 1];
  if (value === undefined) delete node[last];
  else node[last] = value;
  return next as unknown as RoomConfig;
}

export function getAt(config: RoomConfig, path: string): unknown {
  let node: unknown = config;
  for (const key of path.split('.')) {
    if (!isObj(node)) return undefined;
    node = node[key];
  }
  return node;
}

/** The full settings of a built-in object, defaults filled in. */
export function effectiveObject(config: RoomConfig, objectId: string): ObjectCfg {
  return { ...DEFAULT_OBJECT, ...(config.objects[objectId] ?? {}) };
}

export function effectiveHotspot(config: RoomConfig, objectId: string): HotspotCfg {
  return { ...DEFAULT_HOTSPOT, ...(config.hotspots[objectId] ?? {}) };
}

/** Every file reference used anywhere in the config. */
export function collectRefs(config: RoomConfig): string[] {
  const found = new Set<string>();
  const walk = (node: unknown, key?: string) => {
    if (typeof node === 'string') {
      if (key && ['src', 'image', 'ceilingImage'].includes(key) && node) found.add(node);
    } else if (Array.isArray(node)) {
      node.forEach((n) => walk(n, key));
    } else if (isObj(node)) {
      for (const [k, v] of Object.entries(node)) walk(v, k);
    }
  };
  walk(config);
  return [...found];
}

/** A copy of the config with every file reference passed through `fn`. */
export function mapRefs(config: RoomConfig, fn: (ref: string) => string): RoomConfig {
  const walk = (node: unknown, key?: string): unknown => {
    if (typeof node === 'string') {
      return key && ['src', 'image', 'ceilingImage'].includes(key) && node ? fn(node) : node;
    }
    if (Array.isArray(node)) return node.map((n) => walk(n, key));
    if (isObj(node)) return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, walk(v, k)]));
    return node;
  };
  return walk(config) as RoomConfig;
}
