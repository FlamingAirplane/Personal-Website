// The room, described as data: its size, where you start, and the things you
// can walk up to. Distances are in metres. X runs west (-) to east (+),
// Z runs north (-) to south (+), Y is up.
//
// To add an object: add a hotspot here, then build it in lib/room/build-room.ts.

import type { WorldId } from './environments';

export const ROOM = {
  width: 7, // x: -3.5 .. 3.5
  depth: 6, // z: -3 .. 3
  height: 3,
  eyeHeight: 1.6,
  /** How close you can get to a wall. */
  wallMargin: 0.4,
};

export const START = { x: 0, z: 0.9, yaw: 0, pitch: 0 };

export type Vec3 = [number, number, number];

export type HotspotAction =
  /** Flip the room light. */
  | { type: 'toggle-light' }
  /** Leave the room for the Standard site. */
  | { type: 'exit' }
  /** Say a line. Placeholder until the object gets its close-up. */
  | { type: 'inspect'; line: string };

export interface Hotspot {
  id: string;
  /** Short name, shown on hover and read by screen readers. */
  label: string;
  /** Centre and size of the clickable volume around the object. */
  center: Vec3;
  size: Vec3;
  /** Where you stand (x, z) when you walk up to it. */
  stand: [number, number];
  action: HotspotAction;
  /**
   * The place the wall screens switch to when you inspect this.
   * Placeholder pairings until each project brings its own.
   */
  world?: WorldId;
}

export const HOTSPOTS: Hotspot[] = [
  {
    id: 'light-switch',
    label: 'Light switch',
    center: [2.3, 1.35, -2.95],
    size: [0.3, 0.4, 0.2],
    stand: [2.3, -1.3],
    action: { type: 'toggle-light' },
  },
  {
    id: 'computer',
    label: 'Computer',
    center: [3.2, 1.08, 0],
    size: [0.3, 0.62, 0.75],
    stand: [1.7, 0],
    action: { type: 'inspect', line: 'The computer. The bigger games will live on its desktop.' },
    world: 'forest',
  },
  {
    id: 'shelf',
    label: 'Shelf',
    center: [3.34, 1.98, -2.0],
    size: [0.35, 0.6, 1.3],
    stand: [2.0, -2.0],
    action: { type: 'inspect', line: "A shelf for what I'm reading, hearing and building." },
    world: 'city',
  },
  {
    id: 'door',
    label: 'Door (leave for the standard site)',
    center: [-2.2, 1.05, 2.93],
    size: [1.1, 2.2, 0.25],
    stand: [-2.2, 1.3],
    action: { type: 'exit' },
  },
  {
    id: 'arcade',
    label: 'Arcade machine',
    center: [0.6, 0.9, 2.55],
    size: [0.9, 1.85, 0.85],
    stand: [0.6, 1.0],
    action: { type: 'inspect', line: 'The arcade machine. Browser games will run right here.' },
    world: 'sunset',
  },
  {
    id: 'toolbox',
    label: 'Toolbox',
    center: [2.3, 0.2, 2.4],
    size: [0.75, 0.5, 0.45],
    stand: [2.3, 1.2],
    action: { type: 'inspect', line: 'The toolbox. My tools go in here.' },
    world: 'forest',
  },
  {
    id: 'cinema',
    label: 'Cinema screen',
    center: [-3.4, 1.7, 0],
    size: [0.25, 1.8, 3.4],
    stand: [-0.8, 0],
    action: { type: 'inspect', line: 'The screen is blank. It wants headphones first.' },
    world: 'sunset',
  },
  {
    id: 'headphones',
    label: 'Headphones',
    center: [-3.38, 1.4, 2.1],
    size: [0.3, 0.55, 0.5],
    stand: [-2.3, 2.1],
    action: { type: 'inspect', line: 'Headphones. Putting them on will start the show.' },
    world: 'city',
  },
];

/** Floor areas taken up by furniture, which you walk around: [x0, x1, z0, z1]. */
export const OBSTACLES: [number, number, number, number][] = [
  [2.55, 3.5, -1.15, 1.15], // desk
  [0.2, 1.0, 2.15, 3.0], // arcade machine
  [1.95, 2.65, 2.2, 2.6], // toolbox
];
