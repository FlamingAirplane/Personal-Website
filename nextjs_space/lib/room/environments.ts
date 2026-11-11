// The places the wall screens can show. Each is one wide panorama that wraps
// all the way around the room: north wall first, then east, south and west.
//
// Each has a drawing made in code, which shows at once. If it also names an
// `image`, that photo replaces the drawing as soon as it has loaded. Photos
// live in public/images/room/ and are 2080 x 240 pixels (see CREDITS.txt).

type Ctx = CanvasRenderingContext2D;

/** Size the code-drawn panoramas are drawn at: 26 m of wall by 3 m high, at 40 px per metre. */
export const PANORAMA = { w: 1040, h: 120 };
/** Wall textures are twice that, to match the photos. */
export const PANORAMA_SCALE = 2;

export type WorldId = 'nebula' | 'forest' | 'sunset' | 'city';

export interface Environment {
  id: WorldId;
  label: string;
  /** How strongly the screens light the room. */
  light: number;
  /** The time-of-day tint only applies to real places, not the nebula. */
  followsClock: boolean;
  /** Stand-in drawing, shown until the photo (if any) has loaded. */
  paint(ctx: Ctx): void;
  /** Site-relative path to a panorama photo. */
  image?: string;
}

/** What the walls show with the lights off. */
export const DARK_WORLD: WorldId = 'nebula';
/** What they show with the lights on, before anything has been inspected. */
export const DEFAULT_WORLD: WorldId = 'forest';

const { w: W, h: H } = PANORAMA;

