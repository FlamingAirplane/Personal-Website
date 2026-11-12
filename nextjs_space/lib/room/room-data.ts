// The room, described as data: its size, where you start, and the things you
// can walk up to. Distances are in metres. X runs west (-) to east (+),
// Z runs north (-) to south (+), Y is up.
//
// To add an object: add a hotspot here, build it in lib/room/build-room.ts or
// lib/room/props.ts, and add its footprint to OBSTACLES if it stands on the floor.

import type { WorldId } from './environments';

export const ROOM = {
  width: 7, // x: -3.5 .. 3.5
  depth: 6, // z: -3 .. 3
  height: 3,
  eyeHeight: 1.6,
  /** How close you can get to a wall. */
  wallMargin: 0.4,
  /** How close you can get to furniture (the walker's own radius). */
  bodyRadius: 0.3,
  /** Height of the desk's top surface. */
  deskTop: 0.78,
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
    size: [0.3, 0.4, 0.12],
    stand: [2.1, -1.5],
    action: { type: 'toggle-light' },
  },
  {
    id: 'record-player',
    label: 'Record player',
    center: [0, 0.47, -2.74],
    size: [1.14, 0.94, 0.48],
    stand: [0.2, -1.4],
    action: { type: 'inspect', line: "The record player. What I've been listening to will spin here." },
    world: 'sunset',
  },
  {
    id: 'bookcase',
    label: 'Bookcase',
    center: [3.34, 0.96, -2.15],
    size: [0.36, 1.96, 1.04],
    stand: [1.9, -2.15],
    action: { type: 'inspect', line: "The bookcase. What I'm reading goes on these shelves." },
    world: 'city',
  },
  {
    id: 'computer',
    label: 'Computer',
    center: [3.2, 1.08, 0],
    size: [0.2, 0.5, 0.72],
    stand: [1.7, 0],
    action: { type: 'inspect', line: 'The computer. The bigger games will live on its desktop.' },
    world: 'forest',
  },
  {
    id: 'toolbox',
    label: 'Toolbox',
    center: [2.3, 0.21, 2.4],
    size: [0.68, 0.46, 0.38],
    stand: [2.3, 1.6],
    action: { type: 'inspect', line: 'The toolbox. My tools go in here.' },
    world: 'forest',
  },
  {
    id: 'arcade',
    label: 'Arcade machine',
    center: [0.6, 0.92, 2.56],
    size: [0.88, 1.86, 0.9],
    stand: [0.6, 1.0],
    action: { type: 'inspect', line: 'The arcade machine. Browser games will run right here.' },
    world: 'sunset',
  },
  {
    id: 'whiteboard',
    label: 'Whiteboard',
    center: [-0.8, 1.3, 2.79],
    size: [1.24, 0.9, 0.12],
    stand: [-0.8, 1.3],
    action: { type: 'inspect', line: "The whiteboard. What I'm working on right now goes up here." },
    world: 'forest',
  },
  {
    id: 'door',
    label: 'Door (leave for the standard site)',
    center: [-2.2, 1.07, 2.94],
    size: [1.1, 2.18, 0.16],
    stand: [-2.2, 1.3],
    action: { type: 'exit' },
  },
  {
    id: 'headphones',
    label: 'Headphones',
    center: [-3.4, 1.4, 2.1],
    size: [0.22, 0.46, 0.42],
    stand: [-2.3, 2.1],
    action: { type: 'inspect', line: 'Headphones. Putting them on will start the show.' },
    world: 'city',
  },
  {
    id: 'cinema',
    label: 'Cinema screen',
    center: [-3.45, 1.7, 0],
    size: [0.1, 1.8, 3.4],
    stand: [-0.6, 0],
    action: { type: 'inspect', line: 'The screen is blank. It wants headphones first.' },
    world: 'sunset',
  },
];

/**
 * Floor areas taken up by furniture, which you walk around: [x0, x1, z0, z1].
 * Every hotspot's `stand` point must be at least ROOM.bodyRadius outside all
 * of these, or you can never quite reach it.
 */
export const OBSTACLES: [number, number, number, number][] = [
  [2.55, 3.5, -1.15, 1.15], // desk
  [2.1, 2.72, -0.22, 0.45], // desk chair
  [3.16, 3.5, -2.67, -1.63], // bookcase
  [-0.58, 1.1, -3.0, -2.5], // record cabinet and crate
  [-2.5, -1.38, -2.85, -2.45], // plant and watering can
  [-2.07, -1.13, -0.87, 0.87], // couch
  [0.2, 1.0, 2.15, 3.0], // arcade machine
  [1.95, 2.65, 2.2, 2.6], // toolbox
  [-1.45, -0.15, 2.4, 3.0], // whiteboard
];
