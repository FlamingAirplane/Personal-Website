// The walls and the ceiling are giant screens showing a place that is not
// really there. From across the room it reads as scenery; up close you can
// see the panel seams and the pixel grid, now and then a panel drops out,
// and when the place changes the whole surface tears into static for a moment.
//
// The walls show one panorama that wraps all the way round: north wall
// first, then east, south and west. The ceiling continues the colours at the
// top of the walls inwards, unless the place has a ceiling picture of its own.

import * as THREE from 'three';
import type { ImageSpec, RoomConfig } from './config';
import { PANORAMA, PANORAMA_SCALE, timeOfDayTint } from './environments';
import type { WorldDef } from './worlds';

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform sampler2D tFrom;
  uniform sampler2D tTo;
  uniform float uMix;        // 0 = old place, 1 = new place
  uniform float uGlitch;     // 0..1, peaks mid-switch
  uniform float uTime;
  uniform float uMotion;     // 0 when the visitor asked for reduced motion
  uniform vec3 uTintFrom;
  uniform vec3 uTintTo;
  uniform vec2 uPanels;      // panels across, panels down
  uniform float uPanelSize;  // metres
  uniform float uSeam;
  uniform float uGrid;
  uniform float uSat;
  uniform float uBright;
  uniform float uFlicker;
  uniform float uDead;       // 1 = one panel never works
  uniform float uRoll;       // 1 = a bright band rolls down the screen

  varying vec2 vUv;
  varying vec3 vWorld;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    vec2 uv = vUv;
    float dist = distance(cameraPosition, vWorld);

    // Tearing: rows slide sideways while the picture changes.
    float row = floor(uv.y * 28.0);
    float tear = (hash(vec2(row, floor(uTime * 24.0))) - 0.5) * 0.05 * uGlitch;
    uv.x += tear;

    // Colour channels come apart a little during the switch.
    float split = 0.004 * uGlitch;
    vec3 from = vec3(
      texture2D(tFrom, uv + vec2(split, 0.0)).r,
      texture2D(tFrom, uv).g,
      texture2D(tFrom, uv - vec2(split, 0.0)).b
    ) * uTintFrom;
    vec3 to = vec3(
      texture2D(tTo, uv + vec2(split, 0.0)).r,
      texture2D(tTo, uv).g,
      texture2D(tTo, uv - vec2(split, 0.0)).b
    ) * uTintTo;
    vec3 color = mix(from, to, uMix);

    // Photos go dull when snapped to the small palette; push the colour first.
    float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
    color = max(mix(vec3(luma), color, uSat), 0.0) * uBright;

    // Static.
    float grain = hash(floor(vUv * vec2(520.0, 60.0)) + floor(uTime * 30.0));
    color = mix(color, vec3(grain * grain), uGlitch * 0.5);

    // Which panel is this?
    vec2 panelPos = vUv * uPanels;
    vec2 panel = floor(panelPos);
    vec2 inPanel = fract(panelPos);

    // Idle flicker: now and then one panel loses signal for a moment.
    float tick = floor(uTime * 2.0);
    float dropout = step(1.0 - 0.0012 * uFlicker, hash(panel + tick * 17.0)) * uMotion;
    // One panel that never quite works.
    float dead = step(abs(panel.x - 31.0) + abs(panel.y - 3.0), 0.5) * uDead;
    float broken = max(dropout, dead);
    float snow = hash(floor(vUv * vec2(1040.0, 120.0)) + floor(uTime * 12.0) * uMotion);
    color = mix(color, vec3(snow * 0.08), broken * (dead > 0.5 ? 0.9 : 0.8));

    // A faint bright band rolling slowly down the screen.
    float roll = fract(vUv.y + uTime * 0.07);
    color *= 1.0 + 0.06 * smoothstep(0.9, 1.0, roll) * uMotion * uRoll;

    // Seams between panels, only visible from nearby.
    vec2 toEdge = min(inPanel, 1.0 - inPanel) * uPanelSize;
    float seam = 1.0 - smoothstep(0.004, 0.014, min(toEdge.x, toEdge.y));
    color *= 1.0 - seam * uSeam * (1.0 - smoothstep(1.6, 4.2, dist));

    // The pixel grid, only visible from very close.
    vec2 cell = fract(panelPos * 16.0);
    float grid = step(0.78, max(cell.x, cell.y));
    color *= 1.0 - grid * uGrid * (1.0 - smoothstep(0.7, 1.5, dist));

    gl_FragColor = vec4(color, 1.0);
  }
