// The four walls are giant screens showing a place that is not really there.
// From across the room it reads as scenery; up close you can see the panel
// seams and the pixel grid, now and then a panel drops out, and when the
// place changes the whole wall tears into static for a moment.

import * as THREE from 'three';
import { withBase } from '../site';
import { ENVIRONMENTS, PANORAMA, PANORAMA_SCALE, timeOfDayTint, type WorldId } from './environments';
import { ROOM } from './room-data';

const PERIMETER = (ROOM.width + ROOM.depth) * 2;
const PANEL = 0.5; // metres: each wall is tiled with square panels this size
const SWITCH_SECONDS = 0.9;

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
  uniform vec2 uPanels;      // panels around the room, panels high

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
    color = max(mix(vec3(luma), color, 1.5), 0.0) * 1.2;

    // Static.
    float grain = hash(floor(vUv * vec2(520.0, 60.0)) + floor(uTime * 30.0));
    color = mix(color, vec3(grain * grain), uGlitch * 0.5);

    // Which panel is this?
    vec2 panelPos = vUv * uPanels;
    vec2 panel = floor(panelPos);
    vec2 inPanel = fract(panelPos);

    // Idle flicker: now and then one panel loses signal for a moment.
    float tick = floor(uTime * 2.0);
    float dropout = step(0.9988, hash(panel + tick * 17.0)) * uMotion;
    // One panel that never quite works.
    float dead = step(abs(panel.x - 31.0) + abs(panel.y - 3.0), 0.5);
    float broken = max(dropout, dead);
    float snow = hash(floor(vUv * vec2(1040.0, 120.0)) + floor(uTime * 12.0) * uMotion);
    color = mix(color, vec3(snow * 0.08), broken * (dead > 0.5 ? 0.9 : 0.8));

    // A faint bright band rolling slowly down the wall.
    float roll = fract(vUv.y + uTime * 0.07);
    color *= 1.0 + 0.06 * smoothstep(0.9, 1.0, roll) * uMotion;

    // Seams between panels, only visible from nearby.
    vec2 toEdge = min(inPanel, 1.0 - inPanel) * ${PANEL.toFixed(2)};
    float seam = 1.0 - smoothstep(0.004, 0.014, min(toEdge.x, toEdge.y));
    color *= 1.0 - seam * 0.8 * (1.0 - smoothstep(1.6, 4.2, dist));

    // The pixel grid, only visible from very close.
    vec2 cell = fract(panelPos * 16.0);
    float grid = step(0.78, max(cell.x, cell.y));
    color *= 1.0 - grid * 0.55 * (1.0 - smoothstep(0.7, 1.5, dist));

    gl_FragColor = vec4(color, 1.0);
  }
