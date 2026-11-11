// Builds the 3D room out of simple boxes. Everything here is placeholder
// geometry so the room is walkable before real art exists; Phase 2 swaps in
// bit-crushed textures and models, keeping the hotspots in room-data.ts.

import * as THREE from 'three';
import { HOTSPOTS, ROOM } from './room-data';
import {
  ARCADE_SIZE,
  PC_SIZE,
  SKY_SIZE,
  paintArcade,
  paintComputer,
  paintSky,
} from './screens';

export interface Room {
  scene: THREE.Scene;
  /** Clicking this means "walk here". */
  floor: THREE.Mesh;
  /** Invisible boxes around each hotspot; userData.hotspotId names it. */
  hitVolumes: THREE.Mesh[];
  setLit(lit: boolean): void;
  /** Outline one hotspot (or none). */
  setHighlight(id: string | null): void;
  /** Redraw the moving screens. `t` is in seconds. */
  update(t: number): void;
  dispose(): void;
}

const HALF_W = ROOM.width / 2;
const HALF_D = ROOM.depth / 2;

export function buildRoom(): Room {
  const scene = new THREE.Scene();
  const disposables: { dispose(): void }[] = [];

  const lambert = (color: string) => {
    const m = new THREE.MeshLambertMaterial({ color });
    disposables.push(m);
    return m;
  };
  // Unlit and unaffected by fog: for things that make their own light.
  const glow = (color: string) => {
    const m = new THREE.MeshBasicMaterial({ color, fog: false });
    disposables.push(m);
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

  const wallMat = lambert('#c8d4a8');
  const trimMat = lambert('#4d2f22');
  const woodMat = lambert('#7a4a30');
  const darkWood = lambert('#2a1a14');

  const floor = box(lambert('#8a5636'), ROOM.width, 0.1, ROOM.depth, 0, -0.05, 0);
  // Floorboard seams.
  for (let x = -HALF_W + 0.5; x < HALF_W; x += 0.5) {
    box(trimMat, 0.02, 0.004, ROOM.depth, x, 0.002, 0);
  }
  box(lambert('#e6e9cc'), ROOM.width, 0.1, ROOM.depth, 0, ROOM.height + 0.05, 0); // ceiling

  box(wallMat, ROOM.width, ROOM.height, 0.1, 0, ROOM.height / 2, -HALF_D - 0.05); // north
  box(wallMat, ROOM.width, ROOM.height, 0.1, 0, ROOM.height / 2, HALF_D + 0.05); // south
  box(wallMat, 0.1, ROOM.height, ROOM.depth, HALF_W + 0.05, ROOM.height / 2, 0); // east
  box(wallMat, 0.1, ROOM.height, ROOM.depth, -HALF_W - 0.05, ROOM.height / 2, 0); // west

  // Skirting boards.
  box(trimMat, ROOM.width, 0.12, 0.03, 0, 0.06, -HALF_D + 0.015);
  box(trimMat, ROOM.width, 0.12, 0.03, 0, 0.06, HALF_D - 0.015);
  box(trimMat, 0.03, 0.12, ROOM.depth, HALF_W - 0.015, 0.06, 0);
  box(trimMat, 0.03, 0.12, ROOM.depth, -HALF_W + 0.015, 0.06, 0);

  // Ceiling lamp.
  const lampOn = glow('#f0d9a0');
  const lampOff = lambert('#a4adb8');
  const lamp = box(lampOff, 0.5, 0.06, 0.5, 0, ROOM.height - 0.03, 0);

  /* ------------------------- north: window, switch ------------------------ */

  const WIN_W = 2.8;
  const WIN_H = 1.5;
  const WIN_Y = 1.7;
  const northZ = -HALF_D;
  screen(SKY_SIZE, paintSky, WIN_W, WIN_H, 0, WIN_Y, northZ + 0.02, 0);
  box(trimMat, WIN_W + 0.2, 0.1, 0.12, 0, WIN_Y + WIN_H / 2 + 0.05, northZ + 0.06);
  box(trimMat, WIN_W + 0.2, 0.1, 0.12, 0, WIN_Y - WIN_H / 2 - 0.05, northZ + 0.06);
  box(trimMat, 0.1, WIN_H, 0.12, -WIN_W / 2 - 0.05, WIN_Y, northZ + 0.06);
  box(trimMat, 0.1, WIN_H, 0.12, WIN_W / 2 + 0.05, WIN_Y, northZ + 0.06);
  box(darkWood, 0.05, WIN_H, 0.06, 0, WIN_Y, northZ + 0.05);
  box(darkWood, WIN_W, 0.05, 0.06, 0, WIN_Y, northZ + 0.05);
  box(woodMat, WIN_W + 0.4, 0.05, 0.22, 0, WIN_Y - WIN_H / 2 - 0.12, northZ + 0.11);

  const SWITCH_X = 2.3;
  const SWITCH_Y = 1.35;
  box(lambert('#f3f7e4'), 0.12, 0.18, 0.02, SWITCH_X, SWITCH_Y, northZ + 0.01);
  const switchNub = box(lambert('#6b7480'), 0.04, 0.06, 0.03, SWITCH_X, SWITCH_Y - 0.03, northZ + 0.03);
  // A small light so the switch can be found in the dark.
  const switchLed = box(glow('#f07a5a'), 0.045, 0.045, 0.02, SWITCH_X, SWITCH_Y + 0.14, northZ + 0.02);

  /* --------------------- east: desk, computer, shelf --------------------- */

  const eastX = HALF_W;
  box(woodMat, 0.85, 0.06, 2.2, eastX - 0.45, 0.75, 0);
  box(trimMat, 0.07, 0.72, 0.07, eastX - 0.82, 0.36, -1.03);
  box(trimMat, 0.07, 0.72, 0.07, eastX - 0.82, 0.36, 1.03);
  box(trimMat, 0.07, 0.72, 0.07, eastX - 0.08, 0.36, -1.03);
  box(trimMat, 0.07, 0.72, 0.07, eastX - 0.08, 0.36, 1.03);

  const greyDark = lambert('#3a4048');
  const greyMid = lambert('#6b7480');
  box(greyMid, 0.22, 0.03, 0.34, eastX - 0.34, 0.795, 0); // monitor base
  box(greyDark, 0.05, 0.14, 0.08, eastX - 0.3, 0.87, 0); // neck
  box(greyDark, 0.06, 0.52, 0.86, eastX - 0.32, 1.2, 0); // monitor
  screen(PC_SIZE, paintComputer, 0.78, 0.44, eastX - 0.352, 1.2, 0, -Math.PI / 2);
  box(lambert('#a4adb8'), 0.16, 0.02, 0.46, eastX - 0.66, 0.79, 0.05); // keyboard

  const SHELF_Z = -2.0;
  const SHELF_Y = 1.72;
  box(woodMat, 0.28, 0.04, 1.2, eastX - 0.14, SHELF_Y, SHELF_Z);
  box(trimMat, 0.2, 0.12, 0.04, eastX - 0.1, SHELF_Y - 0.08, SHELF_Z - 0.45);
  box(trimMat, 0.2, 0.12, 0.04, eastX - 0.1, SHELF_Y - 0.08, SHELF_Z + 0.45);
  const spines = ['#b8405a', '#1d4a5a', '#94a348', '#4a3a8c', '#d4a56a', '#3a8fa0', '#2e3a1c', '#f07a5a', '#6d4fa8', '#5a6a40'];
  let bookZ = SHELF_Z - 0.5;
  spines.forEach((color, i) => {
    const thickness = 0.06 + ((i * 7) % 4) * 0.012;
    const height = 0.26 + ((i * 5) % 5) * 0.03;
    box(lambert(color), 0.18, height, thickness, eastX - 0.14, SHELF_Y + 0.02 + height / 2, bookZ + thickness / 2);
    bookZ += thickness + 0.012;
  });

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

  /* ----------------------- west: cinema, headphones ---------------------- */

  const westX = -HALF_W;
  box(lambert('#0b0d18'), 0.05, 1.76, 3.36, westX + 0.025, 1.7, 0); // frame
  const cinemaMat = new THREE.MeshLambertMaterial({ color: '#f3f7e4', emissive: '#a4adb8', emissiveIntensity: 0 });
  disposables.push(cinemaMat);
  box(cinemaMat, 0.02, 1.6, 3.2, westX + 0.06, 1.7, 0);

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

  /* -------------------------------- lights ------------------------------- */

  const ambient = new THREE.AmbientLight('#ffffff', 1);
  const ceilingLight = new THREE.PointLight('#fff3e0', 0, 0, 1.6);
  ceilingLight.position.set(0, ROOM.height - 0.4, 0);
  const windowLight = new THREE.PointLight('#8a6fd4', 0, 0, 1.6);
  windowLight.position.set(0, WIN_Y, northZ + 0.7);
  const pcLight = new THREE.PointLight('#3a8fa0', 0, 0, 1.8);
  pcLight.position.set(eastX - 0.9, 1.25, 0);
  const arcadeLight = new THREE.PointLight('#5a8fc0', 0, 0, 1.8);
  arcadeLight.position.set(ARC_X, 1.35, southZ - 1.2);
  const doorLight = new THREE.PointLight('#f0d9a0', 0, 0, 2);
  doorLight.position.set(DOOR_X, 0.12, southZ - 0.35);
  scene.add(ambient, ceilingLight, windowLight, pcLight, arcadeLight, doorLight);

  const fog = new THREE.FogExp2('#0b0d24', 0);
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

  const setLit = (lit: boolean) => {
    ambient.color.set(lit ? '#ffffff' : '#4a4aa0');
    ambient.intensity = lit ? 1.9 : 0.45;
    ceilingLight.intensity = lit ? 4 : 0;
    windowLight.intensity = lit ? 0.6 : 4.5;
    pcLight.intensity = lit ? 0.2 : 1.6;
    arcadeLight.intensity = lit ? 0.2 : 1.4;
    doorLight.intensity = lit ? 0 : 0.5;
    fog.density = lit ? 0 : 0.13;
    lamp.material = lit ? lampOn : lampOff;
    cinemaMat.emissiveIntensity = lit ? 0 : 0.12;
    switchNub.position.y = SWITCH_Y + (lit ? 0.03 : -0.03);
    switchLed.visible = !lit;
    doorGlow.visible = !lit;
    headphoneLed.visible = !lit;
  };
  setLit(false);

  return {
    scene,
    floor,
    hitVolumes,
    setLit,
    setHighlight(id) {
      outlines.forEach((outline, key) => {
        outline.visible = key === id;
      });
    },
    update(t) {
      for (const s of screens) {
        s.paint(s.ctx, t);
        s.texture.needsUpdate = true;
      }
    },
    dispose() {
      disposables.forEach((d) => d.dispose());
    },
  };
}