`;

const TEX_W = PANORAMA.w * PANORAMA_SCALE;
const TEX_H = PANORAMA.h * PANORAMA_SCALE;
const CEIL_W = 128;

/* ----------------------------- picture handling ---------------------------- */

const imageCache = new Map<string, Promise<HTMLImageElement | null>>();

/** Load a picture once; resolves to null if it cannot be loaded. */
function loadImage(url: string): Promise<HTMLImageElement | null> {
  let pending = imageCache.get(url);
  if (!pending) {
    pending = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });
    imageCache.set(url, pending);
  }
  return pending;
}

/** Lay a picture onto the wall-band canvas the way `spec` asks. */
function drawSpec(ctx: CanvasRenderingContext2D, img: HTMLImageElement, spec: ImageSpec) {
  ctx.clearRect(0, 0, TEX_W, TEX_H);
  const tileW = TEX_W / spec.repeat;
  for (let i = 0; i < spec.repeat; i++) {
    const dx = i * tileW;
    if (spec.fit === 'stretch') {
      ctx.drawImage(img, dx, 0, tileW, TEX_H);
      continue;
    }
    // Cover: crop the picture to the tile's shape.
    const tileAspect = tileW / TEX_H;
    const imgAspect = img.width / img.height;
    let sw = img.width;
    let sh = img.height;
    let sx = 0;
    let sy = 0;
    if (imgAspect > tileAspect) {
      sw = img.height * tileAspect;
      sx = (img.width - sw) / 2;
    } else {
      sh = img.width / tileAspect;
      sy = (img.height - sh) * spec.focusY;
    }
    ctx.drawImage(img, sx, sy, sw, sh, dx, 0, tileW, TEX_H);
  }
}

function averageColor(data: Uint8ClampedArray, from: number, to: number) {
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let i = from; i < to; i += 16) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    n++;
  }
  n = Math.max(1, n);
  return new THREE.Color().setRGB(r / n / 255, g / n / 255, b / n / 255, THREE.SRGBColorSpace);
}

/* ---------------------------------- types ---------------------------------- */

interface Loaded {
  wall: THREE.CanvasTexture;
  ceiling: THREE.CanvasTexture;
  wallCtx: CanvasRenderingContext2D;
  ceilCtx: CanvasRenderingContext2D;
  /** Average colour of the upper and lower halves, for lighting the room. */
  sky: THREE.Color;
  ground: THREE.Color;
}

export interface WallOptions {
  width: number;
  depth: number;
  height: number;
  walls: RoomConfig['walls'];
  ceiling: 'screen' | 'solid';
  worlds: Record<string, WorldDef>;
  initial: string;
  /** Multiplies how strongly the screens light the room. */
  lightMultiplier: number;
}

export interface WallScreens {
  group: THREE.Group;
  /** Light cast into the room by whatever the screens are showing. */
  light: THREE.HemisphereLight;
  show(world: string, instant?: boolean): void;
  /** True while the screens are switching from one place to another. */
  busy(): boolean;
  update(t: number, dt: number, reducedMotion: boolean): void;
  dispose(): void;
}

/* ------------------------------- the screens ------------------------------- */

export function createWallScreens(opts: WallOptions): WallScreens {
  const { width: W, depth: D, height: H, walls: params, worlds } = opts;
  const perimeter = (W + D) * 2;
  const ceilH = Math.max(8, Math.round((CEIL_W * D) / W));
  const disposables: { dispose(): void }[] = [];
  const cache = new Map<string, Loaded>();
  let disposed = false;
  let preloadTimer = 0;
  // Set once the material exists; re-lights the room after a picture arrives.
  let onPictureLoaded = () => {};

  const fallbackId = worlds[opts.initial] ? opts.initial : Object.keys(worlds)[0];
  const defOf = (id: string): WorldDef => worlds[id] ?? worlds[fallbackId];

  /* ---- the ceiling: the walls' top edge, carried inwards ---- */

  const topRow = new Float32Array(TEX_W * 3);

  const readTopRow = (ctx: CanvasRenderingContext2D) => {
    const band = Math.max(4, Math.round(TEX_H * 0.06));
    const { data } = ctx.getImageData(0, 0, TEX_W, band);
    const raw = new Float32Array(TEX_W * 3);
    for (let x = 0; x < TEX_W; x++) {
      for (let y = 0; y < band; y++) {
        const i = (y * TEX_W + x) * 4;
        raw[x * 3] += data[i];
        raw[x * 3 + 1] += data[i + 1];
        raw[x * 3 + 2] += data[i + 2];
      }
    }
    // Blur sideways, so a single bright column does not streak across the roof.
    const r = 8;
    for (let x = 0; x < TEX_W; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let k = -r; k <= r; k++) sum += raw[((x + k + TEX_W) % TEX_W) * 3 + c];
        topRow[x * 3 + c] = sum / (2 * r + 1) / band;
      }
    }
  };

  const fillCeilingFromWalls = (ctx: CanvasRenderingContext2D) => {
    const image = ctx.createImageData(CEIL_W, ceilH);
    const col = (u: number, c: number) => topRow[(Math.floor((u % 1) * TEX_W) % TEX_W) * 3 + c];
    for (let py = 0; py < ceilH; py++) {
      const z = D / 2 - ((py + 0.5) / ceilH) * D; // row 0 is the south edge
      for (let px = 0; px < CEIL_W; px++) {
        const x = ((px + 0.5) / CEIL_W) * W - W / 2;
        const sides = [
          { d: z + D / 2, u: (x + W / 2) / perimeter }, // north
          { d: W / 2 - x, u: (W + (z + D / 2)) / perimeter }, // east
          { d: D / 2 - z, u: (W + D + (W / 2 - x)) / perimeter }, // south
          { d: x + W / 2, u: (2 * W + D + (D / 2 - z)) / perimeter }, // west
        ];
        let sum = 0;
        let r = 0;
        let g = 0;
        let b = 0;
        for (const s of sides) {
          const w = 1 / Math.pow(s.d + 0.35, 3);
          sum += w;
          r += w * col(s.u, 0);
          g += w * col(s.u, 1);
          b += w * col(s.u, 2);
        }
        const i = (py * CEIL_W + px) * 4;
        image.data[i] = r / sum;
        image.data[i + 1] = g / sum;
        image.data[i + 2] = b / sum;
        image.data[i + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);
  };

  /* ---- loading a place ---- */

  const measure = (ctx: CanvasRenderingContext2D, into: Loaded) => {
    const { data } = ctx.getImageData(0, 0, TEX_W, TEX_H);
    const half = Math.floor(TEX_H / 2) * TEX_W * 4;
    into.sky.copy(averageColor(data, 0, half));
    into.ground.copy(averageColor(data, half, data.length));
  };

  const makeTexture = (canvas: HTMLCanvasElement, wrap: boolean) => {
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    if (wrap) texture.wrapS = THREE.RepeatWrapping;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    disposables.push(texture);
    return texture;
  };

  /** Rebuild the ceiling for a place from whatever is on its wall canvas now. */
  const refreshCeiling = (loaded: Loaded, def: WorldDef) => {
    if (opts.ceiling !== 'screen') return;
    const finish = () => {
      loaded.ceiling.needsUpdate = true;
    };
    if (def.ceilingUrl) {
      void loadImage(def.ceilingUrl).then((img) => {
        if (disposed) return;
        if (img) {
          // Cover the roof with the picture.
          const c = loaded.ceilCtx;
          const aspect = CEIL_W / ceilH;
          let sw = img.width;
          let sh = img.height;
          if (img.width / img.height > aspect) sw = img.height * aspect;
          else sh = img.width / aspect;
          c.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, 0, 0, CEIL_W, ceilH);
        } else {
          readTopRow(loaded.wallCtx);
          fillCeilingFromWalls(loaded.ceilCtx);
        }
        finish();
      });
      return;
    }
    readTopRow(loaded.wallCtx);
    fillCeilingFromWalls(loaded.ceilCtx);
    finish();
  };

  const load = (id: string): Loaded => {
    const cached = cache.get(id);
    if (cached) return cached;
    const def = defOf(id);

    const wallCanvas = document.createElement('canvas');
    wallCanvas.width = TEX_W;
    wallCanvas.height = TEX_H;
    const wallCtx = wallCanvas.getContext('2d', { willReadFrequently: true })!;
    if (def.paint) {
      wallCtx.save();
      wallCtx.scale(PANORAMA_SCALE, PANORAMA_SCALE);
      def.paint(wallCtx);
      wallCtx.restore();
    } else {
      wallCtx.fillStyle = '#1a1e2a';
      wallCtx.fillRect(0, 0, TEX_W, TEX_H);
    }

    const ceilCanvas = document.createElement('canvas');
    ceilCanvas.width = CEIL_W;
    ceilCanvas.height = ceilH;
    const ceilCtx = ceilCanvas.getContext('2d', { willReadFrequently: true })!;

    const loaded: Loaded = {
      wall: makeTexture(wallCanvas, true),
      ceiling: makeTexture(ceilCanvas, false),
      wallCtx,
      ceilCtx,
      sky: new THREE.Color(),
      ground: new THREE.Color(),
    };
    measure(wallCtx, loaded);
    refreshCeiling(loaded, def);
    cache.set(id, loaded);

    if (def.image?.url) {
      // Swap the drawing for the picture once it arrives. If it never does,
      // the drawing simply stays.
      const spec = def.image.spec;
      void loadImage(def.image.url).then((img) => {
        if (disposed || !img) return;
        drawSpec(wallCtx, img, spec);
        measure(wallCtx, loaded);
        loaded.wall.needsUpdate = true;
        refreshCeiling(loaded, def);
        onPictureLoaded();
      });
    }
    return loaded;
  };

  const tintFor = (id: string) => {
    const useClock = defOf(id).followsClock && params.timeOfDay !== 'off';
    const [r, g, b] = useClock ? timeOfDayTint(params.timeOfDay === 'fixed' ? params.fixedHour : undefined) : [1, 1, 1];
    return new THREE.Color(r, g, b);
  };

  let from = fallbackId;
  let to = fallbackId;
  let progress = 1; // 1 = settled on "to"

  /* ---- materials: one for the walls, one for the ceiling ---- */

  // These are shared, so both surfaces switch and flicker as one.
  const shared = {
    uMix: { value: 1 },
    uGlitch: { value: 0 },
    uTime: { value: 0 },
    uMotion: { value: 1 },
    uTintFrom: { value: tintFor(fallbackId) },
    uTintTo: { value: tintFor(fallbackId) },
    uPanelSize: { value: params.panel },
    uSeam: { value: params.seams },
    uGrid: { value: params.grid },
    uSat: { value: params.saturation },
    uBright: { value: params.brightness },
    uFlicker: { value: params.flicker },
    uDead: { value: params.deadPanel ? 1 : 0 },
    uRoll: { value: params.rollBand ? 1 : 0 },
  };

  const first = load(fallbackId);
  const wallMaterial = new THREE.ShaderMaterial({
    uniforms: {
      ...shared,
      tFrom: { value: first.wall },
      tTo: { value: first.wall },
      uPanels: { value: new THREE.Vector2(perimeter / params.panel, H / params.panel) },
    },
    vertexShader,
    fragmentShader,
  });
  const ceilingMaterial = new THREE.ShaderMaterial({
    uniforms: {
      ...shared,
      tFrom: { value: first.ceiling },
      tTo: { value: first.ceiling },
      uPanels: { value: new THREE.Vector2(W / params.panel, D / params.panel) },
    },
    vertexShader,
    fragmentShader,
  });
  disposables.push(wallMaterial, ceilingMaterial);

  const group = new THREE.Group();
  const halfW = W / 2;
  const halfD = D / 2;
  const sides: { length: number; x: number; z: number; rotationY: number }[] = [
    { length: W, x: 0, z: -halfD, rotationY: 0 },
    { length: D, x: halfW, z: 0, rotationY: -Math.PI / 2 },
    { length: W, x: 0, z: halfD, rotationY: Math.PI },
    { length: D, x: -halfW, z: 0, rotationY: Math.PI / 2 },
  ];
  let start = 0;
  for (const side of sides) {
    const geometry = new THREE.PlaneGeometry(side.length, H);
    const uv = geometry.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setX(i, (start + uv.getX(i) * side.length) / perimeter);
    disposables.push(geometry);
    const mesh = new THREE.Mesh(geometry, wallMaterial);
    mesh.position.set(side.x, H / 2, side.z);
    mesh.rotation.y = side.rotationY;
    group.add(mesh);
    start += side.length;
  }

  if (opts.ceiling === 'screen') {
    const geometry = new THREE.PlaneGeometry(W, D);
    disposables.push(geometry);
    const roof = new THREE.Mesh(geometry, ceilingMaterial);
    roof.rotation.x = Math.PI / 2; // face downwards
    roof.position.set(0, H - 0.002, 0);
    group.add(roof);
  }

  /* ---- lighting from what the screens show ---- */

  const light = new THREE.HemisphereLight('#ffffff', '#ffffff', 1);
  const scratchSky = new THREE.Color();
  const scratchGround = new THREE.Color();

  const applyLight = () => {
    const a = load(from);
    const b = load(to);
    const mix = shared.uMix.value;
    scratchSky.copy(a.sky).multiply(shared.uTintFrom.value);
    light.color.copy(b.sky).multiply(shared.uTintTo.value).lerp(scratchSky, 1 - mix);
    scratchGround.copy(a.ground).multiply(shared.uTintFrom.value);
    light.groundColor.copy(b.ground).multiply(shared.uTintTo.value).lerp(scratchGround, 1 - mix);
    light.intensity = (defOf(from).light * (1 - mix) + defOf(to).light * mix) * opts.lightMultiplier;
  };
  applyLight();
  onPictureLoaded = applyLight;

  // Get every other place ready shortly after, so switching never waits.
  preloadTimer = window.setTimeout(() => Object.keys(worlds).forEach(load), 500);

  const glitchSeconds = params.glitchSeconds;

  return {
    group,
    light,
    show(world, instant = false) {
      const next = worlds[world] ? world : fallbackId;
      if (next === to) return;
      // Start from whatever is on the screens right now.
      from = progress >= 0.5 ? to : from;
      to = next;
      progress = instant ? 1 : 0;
      const a = load(from);
      const b = load(to);
      wallMaterial.uniforms.tFrom.value = a.wall;
      wallMaterial.uniforms.tTo.value = b.wall;
      ceilingMaterial.uniforms.tFrom.value = a.ceiling;
      ceilingMaterial.uniforms.tTo.value = b.ceiling;
      shared.uTintFrom.value.copy(tintFor(from));
      shared.uTintTo.value.copy(tintFor(to));
      shared.uMix.value = instant ? 1 : 0;
      shared.uGlitch.value = 0;
      applyLight();
    },
    busy() {
      return progress < 1;
    },
    update(t, dt, reducedMotion) {
      shared.uTime.value = t;
      shared.uMotion.value = reducedMotion ? 0 : 1;
      if (progress >= 1) return;
      progress = Math.min(1, progress + dt / glitchSeconds);
      shared.uMix.value = THREE.MathUtils.smoothstep(progress, 0.35, 0.65);
      // Reduced motion: a plain cross-fade, no tearing or static.
      shared.uGlitch.value = reducedMotion ? 0 : Math.sin(progress * Math.PI);
      applyLight();
    },
    dispose() {
      disposed = true;
      window.clearTimeout(preloadTimer);
      disposables.forEach((d) => d.dispose());
      light.dispose();
    },
  };
}
