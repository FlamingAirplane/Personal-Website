// Small 2D drawings used as textures on the things that glow: the computer
// screen and the arcade screen. They are redrawn a few times a second so
// they move.

type Ctx = CanvasRenderingContext2D;

function rect(ctx: Ctx, color: string, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

export const PC_SIZE = { w: 64, h: 36 };

export function paintComputer(ctx: Ctx, t: number) {
  const { w, h } = PC_SIZE;
  rect(ctx, '#1d4a5a', 0, 0, w, h);
  rect(ctx, '#3a8fa0', 5, 6, 30, 3);
  rect(ctx, '#3a8fa0', 5, 13, 46, 3);
  rect(ctx, '#3a8fa0', 5, 20, 22, 3);
  if (Math.sin(t * 4) > 0) rect(ctx, '#7fd4d8', 5, 27, 5, 4);
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
