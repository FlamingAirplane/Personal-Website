// Furniture and clutter: the bookcase, desk chair, speakers, couch, rug,
// plant, record player and whiteboard. All placeholder shapes built from
// boxes and cylinders, like the rest of the room.
//
// Anything that stands on the floor also needs a rectangle in OBSTACLES
// (room-data.ts) so you walk around it.

import * as THREE from 'three';
import { ROOM } from './room-data';

/** The building helpers, handed over by build-room.ts. */
export interface Kit {
  scene: THREE.Scene;
  /** A lit, matte material. One is shared per colour. */
  lambert(color: string): THREE.Material;
  /** An unlit material for things that make their own light. */
  glow(color: string): THREE.Material;
  /** A box centred at (x, y, z). */
  box(
    material: THREE.Material,
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    parent?: THREE.Object3D,
  ): THREE.Mesh;
  /** A square bar from one point to another. */
  beam(material: THREE.Material, thickness: number, from: THREE.Vector3, to: THREE.Vector3): THREE.Mesh;
  /** A cylinder lying along the east-west (x) axis. */
  rod(material: THREE.Material, radius: number, length: number, x: number, y: number, z: number): THREE.Mesh;
  /** An upright cylinder. */
  disc(
    material: THREE.Material,
    radius: number,
    height: number,
    x: number,
    y: number,
    z: number,
    parent?: THREE.Object3D,
  ): THREE.Mesh;
  /** Register something to be freed when the room is torn down. */
  track(disposable: { dispose(): void }): void;
}

export interface Props {
  setLit(lit: boolean): void;
  update(t: number, reducedMotion: boolean): void;
}

const HALF_W = ROOM.width / 2;
const HALF_D = ROOM.depth / 2;

