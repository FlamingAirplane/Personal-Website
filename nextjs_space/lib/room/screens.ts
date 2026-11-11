// Small 2D drawings used as textures on the things that glow: the view out
// of the window, the computer screen and the arcade screen. They are
// redrawn a few times a second so they move.

type Ctx = CanvasRenderingContext2D;

function rect(ctx: Ctx, color: string, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function halo(ctx: Ctx, cx: number, cy: number, radius: number, rgb: string, alpha: number) {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  g.addColorStop(0, `rgba(${rgb},${alpha})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

// Cheap repeatable pseudo-random number in [0, 1).
function hash(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

export const SKY_SIZE = { w: 140, h: 76 };

/** The world outside the window. A placeholder nebula for now. */
export function paintSky(ctx: Ctx, t: number) {
  const { w, h } = SKY_SIZE;
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#05060a');
  sky.addColorStop(0.55, '#141833');
  sky.addColorStop(1, '#2e2a6b');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  halo(ctx, w * 0.3 + Math.sin(t * 0.1) * 14, h * 0.7, 46, '154,111,196', 0.6);
  halo(ctx, w * 0.75 + Math.cos(t * 0.08) * 12, h * 0.35, 38, '58,143,160', 0.4);
  for (let i = 0; i < 46; i++) {
    const twinkle = Math.sin(t * (0.6 + hash(i + 90) * 1.6) + hash(i + 50) * 6.3);
    if (twinkle < -0.55) continue;
    rect(ctx, twinkle > 0.7 ? '#f3f7e4' : '#c8d4a8', hash(i) * w, hash(i + 200) * h, 1, 1);
  }
}

export const PC_SIZE = { w: 68, h: 40 };

export function paintComputer(ctx: Ctx, t: number) {
  const { w, h } = PC_SIZE;
  rect(ctx, '#1d4a5a', 0, 0, w, h);
  rect(ctx, '#3a8fa0', 5, 6, 30, 3);
  rect(ctx, '#3a8fa0', 5, 13, 46, 3);
  rect(ctx, '#3a8fa0', 5, 20, 22, 3);
  if (Math.sin(t * 4) > 0) rect(ctx, '#7fd4d8', 5, 28, 5, 4);
}

export const ARCADE_SIZE = { w: 42, h: 32 };

/** A ball bouncing over a paddle, to show the machine is on. */
export function paintArcade(ctx: Ctx, t: number) {
  const { w, h } = ARCADE_SIZE;
  rect(ctx, '#1d4a5a', 0, 0, w, h);
  const tri = (v: number) => Math.abs((((v % 2) + 2) % 2) - 1);
  const bx = 1 + tri(t * 0.9) * (w - 4);
  const by = 1 + tri(t * 1.3 + 0.4) * (h - 9);
  rect(ctx, '#7fd4d8', bx, by, 2, 2);
  rect(ctx, '#f3f7e4', Math.min(w - 9, Math.max(1, bx - 3)), h - 4, 8, 2);
}
