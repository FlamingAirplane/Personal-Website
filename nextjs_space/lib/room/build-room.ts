// Builds the 3D room out of simple boxes. The furniture is placeholder
// geometry until real art exists; the walls are screens (wall-screens.ts).

import * as THREE from 'three';
import type { WorldId } from './environments';
import { RS } from './room-settings';
import { addProps } from './props';
import { HOTSPOTS, ROOM } from './room-data';
import { ARCADE_SIZE, PC_SIZE, paintArcade, paintComputer } from './screens';
import { createWallScreens } from './wall-screens';

export interface Room {
  scene: THREE.Scene;
  /** Clicking this means "walk here". */
  floor: THREE.Mesh;
  /** Invisible boxes around each hotspot; userData.hotspotId names it. */
  hitVolumes: THREE.Mesh[];
  /**
   * Lights off: the walls show the dark nebula. Lights on: they show `world`.
   * `instant` skips the glitchy switch-over.
   */
  setState(lit: boolean, world: WorldId, instant?: boolean): void;
  /** True while something needs every frame drawn (the walls switching place). */
  busy(): boolean;
  /** The big TV on the west wall. */
  tv: {
    /** Off shows a dark screen. On shows `video`, or the standby picture while there is none. */
    setPower(on: boolean): void;
    setVideo(video: HTMLVideoElement | null): void;
    /** What the standby picture says (for videos playing outside the 3D screen). */
    setStandby(text: string): void;
  };
  /** Outline one hotspot (or none). */
  setHighlight(id: string | null): void;
  /** Advance everything that moves. `t` and `dt` are in seconds. */
  update(t: number, dt: number, reducedMotion: boolean): void;
  dispose(): void;
}

const HALF_W = ROOM.width / 2;
const HALF_D = ROOM.depth / 2;