// Cheap repeatable pseudo-random number in [0, 1).
function hash(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** Fill a rectangle, repeating it across the seam so the panorama wraps. */
function rect(ctx: Ctx, color: string, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = color;
  const rx = Math.round(x);
  ctx.fillRect(rx, Math.round(y), Math.round(w), Math.round(h));
  if (rx + w > W) ctx.fillRect(rx - W, Math.round(y), Math.round(w), Math.round(h));
}

function halo(ctx: Ctx, cx: number, cy: number, radius: number, rgb: string, alpha: number) {
  for (const x of [cx, cx - W, cx + W]) {
    const g = ctx.createRadialGradient(x, cy, 0, x, cy, radius);
    g.addColorStop(0, `rgba(${rgb},${alpha})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - radius, cy - radius, radius * 2, radius * 2);
  }
}

function sky(ctx: Ctx, stops: [number, string][]) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  for (const [at, color] of stops) g.addColorStop(at, color);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

/** A ridge line made of waves that repeat exactly across the seam. */
function ridge(ctx: Ctx, color: string, baseY: number, height: number, seed: number) {
  ctx.fillStyle = color;
  for (let x = 0; x < W; x++) {
    const a = (x / W) * Math.PI * 2;
    const y =
      baseY -
      height *
        (0.5 +
          0.25 * Math.sin(a * 3 + seed) +
          0.15 * Math.sin(a * 7 + seed * 2.3) +
          0.1 * Math.sin(a * 17 + seed * 4.1));
    ctx.fillRect(x, Math.round(y), 1, H - Math.round(y));
  }
}

function paintNebula(ctx: Ctx) {
  sky(ctx, [
    [0, '#05060a'],
    [0.5, '#141833'],
    [1, '#2e2a6b'],
  ]);
  // Drifts of gas, large and overlapping so no wall is empty.
  for (let i = 0; i < 16; i++) {
    const violet = i % 3 !== 0;
    halo(
      ctx,
      (i / 16) * W + hash(i + 3) * 40,
      10 + hash(i + 40) * 100,
      60 + hash(i + 70) * 60,
      violet ? '154,111,196' : '58,143,160',
      violet ? 0.5 : 0.34,
    );
  }
  for (let i = 0; i < 6; i++) {
    halo(ctx, hash(i + 21) * W, 30 + hash(i + 33) * 60, 22, '243,247,228', 0.5); // bright cores
  }
  for (let i = 0; i < 360; i++) {
    rect(ctx, hash(i + 500) > 0.7 ? '#f3f7e4' : '#9a6fc4', hash(i) * W, hash(i + 200) * H, 1, 1);
  }
}

function paintForest(ctx: Ctx) {
  sky(ctx, [
    [0, '#7fd4d8'],
    [0.5, '#c8d4a8'],
    [0.7, '#f3f7e4'],
  ]);
  ridge(ctx, '#5a6a40', 78, 26, 1.3); // far tree line
  ridge(ctx, '#2e3a1c', 88, 18, 4.2);
  const ground = ctx.createLinearGradient(0, 86, 0, H);
  ground.addColorStop(0, '#2e3a1c');
  ground.addColorStop(1, '#4d2f22');
  ctx.fillStyle = ground;
  ctx.fillRect(0, 92, W, H - 92);
  // Trunks, far ones first.
  for (let layer = 0; layer < 3; layer++) {
    const count = 34 - layer * 8;
    for (let i = 0; i < count; i++) {
      const n = layer * 100 + i;
      const x = hash(n + 11) * W;
      const width = 3 + layer * 3 + hash(n + 23) * 3;
      const foot = 94 + layer * 9 + hash(n + 31) * 6;
      rect(ctx, layer === 2 ? '#2a1a14' : layer === 1 ? '#4d2f22' : '#5a6a40', x, 0, width, foot);
      // Canopy.
      rect(ctx, layer === 0 ? '#5a6a40' : '#2e3a1c', x - width * 2, 0, width * 5, 8 + hash(n + 5) * 16);
    }
  }
  halo(ctx, W * 0.135, 30, 80, '243,247,228', 0.5); // sun through the trees, north
}

function paintSunset(ctx: Ctx) {
  sky(ctx, [
    [0, '#2e2a6b'],
    [0.35, '#6d4fa8'],
    [0.55, '#b8405a'],
    [0.68, '#f07a5a'],
    [0.76, '#f0d9a0'],
  ]);
  halo(ctx, W * 0.135, 84, 90, '240,217,160', 0.9);
  ctx.fillStyle = '#f3f7e4';
  ctx.beginPath();
  ctx.arc(W * 0.135, 84, 11, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 14; i++) {
    rect(ctx, i % 2 ? '#b8405a' : '#6d4fa8', hash(i + 9) * W, 14 + hash(i + 60) * 40, 40 + hash(i + 80) * 70, 3);
  }
  ridge(ctx, '#4a3a8c', 96, 20, 2.1);
  ridge(ctx, '#1f2350', 104, 16, 5.6);
  rect(ctx, '#141833', 0, 108, W, H - 108);
}

function paintCity(ctx: Ctx) {
  sky(ctx, [
    [0, '#05060a'],
    [0.6, '#141833'],
    [0.85, '#4a3a8c'],
  ]);
  for (let i = 0; i < 120; i++) rect(ctx, '#c8d4a8', hash(i + 700) * W, hash(i + 900) * 60, 1, 1);
  for (let layer = 0; layer < 2; layer++) {
    let x = 0;
    let i = 0;
    while (x < W) {
      const n = layer * 300 + i++;
      const width = 14 + Math.floor(hash(n + 2) * 26);
      const height = (layer === 0 ? 30 : 46) + Math.floor(hash(n + 8) * (layer === 0 ? 40 : 62));
      const top = 110 - height;
      rect(ctx, layer === 0 ? '#1f2350' : '#0b0d18', x, top, width, height);
      // Lit windows.
      for (let wy = top + 4; wy < 106; wy += 6) {
        for (let wx = x + 3; wx < x + width - 3; wx += 5) {
          const r = hash(n * 13 + wx * 7 + wy * 3);
          if (r > (layer === 0 ? 0.8 : 0.62)) rect(ctx, r > 0.93 ? '#7fd4d8' : '#f0d9a0', wx, wy, 2, 3);
        }
      }
      x += width + Math.floor(hash(n + 5) * 5);
    }
  }
  rect(ctx, '#05060a', 0, 110, W, H - 110);
  for (let i = 0; i < 40; i++) rect(ctx, '#f07a5a', hash(i + 44) * W, 113, 3, 1); // traffic
}

export const ENVIRONMENTS: Record<WorldId, Environment> = {
  nebula: { id: 'nebula', label: 'Nebula', light: 1.3, followsClock: false, paint: paintNebula },
  forest: { id: 'forest', label: 'Forest', light: 4.2, followsClock: true, paint: paintForest, image: '/images/room/forest.jpg' },
  sunset: { id: 'sunset', label: 'Sunset', light: 3.0, followsClock: false, paint: paintSunset, image: '/images/room/sunset.jpg' },
  city: { id: 'city', label: 'City at night', light: 3.0, followsClock: false, paint: paintCity, image: '/images/room/city.jpg' },
};

/**
 * A colour multiplier for the visitor's local time, so the world on the
 * walls keeps the hours they do. Returned as linear r, g, b.
 */
export function timeOfDayTint(date = new Date()): [number, number, number] {
  const h = date.getHours() + date.getMinutes() / 60;
  const night: [number, number, number] = [0.3, 0.36, 0.62];
  const dawn: [number, number, number] = [1.0, 0.8, 0.68];
  const day: [number, number, number] = [1, 1, 1];
  const dusk: [number, number, number] = [1.0, 0.68, 0.52];
  // Hour marks the day passes through, wrapping at midnight.
  const keys: [number, [number, number, number]][] = [
    [0, night],
    [5, night],
    [6.5, dawn],
    [9, day],
    [17, day],
    [19.5, dusk],
    [21.5, night],
    [24, night],
  ];
  for (let i = 0; i < keys.length - 1; i++) {
    const [h0, c0] = keys[i];
    const [h1, c1] = keys[i + 1];
    if (h >= h0 && h <= h1) {
      const t = (h - h0) / (h1 - h0);
      return [c0[0] + (c1[0] - c0[0]) * t, c0[1] + (c1[1] - c0[1]) * t, c0[2] + (c1[2] - c0[2]) * t];
    }
  }
  return day;
}