// Cheap repeatable pseudo-random number in [0, 1).
function hash(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export function addProps(kit: Kit): Props {
  const { scene, lambert, glow, box, beam, rod, disc } = kit;

  const wood = lambert('#7a4a30');
  const darkWood = lambert('#4d2f22');
  const black = lambert('#0b0d18');
  const greyDark = lambert('#3a4048');
  const greyMid = lambert('#6b7480');
  const greyLight = lambert('#a4adb8');

  const eastX = HALF_W;
  const northZ = -HALF_D;
  const southZ = HALF_D;

  /* ------------------------------- bookcase ------------------------------ */
  // Floor-standing, against the east wall, north of the desk.

  const BC = { z: -2.15, width: 1.0, depth: 0.32, height: 1.9 };
  const bcX = eastX - BC.depth / 2;
  box(wood, BC.depth, BC.height, 0.04, bcX, BC.height / 2, BC.z - BC.width / 2 + 0.02); // sides
  box(wood, BC.depth, BC.height, 0.04, bcX, BC.height / 2, BC.z + BC.width / 2 - 0.02);
  box(darkWood, 0.02, BC.height, BC.width, eastX - 0.01, BC.height / 2, BC.z); // back
  box(darkWood, BC.depth - 0.02, 0.04, BC.width - 0.08, bcX + 0.01, 0.02, BC.z); // plinth
  box(wood, BC.depth + 0.02, 0.04, BC.width, bcX, BC.height - 0.02, BC.z); // top
  const boards = [0.06, 0.43, 0.8, 1.17, 1.54];
  for (const y of boards) box(wood, BC.depth, 0.04, BC.width - 0.08, bcX, y, BC.z);

  const SPINES = [
    '#b8405a', '#1d4a5a', '#94a348', '#4a3a8c', '#d4a56a', '#3a8fa0', '#2e3a1c',
    '#f07a5a', '#6d4fa8', '#5a6a40', '#f0d9a0', '#1f2350', '#a8744a', '#7fd4d8',
  ];
  const bookX = eastX - 0.15; // books sit back from the front edge
  const shelfFrom = BC.z - BC.width / 2 + 0.05;
  const shelfTo = BC.z + BC.width / 2 - 0.05;
  const surface = (shelf: number) => boards[shelf] + 0.02;

  /** Stand a row of books on a shelf from `from` towards `to`; returns where it ended. */
  const row = (
    shelf: number,
    from: number,
    to: number,
    seed: number,
    size: { thick: [number, number]; tall: [number, number] },
    colors: string[] = SPINES,
  ) => {
    let z = from;
    for (let i = 0; ; i++) {
      const thick = size.thick[0] + hash(seed + i) * (size.thick[1] - size.thick[0]);
      if (z + thick > to) break;
      const tall = size.tall[0] + hash(seed * 3 + i) * (size.tall[1] - size.tall[0]);
      const color = colors[Math.floor(hash(seed * 7 + i) * colors.length)];
      box(lambert(color), 0.2, tall, thick, bookX, surface(shelf) + tall / 2, z + thick / 2);
      z += thick + 0.004;
    }
    return z;
  };

  // Bottom: heavy books and a storage box.
  row(0, shelfFrom, shelfFrom + 0.55, 11, { thick: [0.05, 0.09], tall: [0.24, 0.31] });
  box(lambert('#a8744a'), 0.22, 0.2, 0.28, bookX, surface(0) + 0.1, shelfTo - 0.15);
  // Novels, with one leaning at the end.
  const novelsEnd = row(1, shelfFrom, shelfTo - 0.12, 23, { thick: [0.025, 0.05], tall: [0.2, 0.3] });
  const leaning = box(lambert('#b8405a'), 0.2, 0.27, 0.035, bookX, surface(1) + 0.13, novelsEnd + 0.06);
  leaning.rotation.x = 0.28;
  // A manga series: slim matching volumes with a light band, in two runs.
  const mangaA = row(2, shelfFrom, shelfFrom + 0.4, 5, { thick: [0.03, 0.03], tall: [0.2, 0.2] }, ['#b8405a']);
  const mangaB = row(2, mangaA + 0.004, mangaA + 0.3, 6, { thick: [0.03, 0.03], tall: [0.2, 0.2] }, ['#1f2350']);
  box(lambert('#f3f7e4'), 0.202, 0.03, mangaB - shelfFrom - 0.004, bookX, surface(2) + 0.15, (shelfFrom + mangaB) / 2);
  // ...and a small figure beside it.
  box(lambert('#94a348'), 0.08, 0.1, 0.08, bookX, surface(2) + 0.05, shelfTo - 0.08);
  box(lambert('#f0d9a0'), 0.06, 0.06, 0.06, bookX, surface(2) + 0.13, shelfTo - 0.08);
  // A half-full shelf with a framed picture.
  row(3, shelfFrom + 0.3, shelfTo, 41, { thick: [0.03, 0.06], tall: [0.18, 0.29] });
  box(darkWood, 0.03, 0.2, 0.16, bookX - 0.04, surface(3) + 0.1, shelfFrom + 0.13);
  box(lambert('#7fd4d8'), 0.01, 0.15, 0.11, bookX - 0.06, surface(3) + 0.1, shelfFrom + 0.13);
  // Top shelf: a few books lying flat.
  for (let i = 0; i < 4; i++) {
    box(lambert(SPINES[(i * 3 + 1) % SPINES.length]), 0.2, 0.04, 0.28 - i * 0.02, bookX, surface(4) + 0.02 + i * 0.042, shelfFrom + 0.18);
  }
  row(4, shelfFrom + 0.42, shelfTo, 57, { thick: [0.03, 0.05], tall: [0.2, 0.28] });
  // On top: a small succulent.
  disc(lambert('#d4a56a'), 0.06, 0.09, bcX, BC.height + 0.045, BC.z + 0.25);
  box(lambert('#94a348'), 0.09, 0.07, 0.09, bcX, BC.height + 0.12, BC.z + 0.25);
  box(lambert('#5a6a40'), 0.05, 0.06, 0.05, bcX, BC.height + 0.18, BC.z + 0.25);

  /* ------------------------- desk: chair, speakers ------------------------ */

  const chair = new THREE.Group();
  chair.position.set(2.42, 0, 0.1);
  chair.rotation.y = 0.3; // left slightly turned, as if someone just stood up
  scene.add(chair);
  const fabric = lambert('#2e3a1c');
  box(black, 0.52, 0.04, 0.06, 0, 0.04, 0, chair); // star base
  box(black, 0.06, 0.04, 0.52, 0, 0.04, 0, chair);
  disc(greyDark, 0.03, 0.38, 0, 0.25, 0, chair); // gas lift
  box(fabric, 0.48, 0.08, 0.48, 0, 0.47, 0, chair); // seat
  box(fabric, 0.07, 0.56, 0.44, -0.23, 0.83, 0, chair); // back (the chair faces the desk)
  for (const z of [-0.26, 0.26]) {
    box(black, 0.04, 0.17, 0.04, 0.04, 0.59, z, chair);
    box(black, 0.28, 0.03, 0.06, 0, 0.68, z, chair); // armrest
  }

  // Studio monitor speakers either side of the screen.
  const DESK_TOP = ROOM.deskTop;
  for (const z of [-0.5, 0.5]) {
    box(black, 0.24, 0.3, 0.19, eastX - 0.2, DESK_TOP + 0.15, z);
    rod(lambert('#d4a56a'), 0.065, 0.012, eastX - 0.325, DESK_TOP + 0.11, z); // woofer
    rod(greyDark, 0.025, 0.012, eastX - 0.325, DESK_TOP + 0.235, z); // tweeter
    box(glow('#7fd4d8'), 0.006, 0.012, 0.012, eastX - 0.323, DESK_TOP + 0.03, z + 0.07); // power light
  }

  /* --------------------- couch, facing the cinema screen ------------------ */

  const couch = lambert('#2e2a6b');
  const cushion = lambert('#4a3a8c');
  box(couch, 0.9, 0.3, 1.7, -1.6, 0.19, 0); // base
  box(couch, 0.2, 0.55, 1.7, -1.25, 0.6, 0); // back
  for (const z of [-0.77, 0.77]) box(couch, 0.9, 0.3, 0.16, -1.6, 0.48, z); // arms
  for (const z of [-0.345, 0.345]) {
    box(cushion, 0.66, 0.12, 0.66, -1.7, 0.4, z); // seat cushions
    box(cushion, 0.14, 0.4, 0.66, -1.42, 0.64, z); // back cushions
  }
  for (const x of [-1.98, -1.22]) for (const z of [-0.78, 0.78]) box(black, 0.06, 0.04, 0.06, x, 0.02, z); // feet
  const pillow = box(lambert('#b8405a'), 0.12, 0.3, 0.3, -1.56, 0.61, -0.48);
  pillow.rotation.z = -0.35;
  // A game controller left on the seat.
  box(black, 0.1, 0.035, 0.16, -1.76, 0.478, 0.36);
  box(lambert('#f07a5a'), 0.02, 0.012, 0.02, -1.775, 0.5, 0.41);
  box(lambert('#94a348'), 0.02, 0.012, 0.02, -1.775, 0.5, 0.31);

  /* ---------------------------------- rug --------------------------------- */

  const rugCanvas = document.createElement('canvas');
  rugCanvas.width = 52;
  rugCanvas.height = 38;
  const rug = rugCanvas.getContext('2d')!;
  rug.fillStyle = '#1f2350';
  rug.fillRect(0, 0, 52, 38);
  rug.strokeStyle = '#b8405a';
  rug.lineWidth = 2;
  rug.strokeRect(2, 2, 48, 34);
  rug.strokeStyle = '#f0d9a0';
  rug.lineWidth = 1;
  rug.strokeRect(5.5, 5.5, 41, 27);
  rug.fillStyle = '#4a3a8c';
  for (let i = 0; i < 5; i++) {
    const cx = 10 + i * 8;
    rug.beginPath();
    rug.moveTo(cx, 19 - 7);
    rug.lineTo(cx + 3.5, 19);
    rug.lineTo(cx, 19 + 7);
    rug.lineTo(cx - 3.5, 19);
    rug.closePath();
    rug.fill();
  }
  rug.fillStyle = '#b8405a';
  for (let i = 0; i < 5; i++) rug.fillRect(9 + i * 8, 18, 2, 2);
  const rugTexture = new THREE.CanvasTexture(rugCanvas);
  rugTexture.colorSpace = THREE.SRGBColorSpace;
  rugTexture.magFilter = THREE.NearestFilter;
  rugTexture.minFilter = THREE.NearestFilter;
  rugTexture.generateMipmaps = false;
  const rugMaterial = new THREE.MeshLambertMaterial({ map: rugTexture });
  kit.track(rugTexture);
  kit.track(rugMaterial);
  box(rugMaterial, 2.6, 0.012, 1.9, 0.2, 0.006, 0.1);

  /* ----------------- plant and watering can (Digital Nature) -------------- */

  const POT_X = -2.3;
  const POT_Z = northZ + 0.38;
  disc(lambert('#a8744a'), 0.17, 0.3, POT_X, 0.15, POT_Z);
  disc(lambert('#7a4a30'), 0.19, 0.05, POT_X, 0.3, POT_Z); // rim
  disc(lambert('#2a1a14'), 0.15, 0.02, POT_X, 0.33, POT_Z); // soil
  beam(lambert('#2e3a1c'), 0.025, v(POT_X, 0.33, POT_Z), v(POT_X, 1.05, POT_Z)); // stem
  const leafColors = ['#5a6a40', '#94a348', '#2e3a1c'];
  for (let i = 0; i < 9; i++) {
    const leaf = new THREE.Group();
    leaf.position.set(POT_X, 0.5 + i * 0.07, POT_Z);
    leaf.rotation.y = i * 2.4; // spiral up the stem
    scene.add(leaf);
    const blade = box(lambert(leafColors[i % 3]), 0.3 - i * 0.018, 0.012, 0.12 - i * 0.006, 0.17 - i * 0.008, 0.04, 0, leaf);
    blade.rotation.z = 0.45;
  }

  const CAN_X = -1.74;
  disc(greyMid, 0.11, 0.2, CAN_X, 0.1, POT_Z); // body
  beam(greyLight, 0.03, v(CAN_X + 0.09, 0.08, POT_Z), v(CAN_X + 0.32, 0.27, POT_Z)); // spout
  box(greyLight, 0.03, 0.07, 0.07, CAN_X + 0.33, 0.28, POT_Z); // rose
  beam(greyLight, 0.02, v(CAN_X - 0.09, 0.19, POT_Z), v(CAN_X - 0.21, 0.13, POT_Z)); // handle
  beam(greyLight, 0.02, v(CAN_X - 0.21, 0.13, POT_Z), v(CAN_X - 0.1, 0.03, POT_Z));

  /* -------------- record player on a cabinet, crate of records ------------ */

  const CAB_Z = northZ + 0.26;
  const CAB_TOP = 0.62;
  box(wood, 1.1, 0.5, 0.44, 0, 0.37, CAB_Z);
  for (const x of [-0.5, 0.5]) for (const dz of [-0.17, 0.17]) box(darkWood, 0.05, 0.12, 0.05, x, 0.06, CAB_Z + dz); // legs
  for (const x of [-0.27, 0.27]) {
    box(darkWood, 0.5, 0.42, 0.012, x, 0.37, CAB_Z + 0.224); // doors
    box(lambert('#d4a56a'), 0.03, 0.03, 0.02, x > 0 ? 0.06 : -0.06, 0.4, CAB_Z + 0.238); // knobs
  }
  box(lambert('#1a1e10'), 0.46, 0.06, 0.36, -0.22, CAB_TOP + 0.03, CAB_Z); // turntable
  disc(black, 0.15, 0.016, -0.26, CAB_TOP + 0.068, CAB_Z); // record
  disc(lambert('#b8405a'), 0.05, 0.018, -0.26, CAB_TOP + 0.069, CAB_Z); // label
  disc(greyLight, 0.025, 0.05, -0.05, CAB_TOP + 0.085, CAB_Z - 0.12); // tonearm pivot
  beam(greyLight, 0.012, v(-0.05, CAB_TOP + 0.1, CAB_Z - 0.12), v(-0.17, CAB_TOP + 0.085, CAB_Z + 0.06)); // tonearm

  // A lava lamp, the one thing here that glows.
  const LAVA_X = 0.36;
  disc(greyMid, 0.05, 0.05, LAVA_X, CAB_TOP + 0.025, CAB_Z);
  disc(glow('#6d4fa8'), 0.04, 0.2, LAVA_X, CAB_TOP + 0.15, CAB_Z);
  const blob = disc(glow('#f07a5a'), 0.028, 0.06, LAVA_X, CAB_TOP + 0.12, CAB_Z);
  disc(greyMid, 0.034, 0.03, LAVA_X, CAB_TOP + 0.265, CAB_Z);
  const lavaLight = new THREE.PointLight('#b8405a', 0, 0, 2);
  lavaLight.position.set(LAVA_X, CAB_TOP + 0.25, CAB_Z + 0.3);
  scene.add(lavaLight);

  // Crate of records on the floor beside it.
  const CRATE_X = 0.88;
  box(lambert('#a8744a'), 0.36, 0.26, 0.34, CRATE_X, 0.13, CAB_Z);
  for (let i = 0; i < 7; i++) {
    box(lambert(SPINES[(i * 5 + 2) % SPINES.length]), 0.3, 0.31, 0.014, CRATE_X, 0.2, CAB_Z - 0.13 + i * 0.043);
  }

  /* ------------------------------ whiteboard ------------------------------ */
  // On a wheeled stand by the south wall, facing into the room.

  const WB_X = -0.8;
  const WB_Z = southZ - 0.2;
  for (const x of [WB_X - 0.58, WB_X + 0.58]) {
    box(greyLight, 0.04, 1.74, 0.04, x, 0.87, WB_Z); // uprights
    box(greyLight, 0.05, 0.04, 0.5, x, 0.02, WB_Z - 0.1); // feet
  }
  box(greyLight, 1.2, 0.84, 0.03, WB_X, 1.32, WB_Z); // frame
  box(lambert('#f3f7e4'), 1.12, 0.76, 0.01, WB_X, 1.32, WB_Z - 0.018); // surface
  box(greyLight, 1.0, 0.02, 0.07, WB_X, 0.9, WB_Z - 0.04); // tray
  ['#b8405a', '#1d4a5a', '#2e3a1c'].forEach((color, i) => {
    box(lambert(color), 0.1, 0.02, 0.02, WB_X - 0.3 + i * 0.14, 0.92, WB_Z - 0.05); // markers
  });
  const ink = WB_Z - 0.026; // just proud of the surface
  const note = (color: string, x: number, y: number) => box(lambert(color), 0.14, 0.14, 0.004, x, y, ink);
  note('#f0d9a0', WB_X + 0.4, 1.56);
  note('#f07a5a', WB_X + 0.22, 1.56);
  note('#7fd4d8', WB_X + 0.4, 1.38);
  const line = (x: number, y: number, w: number) => box(greyDark, w, 0.016, 0.004, x, y, ink);
  line(WB_X - 0.22, 1.6, 0.52);
  line(WB_X - 0.3, 1.5, 0.36);
  line(WB_X - 0.26, 1.4, 0.44);
  line(WB_X - 0.34, 1.3, 0.28);
  line(WB_X + 0.05, 1.14, 0.9);
  box(lambert('#b8405a'), 0.2, 0.016, 0.004, WB_X - 0.38, 1.06, ink);

  return {
    setLit(lit) {
      lavaLight.intensity = lit ? 0.15 : 0.8;
    },
    update(t, reducedMotion) {
      // The blob drifts slowly up and down inside the lava lamp.
      if (!reducedMotion) blob.position.y = CAB_TOP + 0.15 + Math.sin(t * 0.5) * 0.06;
    },
  };
}