export function buildRoom(): Room {
  const scene = new THREE.Scene();
  const disposables: { dispose(): void }[] = [];

  // One material per colour, shared by every box of that colour.
  const swap = (color: string) => RS.colorOverrides[color.toLowerCase()] || color;
  const lambertCache = new Map<string, THREE.MeshLambertMaterial>();
  const lambert = (original: string) => {
    const color = swap(original);
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
  const glow = (original: string) => {
    const color = swap(original);
    let m = glowCache.get(color);
    if (!m) {
      m = new THREE.MeshBasicMaterial({ color, fog: false });
      glowCache.set(color, m);
      disposables.push(m);
    }
    return m;
  };

  /** A box centred at (x, y, z). */
  const box = (
    material: THREE.Material,
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    parent: THREE.Object3D = scene,
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
    parent: THREE.Object3D = scene,
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
    scene.add(mesh);
    return mesh;
  };

  /** A flat screen showing a small 2D drawing that is redrawn over time. */
  const screens: { ctx: CanvasRenderingContext2D; texture: THREE.CanvasTexture; paint: (ctx: CanvasRenderingContext2D, t: number) => void }[] = [];
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
    scene.add(mesh);
    screens.push({ ctx, texture, paint });
    return mesh;
  };

  /* ------------------------------ the shell ------------------------------ */

  const trimMat = lambert(RS.colorTrim);
  const woodMat = lambert(RS.colorWood);
  const bezelMat = lambert(RS.colorBezel);

  const floor = box(lambert(RS.colorFloor), ROOM.width, 0.1, ROOM.depth, 0, -0.05, 0);
  // Floorboard seams.
  for (let x = -HALF_W + 0.5; x < HALF_W; x += 0.5) {
    box(trimMat, 0.02, 0.004, ROOM.depth, x, 0.002, 0);
  }
  box(lambert(RS.colorCeiling), ROOM.width, 0.1, ROOM.depth, 0, ROOM.height + 0.05, 0); // ceiling

  // The four walls are screens (see wall-screens.ts).
  const walls = createWallScreens(RS.darkWorld);
  scene.add(walls.group, walls.light);

  // Bezels where the screens meet the floor and ceiling.
  for (const y of [0.04, ROOM.height - 0.04]) {
    box(bezelMat, ROOM.width, 0.08, 0.03, 0, y, -HALF_D + 0.015);
    box(bezelMat, ROOM.width, 0.08, 0.03, 0, y, HALF_D - 0.015);
    box(bezelMat, 0.03, 0.08, ROOM.depth, HALF_W - 0.015, y, 0);
    box(bezelMat, 0.03, 0.08, ROOM.depth, -HALF_W + 0.015, y, 0);
  }

  /* ----------------------------- north: switch ---------------------------- */

  const northZ = -HALF_D;
  const SWITCH_X = 2.3;
  const SWITCH_Y = 1.35;
  box(lambert('#f3f7e4'), 0.12, 0.18, 0.02, SWITCH_X, SWITCH_Y, northZ + 0.01);
  const switchNub = box(lambert('#6b7480'), 0.04, 0.06, 0.03, SWITCH_X, SWITCH_Y - 0.03, northZ + 0.03);
  // A small light so the switch can be found in the dark.
  const switchLed = box(glow('#f07a5a'), 0.045, 0.045, 0.02, SWITCH_X, SWITCH_Y + 0.14, northZ + 0.02);

  /* ------------------------- east: desk, computer ------------------------ */

  const eastX = HALF_W;
  box(woodMat, 0.85, 0.06, 2.2, eastX - 0.45, 0.75, 0);
  box(trimMat, 0.07, 0.72, 0.07, eastX - 0.82, 0.36, -1.03);
  box(trimMat, 0.07, 0.72, 0.07, eastX - 0.82, 0.36, 1.03);
  box(trimMat, 0.07, 0.72, 0.07, eastX - 0.08, 0.36, -1.03);
  box(trimMat, 0.07, 0.72, 0.07, eastX - 0.08, 0.36, 1.03);

  const greyDark = lambert('#3a4048');
  const greyMid = lambert('#6b7480');
  const black = lambert('#0b0d18');
  const DESK_TOP = ROOM.deskTop;

  // 27-inch monitor (16:9, 598 x 336 mm picture).
  const MON_X = eastX - 0.3;
  const MON_Y = DESK_TOP + 0.31;
  box(greyDark, 0.2, 0.02, 0.26, MON_X + 0.02, DESK_TOP + 0.01, 0); // base
  box(greyDark, 0.04, 0.16, 0.06, MON_X + 0.03, DESK_TOP + 0.09, 0); // neck
  box(black, 0.04, 0.365, 0.615, MON_X, MON_Y, 0);
  screen(PC_SIZE, paintComputer, 0.598, 0.336, MON_X - 0.021, MON_Y, 0, -Math.PI / 2);
  box(lambert('#a4adb8'), 0.14, 0.02, 0.44, eastX - 0.66, DESK_TOP + 0.01, 0.02); // keyboard
  box(greyDark, 0.1, 0.03, 0.06, eastX - 0.66, DESK_TOP + 0.015, 0.36); // mouse

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

  // Audio interface: a small red box with a black face, two gain knobs with
  // green rings and one large volume knob (Focusrite Scarlett 2i2, 3rd Gen).
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

  // Boom arm clamped to the back of the desk, holding a broadcast
  // microphone with a foam windscreen (Shure SM7B).
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

  /* --------------------- south: door, arcade, toolbox -------------------- */

  const southZ = HALF_D;
  const DOOR_X = -2.2;
  box(trimMat, 1.06, 2.14, 0.06, DOOR_X, 1.07, southZ - 0.03); // frame
  box(woodMat, 0.9, 2.04, 0.05, DOOR_X, 1.02, southZ - 0.07);
  const panelMat = lambert('#a8744a');
  box(panelMat, 0.62, 0.72, 0.02, DOOR_X, 1.5, southZ - 0.1);
  box(panelMat, 0.62, 0.8, 0.02, DOOR_X, 0.56, southZ - 0.1);
  box(lambert('#d4a56a'), 0.06, 0.06, 0.06, DOOR_X + 0.34, 1.0, southZ - 0.12); // knob
  // Light from the hallway under the door.
  const doorGlow = box(glow('#f0d9a0'), 0.86, 0.015, 0.02, DOOR_X, 0.008, southZ - 0.1);

  const ARC_X = 0.6;
  const cabinet = lambert('#1f2350');
  const cabinetDark = lambert('#141833');
  box(cabinet, 0.76, 1.8, 0.7, ARC_X, 0.9, southZ - 0.37);
  box(cabinetDark, 0.8, 0.1, 0.74, ARC_X, 0.05, southZ - 0.37); // kick plate
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

  const TB_X = 2.3;
  const TB_Z = southZ - 0.6;
  box(lambert('#b8405a'), 0.6, 0.26, 0.3, TB_X, 0.13, TB_Z);
  box(lambert('#f07a5a'), 0.62, 0.05, 0.32, TB_X, 0.27, TB_Z); // lid
  box(lambert('#d4a56a'), 0.07, 0.07, 0.02, TB_X, 0.2, TB_Z - 0.16); // latch
  box(greyDark, 0.03, 0.1, 0.03, TB_X - 0.12, 0.34, TB_Z);
  box(greyDark, 0.03, 0.1, 0.03, TB_X + 0.12, 0.34, TB_Z);
  box(greyDark, 0.27, 0.03, 0.03, TB_X, 0.39, TB_Z); // handle

  /* ------------------------- west: big TV, headphones ------------------------- */

  const westX = -HALF_W;
  const TV_W = RS.tvWidth;
  const TV_H = TV_W * (9 / 16);
  const TV_Y = RS.tvHeight;
  box(lambert('#0b0d18'), 0.03, 0.3, 0.4, westX + 0.015, TV_Y, 0); // wall mount
  box(bezelMat, 0.06, TV_H + 0.06, TV_W + 0.06, westX + 0.06, TV_Y, 0); // body
  const tvLed = box(glow('#b8405a'), 0.01, 0.012, 0.03, westX + 0.095, TV_Y - TV_H / 2 - 0.012, TV_W / 2 - 0.05);

  // The standby picture: shown when the TV is on but nothing plays on it.
  const standbyCanvas = document.createElement('canvas');
  standbyCanvas.width = 320;
  standbyCanvas.height = 180;
  const standbyCtx = standbyCanvas.getContext('2d') as CanvasRenderingContext2D;
  const standbyTexture = new THREE.CanvasTexture(standbyCanvas);
  standbyTexture.colorSpace = THREE.SRGBColorSpace;
  disposables.push(standbyTexture);
  const paintStandby = (text: string) => {
    const g = standbyCtx.createLinearGradient(0, 0, 320, 180);
    g.addColorStop(0, '#1f2350');
    g.addColorStop(1, '#4a3a8c');
    standbyCtx.fillStyle = g;
    standbyCtx.fillRect(0, 0, 320, 180);
    standbyCtx.fillStyle = '#f3f7e4';
    standbyCtx.font = 'bold 22px monospace';
    standbyCtx.textAlign = 'center';
    standbyCtx.fillText(text, 160, 98);
    standbyTexture.needsUpdate = true;
  };
  paintStandby(RS.tvStandbyText);

  const tvScreenMat = new THREE.MeshBasicMaterial({ color: '#05060a', toneMapped: false });
  disposables.push(tvScreenMat);
  const tvScreenGeometry = new THREE.PlaneGeometry(TV_W, TV_H);
  disposables.push(tvScreenGeometry);
  const tvScreen = new THREE.Mesh(tvScreenGeometry, tvScreenMat);
  tvScreen.position.set(westX + 0.092, TV_Y, 0);
  tvScreen.rotation.y = Math.PI / 2;
  scene.add(tvScreen);
  const tvLight = new THREE.PointLight('#8fb0e0', 0, 0, 1.8);
  tvLight.position.set(westX + 0.9, TV_Y, 0);
  scene.add(tvLight);

  let tvOn = false;
  let tvVideo: HTMLVideoElement | null = null;
  let videoTexture: THREE.VideoTexture | null = null;
  const showTv = () => {
    tvLed.visible = !tvOn;
    tvLight.intensity = tvOn ? RS.tvLight : 0;
    if (!tvOn) {
      tvScreenMat.map = null;
      tvScreenMat.color.set('#05060a');
    } else {
      tvScreenMat.map = videoTexture ?? standbyTexture;
      tvScreenMat.color.set('#ffffff');
    }
    tvScreenMat.needsUpdate = true;
  };

  /* -------------------------------- remote -------------------------------- */

  box(lambert('#1a1e10'), 0.18, 0.025, 0.055, -1.75, 0.643, 0.77); // on the couch arm
  box(glow('#b8405a'), 0.025, 0.006, 0.025, -1.69, 0.657, 0.77); // power button
  for (const dx of [-0.02, -0.05, -0.08]) box(lambert('#6b7480'), 0.015, 0.005, 0.03, -1.75 + dx, 0.657, 0.77);

  const HP_Z = 2.1;
  const HP_Y = 1.45;
  box(greyMid, 0.1, 0.03, 0.03, westX + 0.05, HP_Y + 0.16, HP_Z); // hook
  const bandGeometry = new THREE.TorusGeometry(0.13, 0.018, 6, 12, Math.PI);
  disposables.push(bandGeometry);
  const band = new THREE.Mesh(bandGeometry, lambert('#1a1e10'));
  band.position.set(westX + 0.09, HP_Y + 0.02, HP_Z);
  band.rotation.y = Math.PI / 2;
  scene.add(band);
  box(greyDark, 0.09, 0.2, 0.07, westX + 0.09, HP_Y - 0.06, HP_Z - 0.14);
  box(greyDark, 0.09, 0.2, 0.07, westX + 0.09, HP_Y - 0.06, HP_Z + 0.14);
  box(lambert('#b8405a'), 0.07, 0.16, 0.02, westX + 0.09, HP_Y - 0.06, HP_Z - 0.1);
  box(lambert('#b8405a'), 0.07, 0.16, 0.02, westX + 0.09, HP_Y - 0.06, HP_Z + 0.1);
  const headphoneLed = box(glow('#7fd4d8'), 0.02, 0.02, 0.02, westX + 0.14, HP_Y - 0.13, HP_Z + 0.16);

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
  });

  /* -------------------------------- lights ------------------------------- */

  // Most of the room's light comes from the wall screens (walls.light).
  const ambient = new THREE.AmbientLight(RS.ambientColor, RS.ambientLight);
  const pcLight = new THREE.PointLight('#3a8fa0', 0, 0, 1.8);
  pcLight.position.set(eastX - 0.9, 1.25, 0);
  const arcadeLight = new THREE.PointLight('#5a8fc0', 0, 0, 1.8);
  arcadeLight.position.set(ARC_X, 1.35, southZ - 1.2);
  const doorLight = new THREE.PointLight('#f0d9a0', 0, 0, 2);
  doorLight.position.set(DOOR_X, 0.12, southZ - 0.35);
  scene.add(ambient, pcLight, arcadeLight, doorLight);

  const fog = new THREE.FogExp2(RS.fogColor, 0);
  scene.fog = fog;
  scene.background = new THREE.Color('#05060a');

  /* ------------------------------- hotspots ------------------------------ */

  const hitMaterial = new THREE.MeshBasicMaterial({ visible: false });
  const outlineMaterial = new THREE.LineBasicMaterial({ color: '#f3f7e4', fog: false });
  disposables.push(hitMaterial, outlineMaterial);

  const outlines = new Map<string, THREE.LineSegments>();
  const hitVolumes = HOTSPOTS.map((spot) => {
    const geometry = new THREE.BoxGeometry(...spot.size);
    const edges = new THREE.EdgesGeometry(geometry);
    disposables.push(geometry, edges);

    const volume = new THREE.Mesh(geometry, hitMaterial);
    volume.position.set(...spot.center);
    volume.userData.hotspotId = spot.id;
    scene.add(volume);

    const outline = new THREE.LineSegments(edges, outlineMaterial);
    outline.position.copy(volume.position);
    outline.visible = false;
    scene.add(outline);
    outlines.set(spot.id, outline);

    return volume;
  });

  /* -------------------------------- state -------------------------------- */

  const setState = (lit: boolean, world: WorldId, instant = false) => {
    walls.show(lit ? world : RS.darkWorld, instant);
    pcLight.intensity = lit ? RS.computerLightOn : RS.computerLightOff;
    arcadeLight.intensity = lit ? RS.arcadeLightOn : RS.arcadeLightOff;
    doorLight.intensity = lit ? 0 : RS.doorLightOff;
    fog.density = lit ? 0 : RS.darkFog;
    switchNub.position.y = SWITCH_Y + (lit ? 0.03 : -0.03);
    switchLed.visible = !lit;
    doorGlow.visible = !lit;
    headphoneLed.visible = !lit;
    props.setLit(lit);
  };
  setState(false, RS.darkWorld, true);
  showTv();

  let lastScreens = -1;

  return {
    scene,
    floor,
    hitVolumes,
    setState,
    busy: () => walls.busy() || (tvOn && tvVideo !== null && !tvVideo.paused),
    tv: {
      setPower(on) {
        tvOn = on;
        showTv();
      },
      setVideo(video) {
        videoTexture?.dispose();
        videoTexture = null;
        tvVideo = video;
        if (video) {
          videoTexture = new THREE.VideoTexture(video);
          videoTexture.colorSpace = THREE.SRGBColorSpace;
        }
        showTv();
      },
      setStandby(text) {
        paintStandby(text);
      },
    },
    setHighlight(id) {
      outlines.forEach((outline, key) => {
        outline.visible = key === id;
      });
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
      videoTexture?.dispose();
      disposables.forEach((d) => d.dispose());
      walls.dispose();
    },
  };
}
