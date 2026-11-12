// Builds the 3D room from a RoomConfig. The furniture is placeholder
// geometry made of boxes (or your own models, see models.ts); the walls and
// ceiling are screens (wall-screens.ts).
//
// Every object is built at its design position inside a group, then wrapped
// so it can be moved, turned, scaled, hidden or swapped for a model without
// touching the code that draws it. What you can click, where you stand to
// look at it, and what you walk around are all worked out from the shapes
// that actually ended up in the room.

import * as THREE from 'three';
import type { Resolver } from './assets';
import {
  effectiveHotspot,
  effectiveObject,
  type CardCfg,
  type ExtraCfg,
  type ModelCfg,
  type RoomConfig,
} from './config';
import { loadModel, placeModel } from './models';
import { createNavigator, type Navigator } from './pathfinding';
import { addProps } from './props';
import { anchorShift, OBJECTS, ROOM, type Anchor, type HotspotAction } from './room-data';
import { ARCADE_SIZE, PC_SIZE, paintArcade, paintComputer } from './screens';
import { createWallScreens } from './wall-screens';
import { buildWorlds, itemWorldId } from './worlds';

/* ---------------------------------- types ---------------------------------- */

/** Something you can click, as it is in the room right now. */
export interface RuntimeHotspot {
  id: string;
  label: string;
  /** The box around it. */
  center: [number, number, number];
  size: [number, number, number];
  /** Where you stand (x, z) to look at it. */
  stand: [number, number];
  action: HotspotAction;
  /** The place the walls switch to on arrival; empty for none. */
  world: string;
  card: CardCfg | null;
}

export interface Layout {
  /** Goes up every time the layout changes (a model arrived, for example). */
  revision: number;
  hotspots: RuntimeHotspot[];
  /** Floor areas you walk around: [x0, x1, z0, z1]. */
  obstacles: [number, number, number, number][];
  navigator: Navigator;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
}

export interface Room {
  scene: THREE.Scene;
  /** Clicking this means "walk here". */
  floor: THREE.Mesh;
  /** Invisible boxes around each hotspot; userData.hotspotId names it. */
  hitGroup: THREE.Group;
  layout: Layout;
  /** Resolves once every model and picture has arrived and the layout is final. */
  ready: Promise<void>;
  /**
   * Lights off: the screens show the dark place. Lights on: they show `world`.
   * `instant` skips the glitchy switch-over.
   */
  setState(lit: boolean, world: string, instant?: boolean): void;
  /** True while something needs every frame drawn (the screens switching place). */
  busy(): boolean;
  /** Outline the hovered and the selected items (either may be null). */
  setHighlight(hover: string | null, selected?: string | null): void;
  /** Advance everything that moves. `t` and `dt` are in seconds. */
  update(t: number, dt: number, reducedMotion: boolean): void;
  dispose(): void;
}

export interface BuildOptions {
  /** In the admin preview every object can be clicked, to select it. */
  editor?: boolean;
}

interface Placed {
  id: string;
  label: string;
  anchor: Anchor;
  solid: boolean;
  /** Clickable by default? */
  interactiveByDefault: boolean;
  defaultAction?: HotspotAction;
  defaultWorld?: string;
  holder: THREE.Group;
  content?: THREE.Group;
}

const HALF_W = ROOM.width / 2;
const HALF_D = ROOM.depth / 2;

/** The box around every visible mesh under `obj`, in world coordinates. */
function visibleBox(obj: THREE.Object3D): THREE.Box3 | null {
  const out = new THREE.Box3();
  const tmp = new THREE.Box3();
  obj.updateWorldMatrix(true, true);
  obj.traverseVisible((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || !mesh.geometry) return;
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    tmp.copy(mesh.geometry.boundingBox as THREE.Box3).applyMatrix4(mesh.matrixWorld);
    out.union(tmp);
  });
  return out.isEmpty() ? null : out;
}

/* --------------------------------- the room -------------------------------- */

