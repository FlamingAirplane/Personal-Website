// The room's settings as the 3D code sees them. applyRoomSettings() copies the
// values from the content file (or an admin draft) onto the room's data before
// the room is built; everything else reads them from here when it needs them.

import { ENVIRONMENTS, type WorldId } from './environments';
import { DEFAULT_ROOM_SETTINGS, withRoomDefaults, type RoomSettings } from './room-defaults';
import { HOTSPOTS, ROOM, START, type Hotspot } from './room-data';

export const RS: RoomSettings = withRoomDefaults();

/** The objects as written in room-data.ts, before any settings change them. */
export const DEFAULT_HOTSPOTS: Hotspot[] = HOTSPOTS.map((spot) => ({ ...spot, action: { ...spot.action } }));

const DEG = Math.PI / 180;

export function applyRoomSettings(settings: RoomSettings) {
  Object.assign(RS, withRoomDefaults(settings));

  ROOM.eyeHeight = RS.eyeHeight;
  ROOM.wallMargin = RS.wallMargin;
  ROOM.bodyRadius = RS.bodyRadius;

  START.x = RS.startX;
  START.z = RS.startZ;
  START.yaw = RS.startYaw * DEG;
  START.pitch = RS.startPitch * DEG;

  (Object.keys(ENVIRONMENTS) as WorldId[]).forEach((id) => {
    ENVIRONMENTS[id].light = RS.worldLight[id];
  });

  HOTSPOTS.forEach((spot, i) => {
    const base: Hotspot = DEFAULT_HOTSPOTS[i];
    const over = RS.hotspots[spot.id] ?? {};
    spot.label = over.label?.trim() || base.label;
    spot.world = over.world ? over.world : base.world;
    spot.panel = over.panel === 'none' ? undefined : over.panel ? over.panel : base.panel;
    spot.action = base.action.type === 'inspect' && over.line?.trim() ? { type: 'inspect', line: over.line.trim() } : { ...base.action };
  });
}

export { DEFAULT_ROOM_SETTINGS };
