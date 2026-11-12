// The room's adjustable settings and their starting values. The admin page's
// Room tab edits these (they are saved in content/site-content.json), and
// lib/room/room-settings.ts applies them to the room. This file is plain data
// so the rest of the site can import it without pulling in the 3D code.

import type { PanelId } from './room-data';
import type { WorldId } from './environments';

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
  ambientLight: number;
  /** Fog thickness with the lights off. */
  darkFog: number;

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
  ambientLight: 0.32,
  darkFog: 0.06,

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
    hotspots: { ...saved?.hotspots },
  };
}
