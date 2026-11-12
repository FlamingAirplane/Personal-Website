// What the admin page shows for each of the room's global settings. Adding a
// line here is all it takes to expose a new number, colour or switch.
//
// `path` is where the value lives in the config (see config.ts).

export type FieldKind = 'number' | 'color' | 'text' | 'longtext' | 'bool' | 'select';

export interface Field {
  path: string;
  label: string;
  kind: FieldKind;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: [value: string, label: string][];
  help?: string;
}

export interface SectionDef {
  id: string;
  title: string;
  intro?: string;
  fields: Field[];
}

export interface TabDef {
  id: string;
  title: string;
  sections: SectionDef[];
}

export const SCHEMA_TABS: TabDef[] = [
  {
    id: 'room',
    title: 'Room',
    sections: [
      {
        id: 'size',
        title: 'Size',
        intro:
          'Furniture stays against its own wall when you resize, so a bigger room is just more floor in the middle.',
        fields: [
          { path: 'room.width', label: 'Width (east to west)', kind: 'number', min: 4, max: 16, step: 0.5, unit: 'm' },
          { path: 'room.depth', label: 'Depth (north to south)', kind: 'number', min: 4, max: 16, step: 0.5, unit: 'm' },
          { path: 'room.height', label: 'Height', kind: 'number', min: 2.2, max: 6, step: 0.1, unit: 'm' },
        ],
      },
      {
        id: 'surfaces',
        title: 'Floor, ceiling and edges',
        fields: [
          { path: 'surfaces.floorColor', label: 'Floor colour', kind: 'color' },
          { path: 'surfaces.floorSeams', label: 'Floorboard seams', kind: 'bool' },
          {
            path: 'surfaces.ceilingMode',
            label: 'Ceiling',
            kind: 'select',
            options: [
              ['screen', 'A screen, like the walls'],
              ['solid', 'A plain colour'],
            ],
          },
          { path: 'surfaces.ceilingColor', label: 'Ceiling colour (plain mode)', kind: 'color' },
          { path: 'surfaces.bezelColor', label: 'Frame around the screens', kind: 'color' },
        ],
      },
    ],
  },
  {
    id: 'player',
    title: 'Player',
    sections: [
      {
        id: 'start',
        title: 'Where you start',
        fields: [
          { path: 'player.startX', label: 'East / west position', kind: 'number', min: -8, max: 8, step: 0.1, unit: 'm' },
          { path: 'player.startZ', label: 'South / north position', kind: 'number', min: -8, max: 8, step: 0.1, unit: 'm' },
          {
            path: 'player.startYaw',
            label: 'Facing',
            kind: 'number',
            min: -180,
            max: 180,
            step: 5,
            unit: '°',
            help: '0 faces north. Positive turns left.',
          },
        ],
      },
      {
        id: 'movement',
        title: 'Moving and looking',
        fields: [
          { path: 'player.walkSpeed', label: 'Walking speed', kind: 'number', min: 0.5, max: 8, step: 0.1, unit: 'm/s' },
          { path: 'player.turnSpeed', label: 'Turning speed (keys)', kind: 'number', min: 0.3, max: 6, step: 0.1, unit: 'rad/s' },
          { path: 'player.lookSpeed', label: 'Mouse look sensitivity', kind: 'number', min: 0.001, max: 0.02, step: 0.0005 },
          { path: 'player.pitchLimit', label: 'How far you can look up and down', kind: 'number', min: 20, max: 89, step: 1, unit: '°' },
          { path: 'player.bob', label: 'Head bob while walking', kind: 'number', min: 0, max: 0.15, step: 0.005, unit: 'm' },
          { path: 'player.glide', label: 'Glide to where you click', kind: 'bool', help: 'Off makes you arrive instantly.' },
        ],
      },
      {
        id: 'camera',
        title: 'Camera',
        fields: [
          { path: 'room.eyeHeight', label: 'Eye height', kind: 'number', min: 0.5, max: 2.6, step: 0.05, unit: 'm' },
          { path: 'player.fov', label: 'Field of view (wide screens)', kind: 'number', min: 30, max: 110, step: 1, unit: '°' },
          { path: 'player.fovPortrait', label: 'Field of view (phones held upright)', kind: 'number', min: 30, max: 120, step: 1, unit: '°' },
        ],
      },
      {
        id: 'body',
        title: 'Collision',
        fields: [
          { path: 'room.wallMargin', label: 'How close you can get to a wall', kind: 'number', min: 0.1, max: 1.5, step: 0.05, unit: 'm' },
          { path: 'room.bodyRadius', label: 'How close you can get to furniture', kind: 'number', min: 0.1, max: 0.8, step: 0.05, unit: 'm' },
        ],
      },
    ],
  },
  {
    id: 'look',
    title: 'Look',
    sections: [
      {
        id: 'pixels',
        title: 'The pixel look',
        intro: 'The room is drawn at a small size and scaled up with hard edges. Lower numbers are chunkier.',
        fields: [
          { path: 'look.shortSide', label: 'Picture height', kind: 'number', min: 60, max: 540, step: 10, unit: 'px', help: 'Shorter side of the picture. 200 is the default.' },
          { path: 'look.longSideMax', label: 'Widest the picture gets', kind: 'number', min: 120, max: 1600, step: 20, unit: 'px' },
          { path: 'look.ditherStrength', label: 'Dither strength', kind: 'number', min: 0, max: 12, step: 0.5, help: 'The speckle that blends between palette colours. 0 turns it off.' },
          { path: 'look.idleFps', label: 'Frame rate while standing still', kind: 'number', min: 5, max: 60, step: 1, unit: 'fps' },
        ],
      },
    ],
  },
  {
    id: 'light',
    title: 'Light',
    sections: [
      {
        id: 'mood',
        title: 'Light and dark',
        fields: [
          {
            path: 'light.startLit',
            label: 'When the room opens',
            kind: 'select',
            options: [
              ['remember', 'As the visitor left it'],
              ['dark', 'Always dark'],
              ['lit', 'Always lit'],
            ],
          },
          { path: 'light.ambient', label: 'Background light', kind: 'number', min: 0, max: 3, step: 0.05 },
          { path: 'light.wallLight', label: 'Light from the screens', kind: 'number', min: 0, max: 4, step: 0.05, help: 'How strongly the walls light the room.' },
          { path: 'light.accentDark', label: 'Glow of screens and lamps (dark)', kind: 'number', min: 0, max: 4, step: 0.05 },
          { path: 'light.accentLit', label: 'Glow of screens and lamps (lit)', kind: 'number', min: 0, max: 4, step: 0.05 },
          { path: 'light.fogDark', label: 'Fog when dark', kind: 'number', min: 0, max: 0.4, step: 0.005 },
          { path: 'light.fogColor', label: 'Fog colour', kind: 'color' },
        ],
      },
    ],
  },
  {
    id: 'walls',
    title: 'Screens',
    sections: [
      {
        id: 'picture',
        title: 'Picture',
        fields: [
          { path: 'walls.saturation', label: 'Colour strength', kind: 'number', min: 0, max: 3, step: 0.05 },
          { path: 'walls.brightness', label: 'Brightness', kind: 'number', min: 0.2, max: 3, step: 0.05 },
          {
            path: 'walls.timeOfDay',
            label: 'Time of day',
            kind: 'select',
            options: [
              ['real', "Follow the visitor's clock"],
              ['fixed', 'A fixed hour'],
              ['off', 'No tint'],
            ],
            help: 'Only applies to places marked "follows the clock".',
          },
          { path: 'walls.fixedHour', label: 'The fixed hour', kind: 'number', min: 0, max: 24, step: 0.5, unit: 'h' },
        ],
      },
      {
        id: 'panels',
        title: 'Panels and glitches',
        fields: [
          { path: 'walls.panel', label: 'Panel size', kind: 'number', min: 0.2, max: 2, step: 0.05, unit: 'm' },
          { path: 'walls.seams', label: 'Seams between panels', kind: 'number', min: 0, max: 1, step: 0.05 },
          { path: 'walls.grid', label: 'Pixel grid up close', kind: 'number', min: 0, max: 1, step: 0.05 },
          { path: 'walls.glitchSeconds', label: 'Length of the glitch when changing place', kind: 'number', min: 0.1, max: 4, step: 0.1, unit: 's' },
          { path: 'walls.flicker', label: 'Panels dropping out', kind: 'number', min: 0, max: 10, step: 0.5, help: '0 is never, 1 is the default.' },
          { path: 'walls.deadPanel', label: 'One panel that never works', kind: 'bool' },
          { path: 'walls.rollBand', label: 'Bright band rolling down', kind: 'bool' },
        ],
      },
    ],
  },
  {
    id: 'text',
    title: 'Words',
    sections: [
      {
        id: 'words',
        title: 'Text in the room',
        fields: [
          { path: 'text.hintMouse', label: 'Hint (mouse)', kind: 'text' },
          { path: 'text.hintTouch', label: 'Hint (touch screens)', kind: 'text' },
          { path: 'text.loading', label: 'While loading', kind: 'text' },
          { path: 'text.lightsOn', label: 'Switch turned on', kind: 'text' },
          { path: 'text.lightsOff', label: 'Switch turned off', kind: 'text' },
          { path: 'text.standardSite', label: 'Button back to the standard site', kind: 'text' },
        ],
      },
    ],
  },
];