`;

interface Loaded {
  texture: THREE.CanvasTexture;
  /** Average colour of the upper and lower halves, for lighting the room. */
  sky: THREE.Color;
  ground: THREE.Color;
}

export interface WallScreens {
  group: THREE.Group;
  /** Light cast into the room by whatever the walls are showing. */
  light: THREE.HemisphereLight;
  show(world: WorldId, instant?: boolean): void;
  update(t: number, dt: number, reducedMotion: boolean): void;
  dispose(): void;
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
  return new THREE.Color().setRGB(r / n / 255, g / n / 255, b / n / 255, THREE.SRGBColorSpace);
}

export function createWallScreens(initial: WorldId): WallScreens {
  const disposables: { dispose(): void }[] = [];
  const cache = new Map<WorldId, Loaded>();

  const TEX_W = PANORAMA.w * PANORAMA_SCALE;
  const TEX_H = PANORAMA.h * PANORAMA_SCALE;
  let disposed = false;
  // Set once the material exists; re-lights the room after a photo arrives.
  let onImageLoaded = () => {};

  /** Read the average colours of whatever is on the canvas now. */
  const measure = (ctx: CanvasRenderingContext2D, into: Loaded) => {
    const { data } = ctx.getImageData(0, 0, TEX_W, TEX_H);
    const half = Math.floor(TEX_H / 2) * TEX_W * 4;
    into.sky.copy(averageColor(data, 0, half));
    into.ground.copy(averageColor(data, half, data.length));
  };

  const load = (id: WorldId): Loaded => {
    const cached = cache.get(id);
    if (cached) return cached;
    const env = ENVIRONMENTS[id];
    const canvas = document.createElement('canvas');
    canvas.width = TEX_W;
    canvas.height = TEX_H;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.save();
    ctx.scale(PANORAMA_SCALE, PANORAMA_SCALE);
    env.paint(ctx);
    ctx.restore();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    disposables.push(texture);
    const loaded: Loaded = { texture, sky: new THREE.Color(), ground: new THREE.Color() };
    measure(ctx, loaded);
    cache.set(id, loaded);

    if (env.image) {
      // Swap the drawing for the photo once it arrives. If it never does,
      // the drawing simply stays.
      const img = new Image();
      img.onload = () => {
        if (disposed) return;
        ctx.drawImage(img, 0, 0, TEX_W, TEX_H);
        measure(ctx, loaded);
        texture.needsUpdate = true;
        onImageLoaded();
      };
      img.src = withBase(env.image);
    }
    return loaded;
  };

  const tintFor = (id: WorldId) => {
    const [r, g, b] = ENVIRONMENTS[id].followsClock ? timeOfDayTint() : [1, 1, 1];
    return new THREE.Color(r, g, b);
  };

  let from = initial;
  let to = initial;
  let progress = 1; // 1 = settled on "to"

  const first = load(initial);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      tFrom: { value: first.texture },
      tTo: { value: first.texture },
      uMix: { value: 1 },
      uGlitch: { value: 0 },
      uTime: { value: 0 },
      uMotion: { value: 1 },
      uTintFrom: { value: tintFor(initial) },
      uTintTo: { value: tintFor(initial) },
      uPanels: { value: new THREE.Vector2(PERIMETER / PANEL, ROOM.height / PANEL) },
    },
    vertexShader,
    fragmentShader,
  });
  disposables.push(material);

  // One plane per wall. Their texture coordinates run on from each other,
  // so the panorama wraps the room without a break: north, east, south, west.
  const group = new THREE.Group();
  const halfW = ROOM.width / 2;
  const halfD = ROOM.depth / 2;
  const walls: { length: number; x: number; z: number; rotationY: number }[] = [
    { length: ROOM.width, x: 0, z: -halfD, rotationY: 0 },
    { length: ROOM.depth, x: halfW, z: 0, rotationY: -Math.PI / 2 },
    { length: ROOM.width, x: 0, z: halfD, rotationY: Math.PI },
    { length: ROOM.depth, x: -halfW, z: 0, rotationY: Math.PI / 2 },
  ];
  let start = 0;
  for (const wall of walls) {
    const geometry = new THREE.PlaneGeometry(wall.length, ROOM.height);
    const uv = geometry.attributes.uv;
    for (let i = 0; i < uv.count; i++) {
      uv.setX(i, (start + uv.getX(i) * wall.length) / PERIMETER);
    }
    disposables.push(geometry);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(wall.x, ROOM.height / 2, wall.z);
    mesh.rotation.y = wall.rotationY;
    group.add(mesh);
    start += wall.length;
  }

  const light = new THREE.HemisphereLight('#ffffff', '#ffffff', 1);
  const scratchSky = new THREE.Color();
  const scratchGround = new THREE.Color();

  const applyLight = () => {
    const a = load(from);
    const b = load(to);
    const mix = material.uniforms.uMix.value as number;
    const tintA = material.uniforms.uTintFrom.value as THREE.Color;
    const tintB = material.uniforms.uTintTo.value as THREE.Color;
    scratchSky.copy(a.sky).multiply(tintA);
    light.color.copy(b.sky).multiply(tintB).lerp(scratchSky, 1 - mix);
    scratchGround.copy(a.ground).multiply(tintA);
    light.groundColor.copy(b.ground).multiply(tintB).lerp(scratchGround, 1 - mix);
    light.intensity = ENVIRONMENTS[from].light * (1 - mix) + ENVIRONMENTS[to].light * mix;
  };
  applyLight();
  onImageLoaded = applyLight;

  // Fetch every place now, so switching never waits on a download.
  (Object.keys(ENVIRONMENTS) as WorldId[]).forEach(load);

  return {
    group,
    light,
    show(world, instant = false) {
      if (world === to) return;
      // Start from whatever is on the walls right now.
      from = progress >= 0.5 ? to : from;
      to = world;
      progress = instant ? 1 : 0;
      material.uniforms.tFrom.value = load(from).texture;
      material.uniforms.tTo.value = load(to).texture;
      (material.uniforms.uTintFrom.value as THREE.Color).copy(tintFor(from));
      (material.uniforms.uTintTo.value as THREE.Color).copy(tintFor(to));
      material.uniforms.uMix.value = instant ? 1 : 0;
      material.uniforms.uGlitch.value = 0;
      applyLight();
    },
    update(t, dt, reducedMotion) {
      material.uniforms.uTime.value = t;
      material.uniforms.uMotion.value = reducedMotion ? 0 : 1;
      if (progress >= 1) return;
      progress = Math.min(1, progress + dt / SWITCH_SECONDS);
      const mix = THREE.MathUtils.smoothstep(progress, 0.35, 0.65);
      material.uniforms.uMix.value = mix;
      // Reduced motion: a plain cross-fade, no tearing or static.
      material.uniforms.uGlitch.value = reducedMotion ? 0 : Math.sin(progress * Math.PI);
      applyLight();
    },
    dispose() {
      disposed = true;
      disposables.forEach((d) => d.dispose());
      light.dispose();
    },
  };
}
