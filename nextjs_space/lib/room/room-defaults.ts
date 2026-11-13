// The room's adjustable settings and their starting values. The admin page's
// Room tab edits these (they are saved in content/site-content.json), and
// lib/room/room-settings.ts applies them to the room. This file is plain data
// so the rest of the site can import it without pulling in the 3D code.

import type { PanelId } from './room-data';
import type { WorldId } from './environments';

/** A video the TV offers: a link (YouTube, Vimeo, any page) or a video file. */
export interface TvVideo {
  title: string;
  url: string;
}

export type HotspotOverride = {
  label?: string;
  /** What is said when an object with no panel is used. */
  line?: string;
  /** '' keeps the default place on the walls. */
  world?: WorldId | '';
  /** '' keeps the default; 'none' opens nothing. */
  panel?: PanelId | 'none' | '';
};

export interface RoomSettings {
  /** Show the projected scenery on the ceiling too. */
  ceilingProjection: boolean;

  /** Metres. */
  eyeHeight: number;
  wallMargin: number;
  bodyRadius: number;
  /** Metres per second. */
  walkSpeed: number;
  /** Radians per second. */
  turnSpeed: number;
  /** Mouse-drag look speed, in thousandths of a radian per pixel. */
  lookSensitivity: number;
  /** Degrees. */
  lookLimit: number;
  fovLandscape: number;
  fovPortrait: number;

  /** Where you start (metres, degrees). */
  startX: number;
  startZ: number;
  startYaw: number;
  startPitch: number;
  /** Lights on at the first visit. Later visits remember the switch. */
  startLit: boolean;

  /** Pixels along the short side of the screen: lower is chunkier. */
  resolution: number;
  resolutionLongSide: number;
  /** Dither strength of the palette crush. */
  dither: number;
  /** Milliseconds between frames while nothing moves. */
  idleFrameMs: number;
  /** How long a spoken line stays up. */
  messageSeconds: number;

  /** Seconds the walls take to change place. */
  wallSwitchSeconds: number;
  /** Metres: the size of each wall panel (seams and pixel grid). */
  panelSize: number;
  darkWorld: WorldId;
  defaultWorld: WorldId;
  /** How strongly each place lights the room. */
  worldLight: Record<WorldId, number>;
  /** The HDRI (.hdr panorama) outside each place. Empty keeps the original. */
  worldHdri: Record<WorldId, string>;
  /** How bright each HDRI is shown. */
  worldExposure: Record<WorldId, number>;
  /** Degrees to turn each HDRI, to choose what faces which wall. */
  worldYaw: Record<WorldId, number>;
  /** Colour intensity of the scenery on the walls. */
  wallSaturation: number;
  wallBrightness: number;
  /** 0 hides the panel seams and the pixel grid. */
  seamStrength: number;
  gridStrength: number;
  /** Chance per half-second that a panel drops out. */
  dropoutRate: number;
  deadPanel: boolean;
  /** How hard the walls tear into static when the place changes. */
  glitchStrength: number;
  rollBand: number;
  ambientLight: number;
  ambientColor: string;
  /** Fog thickness with the lights off. */
  darkFog: number;
  fogColor: string;
  /** Glow of the computer, arcade machine and the door crack: lights on, lights off. */
  computerLightOn: number;
  computerLightOff: number;
  arcadeLightOn: number;
  arcadeLightOff: number;
  doorLightOff: number;
  /** The big TV on the west wall. Metres. */
  tvWidth: number;
  tvHeight: number;
  /** How much the TV lights the room while on. */
  tvLight: number;
  /** Shown on the TV while it is on with nothing playing. */
  tvStandbyText: string;
  /** 0 to 1. */
  tvVolume: number;
  /** Also list the projects' YouTube videos on the TV. */
  tvIncludeProjects: boolean;
  tvVideos: TvVideo[];
  /** Metres of camera bob while walking. */
  walkBob: number;
  /** How far you can see, in metres. */
  viewDistance: number;

  hintMouse: string;
  hintTouch: string;
  lightsOnLine: string;
  lightsOffLine: string;

  /** Swap any colour used in the room: original hex (lower case) to new hex. */
  colorOverrides: Record<string, string>;

