// The room, described as data: four wall views, and the things you can
// click in each. Coordinates are in the room's own low-resolution pixels
// (ROOM_W x ROOM_H), so they stay correct at any screen size.
//
// To add an object: add a hotspot here, then paint it in lib/room/paint.ts.

export const ROOM_W = 320;
export const ROOM_H = 180;

export type ViewId = 'north' | 'east' | 'south' | 'west';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

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
  rect: Rect;
  action: HotspotAction;
}

export interface RoomView {
  id: ViewId;
  /** Shown in the compass. */
  name: string;
  /** The view you face after turning left / right. */
  left: ViewId;
  right: ViewId;
  hotspots: Hotspot[];
}

export const START_VIEW: ViewId = 'north';

export const ROOM_VIEWS: Record<ViewId, RoomView> = {
  north: {
    id: 'north',
    name: 'N',
    left: 'west',
    right: 'east',
    hotspots: [
      {
        id: 'window',
        label: 'Window',
        rect: { x: 86, y: 20, w: 148, h: 80 },
        action: {
          type: 'inspect',
          line: 'Whatever is out there keeps the same hours you do.',
        },
      },
      {
        id: 'light-switch',
        label: 'Light switch',
        rect: { x: 262, y: 60, w: 14, h: 20 },
        action: { type: 'toggle-light' },
      },
    ],
  },
  east: {
    id: 'east',
    name: 'E',
    left: 'north',
    right: 'south',
    hotspots: [
      {
        id: 'computer',
        label: 'Computer',
        rect: { x: 100, y: 46, w: 76, h: 52 },
        action: {
          type: 'inspect',
          line: 'The computer. The bigger games will live on its desktop.',
        },
      },
      {
        id: 'shelf',
        label: 'Shelf',
        rect: { x: 204, y: 26, w: 88, h: 30 },
        action: {
          type: 'inspect',
          line: "A shelf for what I'm reading, hearing and building.",
        },
      },
    ],
  },
  south: {
    id: 'south',
    name: 'S',
    left: 'east',
    right: 'west',
    hotspots: [
      {
        id: 'door',
        label: 'Door (leave for the standard site)',
        rect: { x: 40, y: 28, w: 58, h: 92 },
        action: { type: 'exit' },
      },
      {
        id: 'arcade',
        label: 'Arcade machine',
        rect: { x: 146, y: 32, w: 60, h: 104 },
        action: {
          type: 'inspect',
          line: 'The arcade machine. Browser games will run right here.',
        },
      },
      {
        id: 'toolbox',
        label: 'Toolbox',
        rect: { x: 238, y: 118, w: 54, h: 30 },
        action: {
          type: 'inspect',
          line: 'The toolbox. My tools go in here.',
        },
      },
    ],
  },
  west: {
    id: 'west',
    name: 'W',
    left: 'south',
    right: 'north',
    hotspots: [
      {
        id: 'cinema',
        label: 'Cinema screen',
        rect: { x: 50, y: 22, w: 180, h: 80 },
        action: {
          type: 'inspect',
          line: 'The screen is blank. It wants headphones first.',
        },
      },
      {
        id: 'headphones',
        label: 'Headphones',
        rect: { x: 254, y: 58, w: 32, h: 40 },
        action: {
          type: 'inspect',
          line: 'Headphones. Putting them on will start the show.',
        },
      },
    ],
  },
};

export function hotspotRect(view: ViewId, id: string): Rect {
  const spot = ROOM_VIEWS[view].hotspots.find((h) => h.id === id);
  if (!spot) throw new Error(`No hotspot "${id}" in view "${view}"`);
  return spot.rect;
}
