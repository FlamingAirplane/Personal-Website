// What is in the room. Each object is built in lib/room/build-room.ts or
// lib/room/props.ts inside a group with the same id; this list says which
// wall it belongs to, whether you walk around it, and what happens when you
// look at it by default. Everything here can be overridden from the admin
// page (see config.ts).
//
// To add an object: build it between kit.begin('my-id') and kit.end(), then
// add a line here.

/**
 * The room the objects were designed in, in metres. Objects are built at
 * these coordinates, then moved with their wall if the room is resized.
 */
export const ROOM = {
  width: 7, // x: -3.5 .. 3.5
  depth: 6, // z: -3 .. 3
  height: 3,
  /** Height of the desk's top surface. */
  deskTop: 0.78,
};

/** The wall an object hangs on or stands against. It moves with that wall. */
export type Anchor = 'north' | 'south' | 'east' | 'west' | 'none';

export type HotspotAction =
  /** Flip the room light. */
  | { type: 'toggle-light' }
  /** Leave the room for the Standard site. */
  | { type: 'exit' }
  /** Say a line. */
  | { type: 'inspect'; line: string }
  /** Admin preview only: just select the object. */
  | { type: 'select' };

export interface ObjectDef {
  id: string;
  label: string;
  /** Used to group the admin list. */
  group: string;
  anchor: Anchor;
  /** Do you walk around it? */
  solid: boolean;
  /** Present when it can be clicked by default. */
  hotspot?: { action: HotspotAction; world?: string };
}

export const OBJECTS: ObjectDef[] = [
  {
    id: 'light-switch',
    label: 'Light switch',
    group: 'North wall',
    anchor: 'north',
    solid: false,
    hotspot: { action: { type: 'toggle-light' } },
  },
  {
    id: 'record-player',
    label: 'Record player',
    group: 'North wall',
    anchor: 'north',
    solid: true,
    hotspot: {
      action: { type: 'inspect', line: "The record player. What I've been listening to will spin here." },
      world: 'sunset',
    },
  },
  {
    id: 'plant',
    label: 'Plant and watering can',
    group: 'North wall',
    anchor: 'north',
    solid: true,
  },
  {
    id: 'desk',
    label: 'Desk',
    group: 'East wall',
    anchor: 'east',
    solid: true,
  },
  {
    id: 'computer',
    label: 'Computer',
    group: 'East wall',
    anchor: 'east',
    solid: false,
    hotspot: {
      action: { type: 'inspect', line: 'The computer. The bigger games will live on its desktop.' },
      world: 'forest',
    },
  },
  { id: 'speakers', label: 'Studio speakers', group: 'East wall', anchor: 'east', solid: false },
  { id: 'interface', label: 'Audio interface', group: 'East wall', anchor: 'east', solid: false },
  { id: 'microphone', label: 'Microphone and boom arm', group: 'East wall', anchor: 'east', solid: false },
  { id: 'chair', label: 'Desk chair', group: 'East wall', anchor: 'east', solid: true },
  {
    id: 'bookcase',
    label: 'Bookcase',
    group: 'East wall',
    anchor: 'east',
    solid: true,
    hotspot: {
      action: { type: 'inspect', line: "The bookcase. What I'm reading goes on these shelves." },
      world: 'city',
    },
  },
  {
    id: 'arcade',
    label: 'Arcade machine',
    group: 'South wall',
    anchor: 'south',
    solid: true,
    hotspot: {
      action: { type: 'inspect', line: 'The arcade machine. Browser games will run right here.' },
      world: 'sunset',
    },
  },
  {
    id: 'toolbox',
    label: 'Toolbox',
    group: 'South wall',
    anchor: 'south',
    solid: true,
    hotspot: {
      action: { type: 'inspect', line: 'The toolbox. My tools go in here.' },
      world: 'forest',
    },
  },
  {
    id: 'whiteboard',
    label: 'Whiteboard',
    group: 'South wall',
    anchor: 'south',
    solid: true,
    hotspot: {
      action: { type: 'inspect', line: "The whiteboard. What I'm working on right now goes up here." },
      world: 'forest',
    },
  },
  {
    id: 'door',
    label: 'Door (leave for the standard site)',
    group: 'South wall',
    anchor: 'south',
    solid: false,
    hotspot: { action: { type: 'exit' } },
  },
  {
    id: 'cinema',
    label: 'Cinema screen',
    group: 'West wall',
    anchor: 'west',
    solid: false,
    hotspot: {
      action: { type: 'inspect', line: 'The screen is blank. It wants headphones first.' },
      world: 'sunset',
    },
  },
  {
    id: 'headphones',
    label: 'Headphones',
    group: 'West wall',
    anchor: 'west',
    solid: false,
    hotspot: {
      action: { type: 'inspect', line: 'Headphones. Putting them on will start the show.' },
      world: 'city',
    },
  },
  { id: 'couch', label: 'Couch and controller', group: 'Floor', anchor: 'west', solid: true },
  { id: 'rug', label: 'Rug', group: 'Floor', anchor: 'none', solid: false },
];

export const OBJECT_IDS = new Set(OBJECTS.map((o) => o.id));

/** How far an anchored object moves when the room is resized from the design size. */
export function anchorShift(anchor: Anchor, width: number, depth: number): { dx: number; dz: number } {
  const dw = (width - ROOM.width) / 2;
  const dd = (depth - ROOM.depth) / 2;
  switch (anchor) {
    case 'east':
      return { dx: dw, dz: 0 };
    case 'west':
      return { dx: -dw, dz: 0 };
    case 'north':
      return { dx: 0, dz: -dd };
    case 'south':
      return { dx: 0, dz: dd };
    default:
      return { dx: 0, dz: 0 };
  }
}