  colorFloor: string;
  colorCeiling: string;
  colorWood: string;
  colorTrim: string;
  colorBezel: string;

  hotspots: Record<string, HotspotOverride>;
}

export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  ceilingProjection: true,

  eyeHeight: 1.6,
  wallMargin: 0.4,
  bodyRadius: 0.3,
  walkSpeed: 2.6,
  turnSpeed: 1.9,
  lookSensitivity: 4.5,
  lookLimit: 57,
  fovLandscape: 62,
  fovPortrait: 78,

  startX: 0,
  startZ: 0.9,
  startYaw: 0,
  startPitch: 0,
  startLit: false,

  resolution: 200,
  resolutionLongSide: 720,
  dither: 2,
  idleFrameMs: 50,
  messageSeconds: 4.5,

  wallSwitchSeconds: 0.9,
  panelSize: 0.5,
  darkWorld: 'nebula',
  defaultWorld: 'forest',
  worldLight: { nebula: 1.3, forest: 4.2, sunset: 3, city: 3 },
  worldHdri: { nebula: '', forest: '', sunset: '', city: '' },
  worldExposure: { nebula: 0.5, forest: 1, sunset: 1, city: 1 },
  worldYaw: { nebula: 0, forest: 0, sunset: 0, city: 0 },
  wallSaturation: 1.5,
  wallBrightness: 1.2,
  seamStrength: 0.8,
  gridStrength: 0.55,
  dropoutRate: 0.0012,
  deadPanel: true,
  glitchStrength: 1,
  rollBand: 0.06,
  ambientLight: 0.32,
  ambientColor: '#ffffff',
  darkFog: 0.06,
  fogColor: '#0b0d24',
  computerLightOn: 0.3,
  computerLightOff: 1.4,
  arcadeLightOn: 0.3,
  arcadeLightOff: 1.2,
  doorLightOff: 0.5,
  tvWidth: 2.2,
  tvHeight: 1.5,
  tvLight: 0.9,
  tvStandbyText: 'PICK A VIDEO',
  tvVolume: 0.8,
  tvIncludeProjects: true,
  tvVideos: [],
  walkBob: 0.022,
  viewDistance: 30,

  hintMouse: 'Click to walk. Drag to look around.',
  hintTouch: 'Tap to walk. Drag to look around.',
  lightsOnLine: 'Lights on.',
  lightsOffLine: 'Lights off.',

  colorOverrides: {},

  colorFloor: '#8a5636',
  colorCeiling: '#3a4048',
  colorWood: '#7a4a30',
  colorTrim: '#4d2f22',
  colorBezel: '#0b0d18',

  hotspots: {},
};

/** Fills in anything missing, so an older content file still works. */
export function withRoomDefaults(saved?: Partial<RoomSettings>): RoomSettings {
  return {
    ...DEFAULT_ROOM_SETTINGS,
    ...saved,
    worldLight: { ...DEFAULT_ROOM_SETTINGS.worldLight, ...saved?.worldLight },
    worldHdri: { ...DEFAULT_ROOM_SETTINGS.worldHdri, ...saved?.worldHdri },
    worldExposure: { ...DEFAULT_ROOM_SETTINGS.worldExposure, ...saved?.worldExposure },
    worldYaw: { ...DEFAULT_ROOM_SETTINGS.worldYaw, ...saved?.worldYaw },
    colorOverrides: { ...saved?.colorOverrides },
    tvVideos: Array.isArray(saved?.tvVideos) ? saved!.tvVideos : [],
    hotspots: { ...saved?.hotspots },
  };
}

/** Every colour the room's furniture is made from, for the admin page's colour swaps. */
export const ROOM_COLORS: string[] = [
  '#0b0d18',
  '#141833',
  '#1a1e10',
  '#1d4a5a',
  '#1f2350',
  '#2a1a14',
  '#2e2a6b',
  '#2e3a1c',
  '#3a4048',
  '#3a8fa0',
  '#4a3a8c',
  '#4d2f22',
  '#5a6a40',
  '#6b7480',
  '#6d4fa8',
  '#7a4a30',
  '#7fd4d8',
  '#94a348',
  '#a4adb8',
  '#a8744a',
  '#b8405a',
  '#d4a56a',
  '#f07a5a',
  '#f0d9a0',
  '#f3f7e4',
];