export function buildRoom(config: RoomConfig, resolve: Resolver, options: BuildOptions = {}): Room {
  const W = config.room.width;
  const D = config.room.depth;
  const H = config.room.height;
  const halfW = W / 2;
  const halfD = D / 2;

  const scene = new THREE.Scene();
  const disposables: { dispose(): void }[] = [];
  let disposed = false;

  // One material per colour, shared by every box of that colour.
  const lambertCache = new Map<string, THREE.MeshLambertMaterial>();
  const lambert = (color: string) => {
    let m = lambertCache.get(color);
    if (!m) {
      m = new THREE.MeshLambertMaterial({ color });
      lambertCache.set(color, m);
      disposables.push(m);
    }
    return m;
  };
  // Unlit and unaffected by fog: for things that make their own light.
  const glowCache = new Map<string, THREE.MeshBasicMaterial>();
  const glow = (color: string) => {
    let m = glowCache.get(color);
    if (!m) {
      m = new THREE.MeshBasicMaterial({ color, fog: false });
      glowCache.set(color, m);
      disposables.push(m);
    }
    return m;
  };

  /* ---- building objects: begin('id') ... end() ---- */

  const groups = new Map<string, THREE.Group>();
  let current: THREE.Object3D = scene;
  const begin = (id: string) => {
    const g = new THREE.Group();
    groups.set(id, g);
    current = g;
  };
  const end = () => {
    current = scene;
  };
  const add = (...objects: THREE.Object3D[]) => current.add(...objects);

  /** A box centred at (x, y, z). */
  const box = (
    material: THREE.Material,
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    parent: THREE.Object3D = current,
  ) => {
    const geometry = new THREE.BoxGeometry(w, h, d);
    disposables.push(geometry);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };

  /** A square bar running from one point to another. */
  const beam = (material: THREE.Material, thickness: number, from: THREE.Vector3, to: THREE.Vector3) => {
    const mesh = box(material, thickness, thickness, from.distanceTo(to), 0, 0, 0);
    mesh.position.copy(from).add(to).multiplyScalar(0.5);
    mesh.lookAt(to);
    return mesh;
  };

  /** An upright cylinder centred at (x, y, z). */
  const disc = (
    material: THREE.Material,
    radius: number,
    height: number,
    x: number,
    y: number,
    z: number,
    parent: THREE.Object3D = current,
  ) => {
    const geometry = new THREE.CylinderGeometry(radius, radius, height, 12);
    disposables.push(geometry);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };

  /** A cylinder lying along the east-west (x) axis, centred at (x, y, z). */
  const rod = (material: THREE.Material, radius: number, length: number, x: number, y: number, z: number) => {
    const geometry = new THREE.CylinderGeometry(radius, radius, length, 10);
    disposables.push(geometry);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.z = Math.PI / 2;
    mesh.position.set(x, y, z);
    current.add(mesh);
    return mesh;
  };

  /** A flat screen showing a small 2D drawing that is redrawn over time. */
  const screens: {
    ctx: CanvasRenderingContext2D;
    texture: THREE.CanvasTexture;
    paint: (ctx: CanvasRenderingContext2D, t: number) => void;
  }[] = [];
  const screen = (
    size: { w: number; h: number },
    paint: (ctx: CanvasRenderingContext2D, t: number) => void,
    w: number,
    h: number,
    x: number,
    y: number,
    z: number,
    rotationY: number,
  ) => {
    const canvas = document.createElement('canvas');
    canvas.width = size.w;
    canvas.height = size.h;
    const ctx = canvas.getContext('2d')!;
    paint(ctx, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    const material = new THREE.MeshBasicMaterial({ map: texture, fog: false, side: THREE.DoubleSide });
    const geometry = new THREE.PlaneGeometry(w, h);
    disposables.push(texture, material, geometry);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.rotation.y = rotationY;
    current.add(mesh);
    screens.push({ ctx, texture, paint });
    return mesh;
  };

  /* ------------------------------ the shell ------------------------------ */

  const sf = config.surfaces;
  const trimMat = lambert('#4d2f22');
  const woodMat = lambert('#7a4a30');
  const bezelMat = lambert(sf.bezelColor);

  const floor = box(lambert(sf.floorColor), W, 0.1, D, 0, -0.05, 0);
  if (sf.floorSeams) {
    for (let x = -halfW + 0.5; x < halfW; x += 0.5) box(trimMat, 0.02, 0.004, D, x, 0.002, 0);
  }
  box(lambert(sf.ceilingColor), W, 0.1, D, 0, H + 0.05, 0); // behind the ceiling screen

  const worlds = buildWorlds(config, resolve);
  const darkWorld = worlds[config.worlds.darkWorld] ? config.worlds.darkWorld : 'nebula';

  // The walls and ceiling are screens (see wall-screens.ts).
  const walls = createWallScreens({
    width: W,
    depth: D,
    height: H,
    walls: config.walls,
    ceiling: sf.ceilingMode,
    worlds,
    initial: darkWorld,
    lightMultiplier: config.light.wallLight,
  });
  scene.add(walls.group, walls.light);

  // Bezels where the screens meet the floor and ceiling.
  for (const y of [0.04, H - 0.04]) {
    box(bezelMat, W, 0.08, 0.03, 0, y, -halfD + 0.015);
    box(bezelMat, W, 0.08, 0.03, 0, y, halfD - 0.015);
    box(bezelMat, 0.03, 0.08, D, halfW - 0.015, y, 0);
    box(bezelMat, 0.03, 0.08, D, -halfW + 0.015, y, 0);
  }

  /* ----------------------------- north: switch ---------------------------- */

  const northZ = -HALF_D;
  const SWITCH_X = 2.3;
  const SWITCH_Y = 1.35;
  begin('light-switch');
  box(lambert('#f3f7e4'), 0.12, 0.18, 0.02, SWITCH_X, SWITCH_Y, northZ + 0.01);
  const switchNub = box(lambert('#6b7480'), 0.04, 0.06, 0.03, SWITCH_X, SWITCH_Y - 0.03, northZ + 0.03);
  // A small light so the switch can be found in the dark.
  const switchLed = box(glow('#f07a5a'), 0.045, 0.045, 0.02, SWITCH_X, SWITCH_Y + 0.14, northZ + 0.02);
  end();

  /* ------------------------- east: desk, computer ------------------------ */

  const eastX = HALF_W;
  const greyDark = lambert('#3a4048');
  const greyMid = lambert('#6b7480');
  const black = lambert('#0b0d18');
  const DESK_TOP = ROOM.deskTop;

  begin('desk');
  box(woodMat, 0.85, 0.06, 2.2, eastX - 0.45, 0.75, 0);
  box(trimMat, 0.07, 0.72, 0.07, eastX - 0.82, 0.36, -1.03);
  box(trimMat, 0.07, 0.72, 0.07, eastX - 0.82, 0.36, 1.03);
  box(trimMat, 0.07, 0.72, 0.07, eastX - 0.08, 0.36, -1.03);
  box(trimMat, 0.07, 0.72, 0.07, eastX - 0.08, 0.36, 1.03);
  box(lambert('#a4adb8'), 0.14, 0.02, 0.44, eastX - 0.66, DESK_TOP + 0.01, 0.02); // keyboard
  box(greyDark, 0.1, 0.03, 0.06, eastX - 0.66, DESK_TOP + 0.015, 0.36); // mouse
  end();

  begin('computer');
  // 27-inch monitor (16:9, 598 x 336 mm picture).
  const MON_X = eastX - 0.3;
  const MON_Y = DESK_TOP + 0.31;
  box(greyDark, 0.2, 0.02, 0.26, MON_X + 0.02, DESK_TOP + 0.01, 0); // base
  box(greyDark, 0.04, 0.16, 0.06, MON_X + 0.03, DESK_TOP + 0.09, 0); // neck
  box(black, 0.04, 0.365, 0.615, MON_X, MON_Y, 0);
  screen(PC_SIZE, paintComputer, 0.598, 0.336, MON_X - 0.021, MON_Y, 0, -Math.PI / 2);

  // PC: a compact micro-ATX tower with black mesh panels and a wood strip
  // across the front, after the Lian Li A3-mATX (443 x 194 x 322 mm).
  const meshCanvas = document.createElement('canvas');
  meshCanvas.width = 4;
  meshCanvas.height = 4;
  const meshCtx = meshCanvas.getContext('2d')!;
  meshCtx.fillStyle = '#0b0d18';
  meshCtx.fillRect(0, 0, 4, 4);
  meshCtx.fillStyle = '#3a4048';
  meshCtx.fillRect(0, 0, 2, 2);
  meshCtx.fillRect(2, 2, 2, 2);
  const meshTexture = new THREE.CanvasTexture(meshCanvas);
  meshTexture.colorSpace = THREE.SRGBColorSpace;
  meshTexture.wrapS = meshTexture.wrapT = THREE.RepeatWrapping;
  meshTexture.magFilter = THREE.NearestFilter;
  meshTexture.repeat.set(14, 10);
  const meshMat = new THREE.MeshLambertMaterial({ map: meshTexture });
  disposables.push(meshTexture, meshMat);

  const CASE = { l: 0.443, h: 0.322, w: 0.194 };
  const CASE_X = eastX - 0.4;
  const CASE_Z = 0.74;
  const CASE_Y = DESK_TOP + 0.014 + CASE.h / 2;
  const caseFront = CASE_X - CASE.l / 2;
  box(black, CASE.l, CASE.h, CASE.w, CASE_X, CASE_Y, CASE_Z); // frame
  box(meshMat, 0.006, CASE.h - 0.09, CASE.w - 0.02, caseFront - 0.002, CASE_Y + 0.035, CASE_Z); // front mesh
  box(lambert('#a8744a'), 0.012, 0.06, CASE.w, caseFront - 0.005, CASE_Y - CASE.h / 2 + 0.045, CASE_Z); // wood strip
  box(meshMat, CASE.l - 0.03, CASE.h - 0.03, 0.006, CASE_X, CASE_Y, CASE_Z - CASE.w / 2 - 0.002); // side
  box(meshMat, CASE.l - 0.03, CASE.h - 0.03, 0.006, CASE_X, CASE_Y, CASE_Z + CASE.w / 2 + 0.002); // side
  box(meshMat, CASE.l - 0.03, 0.006, CASE.w - 0.02, CASE_X, CASE_Y + CASE.h / 2 + 0.002, CASE_Z); // top
  box(glow('#f3f7e4'), 0.012, 0.006, 0.012, caseFront + 0.03, CASE_Y + CASE.h / 2 + 0.006, CASE_Z + 0.06); // power light
  for (const dx of [-0.18, 0.18]) {
    for (const dz of [-0.07, 0.07]) {
      box(greyDark, 0.03, 0.014, 0.03, CASE_X + dx, DESK_TOP + 0.007, CASE_Z + dz); // feet
    }
  }
  const pcLight = new THREE.PointLight('#3a8fa0', 0, 0, 1.8);
  pcLight.position.set(eastX - 0.9, 1.25, 0);
  add(pcLight);
  end();

  // Audio interface: a small red box with a black face, two gain knobs with
  // green rings and one large volume knob (Focusrite Scarlett 2i2, 3rd Gen).
  begin('interface');
  const IF_X = eastX - 0.62;
  const IF_Z = -0.52;
  const IF_Y = DESK_TOP + 0.024;
  const ifFront = IF_X - 0.05;
  box(lambert('#b8405a'), 0.099, 0.0475, 0.175, IF_X, IF_Y, IF_Z);
  box(black, 0.004, 0.044, 0.171, ifFront - 0.002, IF_Y, IF_Z);
  for (const dz of [-0.05, -0.012]) {
    box(glow('#94a348'), 0.003, 0.026, 0.026, ifFront - 0.005, IF_Y, IF_Z + dz); // gain ring
    box(greyDark, 0.012, 0.016, 0.016, ifFront - 0.01, IF_Y, IF_Z + dz); // gain knob
  }
  box(lambert('#a4adb8'), 0.014, 0.032, 0.032, ifFront - 0.01, IF_Y, IF_Z + 0.052); // volume knob
  end();

  // Boom arm clamped to the back of the desk, holding a broadcast
  // microphone with a foam windscreen (Shure SM7B).
  begin('microphone');
  const armBase = new THREE.Vector3(eastX - 0.12, DESK_TOP + 0.03, -0.96);
  const armElbow = new THREE.Vector3(eastX - 0.26, DESK_TOP + 0.6, -0.9);
  const armTip = new THREE.Vector3(eastX - 0.62, DESK_TOP + 0.5, -0.46);
  box(greyDark, 0.06, 0.07, 0.06, armBase.x, DESK_TOP + 0.02, armBase.z); // clamp
  beam(black, 0.025, armBase, armElbow);
  beam(black, 0.025, armElbow, armTip);
  box(greyDark, 0.04, 0.04, 0.04, armElbow.x, armElbow.y, armElbow.z); // elbow joint
  const MIC_Y = armTip.y - 0.1;
  box(greyDark, 0.016, 0.1, 0.016, armTip.x, armTip.y - 0.05, armTip.z); // drop post
  box(greyDark, 0.035, 0.012, 0.09, armTip.x, MIC_Y + 0.04, armTip.z); // yoke top
  box(greyDark, 0.035, 0.07, 0.006, armTip.x, MIC_Y + 0.006, armTip.z - 0.042); // yoke sides
  box(greyDark, 0.035, 0.07, 0.006, armTip.x, MIC_Y + 0.006, armTip.z + 0.042);
  rod(greyDark, 0.03, 0.11, armTip.x + 0.01, MIC_Y, armTip.z); // mic body
  rod(lambert('#1a1e10'), 0.037, 0.1, armTip.x - 0.095, MIC_Y, armTip.z); // windscreen
  end();

  /* --------------------- south: door, arcade, toolbox -------------------- */

  const southZ = HALF_D;
  const DOOR_X = -2.2;
  begin('door');
  box(trimMat, 1.06, 2.14, 0.06, DOOR_X, 1.07, southZ - 0.03); // frame
  box(woodMat, 0.9, 2.04, 0.05, DOOR_X, 1.02, southZ - 0.07);
  const panelMat = lambert('#a8744a');
  box(panelMat, 0.62, 0.72, 0.02, DOOR_X, 1.5, southZ - 0.1);
  box(panelMat, 0.62, 0.8, 0.02, DOOR_X, 0.56, southZ - 0.1);
  box(lambert('#d4a56a'), 0.06, 0.06, 0.06, DOOR_X + 0.34, 1.0, southZ - 0.12); // knob
  // Light from the hallway under the door.
  const doorGlow = box(glow('#f0d9a0'), 0.86, 0.015, 0.02, DOOR_X, 0.008, southZ - 0.1);
  const doorLight = new THREE.PointLight('#f0d9a0', 0, 0, 2);
  doorLight.position.set(DOOR_X, 0.12, southZ - 0.35);
  add(doorLight);
  end();

  const ARC_X = 0.6;
  begin('arcade');
  box(lambert('#1f2350'), 0.76, 1.8, 0.7, ARC_X, 0.9, southZ - 0.37);
  box(lambert('#141833'), 0.8, 0.1, 0.74, ARC_X, 0.05, southZ - 0.37); // kick plate
  box(lambert('#4a3a8c'), 0.8, 0.08, 0.3, ARC_X, 0.92, southZ - 0.8); // control panel
  box(lambert('#0b0d18'), 0.62, 0.52, 0.03, ARC_X, 1.3, southZ - 0.735); // bezel
  screen(ARCADE_SIZE, paintArcade, 0.54, 0.42, ARC_X, 1.3, southZ - 0.755, Math.PI);
  box(glow('#b8405a'), 0.66, 0.16, 0.03, ARC_X, 1.68, southZ - 0.735); // marquee
  box(glow('#f0d9a0'), 0.4, 0.05, 0.01, ARC_X, 1.68, southZ - 0.755);
  box(greyDark, 0.02, 0.09, 0.02, ARC_X + 0.2, 1.0, southZ - 0.84); // joystick
  box(lambert('#b8405a'), 0.05, 0.05, 0.05, ARC_X + 0.2, 1.06, southZ - 0.84);
  box(lambert('#f07a5a'), 0.05, 0.02, 0.05, ARC_X - 0.08, 0.97, southZ - 0.84);
  box(lambert('#94a348'), 0.05, 0.02, 0.05, ARC_X - 0.2, 0.97, southZ - 0.84);
  box(glow('#f07a5a'), 0.04, 0.08, 0.01, ARC_X, 0.5, southZ - 0.725); // coin slot
  const arcadeLight = new THREE.PointLight('#5a8fc0', 0, 0, 1.8);
  arcadeLight.position.set(ARC_X, 1.35, southZ - 1.2);
  add(arcadeLight);
  end();

  const TB_X = 2.3;
  const TB_Z = southZ - 0.6;
  begin('toolbox');
  box(lambert('#b8405a'), 0.6, 0.26, 0.3, TB_X, 0.13, TB_Z);
  box(lambert('#f07a5a'), 0.62, 0.05, 0.32, TB_X, 0.27, TB_Z); // lid
  box(lambert('#d4a56a'), 0.07, 0.07, 0.02, TB_X, 0.2, TB_Z - 0.16); // latch
  box(greyDark, 0.03, 0.1, 0.03, TB_X - 0.12, 0.34, TB_Z);
  box(greyDark, 0.03, 0.1, 0.03, TB_X + 0.12, 0.34, TB_Z);
  box(greyDark, 0.27, 0.03, 0.03, TB_X, 0.39, TB_Z); // handle
  end();

  /* ----------------------- west: cinema, headphones ---------------------- */

  const westX = -HALF_W;
  begin('cinema');
  box(lambert('#0b0d18'), 0.05, 1.76, 3.36, westX + 0.025, 1.7, 0); // frame
  const cinemaMat = new THREE.MeshLambertMaterial({ color: '#f3f7e4', emissive: '#a4adb8', emissiveIntensity: 0 });
  disposables.push(cinemaMat);
  box(cinemaMat, 0.02, 1.6, 3.2, westX + 0.06, 1.7, 0);
  end();

  const HP_Z = 2.1;
  const HP_Y = 1.45;
  begin('headphones');
  box(greyMid, 0.1, 0.03, 0.03, westX + 0.05, HP_Y + 0.16, HP_Z); // hook
  const bandGeometry = new THREE.TorusGeometry(0.13, 0.018, 6, 12, Math.PI);
  disposables.push(bandGeometry);
  const band = new THREE.Mesh(bandGeometry, lambert('#1a1e10'));
  band.position.set(westX + 0.09, HP_Y + 0.02, HP_Z);
  band.rotation.y = Math.PI / 2;
  add(band);
  box(greyDark, 0.09, 0.2, 0.07, westX + 0.09, HP_Y - 0.06, HP_Z - 0.14);
  box(greyDark, 0.09, 0.2, 0.07, westX + 0.09, HP_Y - 0.06, HP_Z + 0.14);
  box(lambert('#b8405a'), 0.07, 0.16, 0.02, westX + 0.09, HP_Y - 0.06, HP_Z - 0.1);
  box(lambert('#b8405a'), 0.07, 0.16, 0.02, westX + 0.09, HP_Y - 0.06, HP_Z + 0.1);
  const headphoneLed = box(glow('#7fd4d8'), 0.02, 0.02, 0.02, westX + 0.14, HP_Y - 0.13, HP_Z + 0.16);
  end();

  /* ------------------------ furniture and clutter ------------------------ */

  const props = addProps({
    scene,
    lambert,
    glow,
    box,
    beam,
    rod,
    disc,
    track: (d) => disposables.push(d),
    begin,
    end,
    add,
  });

  /* -------------------------------- lights ------------------------------- */

  // Most of the room's light comes from the screens (walls.light).
  const ambient = new THREE.AmbientLight('#ffffff', config.light.ambient);
  scene.add(ambient);

  const fog = new THREE.FogExp2(config.light.fogColor, 0);
  scene.fog = fog;
  scene.background = new THREE.Color('#05060a');

  /* ------------------------------ placing things ------------------------------ */

  const placed = new Map<string, Placed>();
  const loading: Promise<unknown>[] = [];

  const attachModel = (target: THREE.Object3D, m: ModelCfg, onDone: () => void, hide?: THREE.Object3D) => {
    const url = resolve(m.src);
    if (!url) return;
    loading.push(
      loadModel(url)
        .then((model) => {
          if (disposed) return;
          target.add(
            placeModel(model, { fitHeight: m.fitHeight, scale: m.scale, x: m.x, y: m.y, z: m.z, rotY: m.rotY }),
          );
          if (hide && m.hideBuiltIn) hide.visible = false;
          onDone();
        })
        .catch((err) => console.warn('Could not load the model', m.src, err)),
    );
  };

  // Layout work is batched, so several models arriving at once only cost one pass.
  let layoutQueued = false;
  const scheduleLayout = () => {
    if (layoutQueued) return;
    layoutQueued = true;
    queueMicrotask(() => {
      layoutQueued = false;
      if (!disposed) refreshLayout();
    });
  };

  for (const def of OBJECTS) {
    const content = groups.get(def.id);
    if (!content) continue;
    const oc = effectiveObject(config, def.id);

    // Wrap it so it turns and scales about its own bottom centre, not the room's centre.
    const designBox = visibleBox(content);
    const pivot = designBox ? designBox.getCenter(new THREE.Vector3()).setY(designBox.min.y) : new THREE.Vector3();
    const holder = new THREE.Group();
    content.position.set(-pivot.x, -pivot.y, -pivot.z);
    holder.add(content);
    const { dx, dz } = anchorShift(def.anchor, W, D);
    holder.position.set(pivot.x + dx + oc.x, pivot.y + oc.y, pivot.z + dz + oc.z);
    holder.rotation.y = THREE.MathUtils.degToRad(oc.rotY);
    holder.scale.setScalar(oc.scale);
    holder.visible = oc.visible;
    scene.add(holder);

    placed.set(def.id, {
      id: def.id,
      label: def.label,
      anchor: def.anchor,
      solid: def.solid,
      interactiveByDefault: def.hotspot !== undefined,
      defaultAction: def.hotspot?.action,
      defaultWorld: def.hotspot?.world,
      holder,
      content,
    });
    if (oc.model?.src) attachModel(holder, oc.model, scheduleLayout, content);
  }

  // Things you added yourself.
  for (const extra of config.extras) {
    const holder = new THREE.Group();
    holder.position.set(extra.x, extra.y, extra.z);
    holder.rotation.y = THREE.MathUtils.degToRad(extra.rotY);
    holder.visible = extra.visible;
    scene.add(holder);
    placed.set(extra.id, {
      id: extra.id,
      label: extra.label,
      anchor: 'none',
      solid: extra.solid,
      interactiveByDefault: true,
      holder,
    });
    buildExtra(extra, holder);
  }

  function buildExtra(extra: ExtraCfg, holder: THREE.Group) {
    const url = resolve(extra.src);
    if (extra.kind === 'model') {
      attachModel(
        holder,
        { src: extra.src, fitHeight: extra.fitHeight, scale: extra.scale, x: 0, y: 0, z: 0, rotY: 0, hideBuiltIn: false },
        scheduleLayout,
      );
      return;
    }
    // A picture: a flat plane, grey until the picture has loaded.
    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.MeshBasicMaterial({ color: '#6b7480', side: THREE.DoubleSide });
    disposables.push(geometry, material);
    const mesh = new THREE.Mesh(geometry, material);
    const size = extra.width * extra.scale;
    mesh.scale.set(size, size, 1);
    holder.add(mesh);
    if (!url) return;
    loading.push(
      new Promise<void>((done) => {
        new THREE.TextureLoader().load(
          url,
          (texture) => {
            if (disposed) return done();
            texture.colorSpace = THREE.SRGBColorSpace;
            disposables.push(texture);
            material.map = texture;
            material.color.set('#ffffff');
            material.needsUpdate = true;
            const img = texture.image as { width: number; height: number };
            mesh.scale.set(size, size * (img.height / img.width), 1);
            scheduleLayout();
            done();
          },
          undefined,
          () => done(),
        );
      }),
    );
  }

  /* ------------------------------ what you can click ------------------------------ */

  const bounds = {
    minX: -(halfW - config.room.wallMargin),
    maxX: halfW - config.room.wallMargin,
    minZ: -(halfD - config.room.wallMargin),
    maxZ: halfD - config.room.wallMargin,
  };

  const layout: Layout = {
    revision: 0,
    hotspots: [],
    obstacles: [],
    navigator: createNavigator([], bounds, config.room.bodyRadius),
    bounds,
  };

  const hitGroup = new THREE.Group();
  const outlineGroup = new THREE.Group();
  scene.add(hitGroup, outlineGroup);
  const hitMaterial = new THREE.MeshBasicMaterial({ visible: false });
  const hoverOutline = new THREE.LineBasicMaterial({ color: '#f3f7e4', fog: false });
  const selectedOutline = new THREE.LineBasicMaterial({ color: '#94a348', fog: false });
  disposables.push(hitMaterial, hoverOutline, selectedOutline);

  const highlight = { hover: null as string | null, selected: null as string | null };
  const applyHighlight = () => {
    for (const outline of outlineGroup.children as THREE.LineSegments[]) {
      const id = outline.userData.hotspotId as string;
      const isSelected = id === highlight.selected;
      outline.visible = isSelected || id === highlight.hover;
      outline.material = isSelected ? selectedOutline : hoverOutline;
    }
  };

  /** Direction from an object towards where you stand to look at it. */
  const approach = (anchor: Anchor, cx: number, cz: number): [number, number] => {
    switch (anchor) {
      case 'north':
        return [0, 1];
      case 'south':
        return [0, -1];
      case 'east':
        return [-1, 0];
      case 'west':
        return [1, 0];
      default: {
        const len = Math.hypot(cx, cz);
        return len < 0.3 ? [0, 1] : [-cx / len, -cz / len];
      }
    }
  };

  function refreshLayout() {
    scene.updateMatrixWorld(true);

    // What you walk around.
    const obstacles: Layout['obstacles'] = [];
    const boxes = new Map<string, THREE.Box3>();
    for (const p of placed.values()) {
      if (!p.holder.visible) continue;
      const b = visibleBox(p.holder);
      if (!b) continue;
      boxes.set(p.id, b);
      // Only things that reach the floor block the way.
      if (p.solid && b.min.y < 0.7) obstacles.push([b.min.x, b.max.x, b.min.z, b.max.z]);
    }
    const navigator = createNavigator(obstacles, bounds, config.room.bodyRadius);

    // What you can click.
    const hotspots: RuntimeHotspot[] = [];
    for (const p of placed.values()) {
      const b = boxes.get(p.id);
      if (!b) continue;
      const hc = effectiveHotspot(config, p.id);
      const interactive = config.hotspots[p.id]?.interactive ?? p.interactiveByDefault;
      if (!interactive && !options.editor) continue;

      const action: HotspotAction = !interactive
        ? { type: 'select' }
        : (p.defaultAction ?? { type: 'inspect', line: '' });
      const line = hc.line || (action.type === 'inspect' ? action.line : '');
      const size = b.getSize(new THREE.Vector3());
      const center = b.getCenter(new THREE.Vector3());

      const [ax, az] = approach(p.anchor, center.x, center.z);
      const along = Math.abs(ax) > 0 ? size.x : size.z;
      const auto = Math.min(2.2, Math.max(1.0, 0.5 * along + 0.55 * Math.max(size.x, size.y, size.z) + 0.55));
      const distance = hc.standDistance > 0 ? hc.standDistance : auto;
      const stand = navigator.clamp({ x: center.x + ax * distance, z: center.z + az * distance });

      hotspots.push({
        id: p.id,
        label: hc.label || p.label,
        center: [center.x, center.y, center.z],
        size: [Math.max(0.28, size.x + 0.06), Math.max(0.28, size.y + 0.06), Math.max(0.28, size.z + 0.06)],
        stand: [stand.x, stand.z],
        action: action.type === 'inspect' ? { type: 'inspect', line } : action,
        world: hc.background?.src ? itemWorldId(p.id) : hc.world || p.defaultWorld || '',
        card: hc.card,
      });
    }

    // Rebuild the invisible click boxes and their outlines.
    for (const group of [hitGroup, outlineGroup]) {
      for (const child of [...group.children]) {
        group.remove(child);
        const m = child as THREE.Mesh;
        m.geometry?.dispose();
      }
    }
    for (const h of hotspots) {
      const geometry = new THREE.BoxGeometry(...h.size);
      const volume = new THREE.Mesh(geometry, hitMaterial);
      volume.position.set(...h.center);
      volume.userData.hotspotId = h.id;
      hitGroup.add(volume);

      const outline = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), hoverOutline);
      outline.position.copy(volume.position);
      outline.userData.hotspotId = h.id;
      outline.visible = false;
      outlineGroup.add(outline);
    }
    applyHighlight();

    layout.obstacles = obstacles;
    layout.navigator = navigator;
    layout.hotspots = hotspots;
    layout.revision++;
  }
  refreshLayout();

  const ready = Promise.allSettled(loading).then(() => {
    if (!disposed) refreshLayout();
  });

  /* -------------------------------- state -------------------------------- */

  const lt = config.light;
  const setState = (lit: boolean, world: string, instant = false) => {
    walls.show(lit ? world : darkWorld, instant);
    const accent = lit ? lt.accentLit : lt.accentDark;
    pcLight.intensity = (lit ? 0.3 : 1.4) * accent;
    arcadeLight.intensity = (lit ? 0.3 : 1.2) * accent;
    doorLight.intensity = (lit ? 0 : 0.5) * accent;
    fog.density = lit ? 0 : lt.fogDark;
    cinemaMat.emissiveIntensity = lit ? 0 : 0.12;
    switchNub.position.y = SWITCH_Y + (lit ? 0.03 : -0.03);
    switchLed.visible = !lit;
    doorGlow.visible = !lit;
    headphoneLed.visible = !lit;
    props.setLit(lit);
  };
  setState(false, darkWorld, true);

  let lastScreens = -1;

  return {
    scene,
    floor,
    hitGroup,
    layout,
    ready,
    setState,
    busy: () => walls.busy(),
    setHighlight(hover, selected = null) {
      highlight.hover = hover;
      highlight.selected = selected;
      applyHighlight();
    },
    update(t, dt, reducedMotion) {
      walls.update(t, dt, reducedMotion);
      props.update(t, reducedMotion);
      // The small screens only need redrawing a few times a second.
      if (t - lastScreens < 0.12) return;
      lastScreens = t;
      for (const s of screens) {
        s.paint(s.ctx, reducedMotion ? 0 : t);
        s.texture.needsUpdate = true;
      }
    },
    dispose() {
      disposed = true;
      disposables.forEach((d) => d.dispose());
      for (const child of [...hitGroup.children, ...outlineGroup.children]) (child as THREE.Mesh).geometry?.dispose();
      walls.dispose();
    },
  };
}
