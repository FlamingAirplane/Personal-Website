// Placeholder painters for the four wall views. Everything here is drawn in
// code so the room is walkable before any real art exists; Phase 2 replaces
// these with bit-crushed images, keeping the same hotspot rectangles.
//
// Each view is painted in two passes so the dark room works:
//   base  - things that only reflect light (walls, furniture)
//   glow  - things that make light (window, screens, LEDs), drawn after the
//           darkness so they still shine with the lights off

import { ROOM_W as W, ROOM_H as H, hotspotRect, type ViewId } from './room-data';

type Ctx = CanvasRenderingContext2D;

export interface PaintState {
  /** Is the room light on? */
  lit: boolean;
  /** Seconds, for anything that moves. */
  t: number;
}

const FLOOR_Y = 120;

function rect(ctx: Ctx, color: string, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function halo(ctx: Ctx, cx: number, cy: number, radius: number, rgb: string, alpha: number) {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  g.addColorStop(0, `rgba(${rgb},${alpha})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

// Cheap repeatable pseudo-random number in [0, 1).
function hash(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function shell(ctx: Ctx) {
  const wall = ctx.createLinearGradient(0, 0, 0, FLOOR_Y);
  wall.addColorStop(0, '#e6e9cc');
  wall.addColorStop(1, '#c8d4a8');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, W, FLOOR_Y);

  const floor = ctx.createLinearGradient(0, FLOOR_Y, 0, H);
  floor.addColorStop(0, '#7a4a30');
  floor.addColorStop(1, '#a8744a');
  ctx.fillStyle = floor;
  ctx.fillRect(0, FLOOR_Y, W, H - FLOOR_Y);

  // Floorboards running towards the viewer.
  ctx.strokeStyle = '#4d2f22';
  ctx.lineWidth = 1;
  for (let i = -9; i <= 9; i++) {
    ctx.beginPath();
    ctx.moveTo(W / 2 + i * 18, FLOOR_Y);
    ctx.lineTo(W / 2 + i * 62, H);
    ctx.stroke();
  }

  rect(ctx, '#4d2f22', 0, FLOOR_Y - 4, W, 4); // skirting board
}

function darkness(ctx: Ctx, t: number) {
  // Bluer than black, so dark surfaces land on the nebula colours.
  ctx.fillStyle = 'rgba(7,8,30,0.9)';
  ctx.fillRect(0, 0, W, H);

  // Slow violet fog: the "nebulous" part of the dark room.
  for (let i = 0; i < 5; i++) {
    const cx = W * (0.1 + i * 0.2) + Math.sin(t * 0.13 + i * 2.1) * 46;
    const cy = 70 + Math.cos(t * 0.09 + i * 1.3) * 46;
    halo(ctx, cx, cy, 78, '74,58,140', 0.26);
  }
  halo(ctx, W / 2 + Math.sin(t * 0.07) * 60, H + 10, 120, '46,42,107', 0.4);
}

/* ---------------------------------- north --------------------------------- */

function northBase(ctx: Ctx, s: PaintState) {
  const win = hotspotRect('north', 'window');
  rect(ctx, '#4d2f22', win.x, win.y, win.w, win.h);
  rect(ctx, '#7a4a30', win.x - 4, win.y + win.h, win.w + 8, 4);

  const sw = hotspotRect('north', 'light-switch');
  rect(ctx, '#a4adb8', sw.x, sw.y, sw.w, sw.h);
  rect(ctx, '#f3f7e4', sw.x + 1, sw.y + 1, sw.w - 2, sw.h - 2);
  rect(ctx, '#6b7480', sw.x + 5, s.lit ? sw.y + 4 : sw.y + 10, 4, 6);
}

function northGlow(ctx: Ctx, s: PaintState) {
  const win = hotspotRect('north', 'window');
  const gx = win.x + 4;
  const gy = win.y + 4;
  const gw = win.w - 8;
  const gh = win.h - 8;

  if (!s.lit) {
    halo(ctx, win.x + win.w / 2, win.y + win.h / 2, 150, '109,79,168', 0.3);
    // Light spilling across the floor.
    ctx.fillStyle = 'rgba(109,79,168,0.2)';
    ctx.beginPath();
    ctx.moveTo(win.x + 10, FLOOR_Y + 2);
    ctx.lineTo(win.x + win.w - 10, FLOOR_Y + 2);
    ctx.lineTo(win.x + win.w + 34, H);
    ctx.lineTo(win.x - 34, H);
    ctx.closePath();
    ctx.fill();
  }

  // The world outside. A placeholder nebula until Phase 2 and Phase 4.
  ctx.save();
  ctx.beginPath();
  ctx.rect(gx, gy, gw, gh);
  ctx.clip();
  const sky = ctx.createLinearGradient(0, gy, 0, gy + gh);
  sky.addColorStop(0, '#05060a');
  sky.addColorStop(0.55, '#141833');
  sky.addColorStop(1, '#2e2a6b');
  ctx.fillStyle = sky;
  ctx.fillRect(gx, gy, gw, gh);
  halo(ctx, gx + gw * 0.3 + Math.sin(s.t * 0.1) * 14, gy + gh * 0.7, 46, '154,111,196', 0.6);
  halo(ctx, gx + gw * 0.75 + Math.cos(s.t * 0.08) * 12, gy + gh * 0.35, 38, '58,143,160', 0.4);
  for (let i = 0; i < 42; i++) {
    const twinkle = Math.sin(s.t * (0.6 + hash(i + 90) * 1.6) + hash(i + 50) * 6.3);
    if (twinkle < -0.55) continue;
    rect(
      ctx,
      twinkle > 0.7 ? '#f3f7e4' : '#c8d4a8',
      gx + hash(i) * gw,
      gy + hash(i + 200) * gh,
      1,
      1,
    );
  }
  ctx.restore();

  // Glazing bars.
  rect(ctx, '#2a1a14', win.x + win.w / 2 - 1, gy, 2, gh);
  rect(ctx, '#2a1a14', gx, win.y + win.h / 2 - 1, gw, 2);

  if (!s.lit) {
    // A small light so the switch can be found in the dark.
    const sw = hotspotRect('north', 'light-switch');
    halo(ctx, sw.x + sw.w / 2, sw.y + 3, 12, '240,122,90', 0.35);
    if (Math.sin(s.t * 2) > -0.4) rect(ctx, '#f07a5a', sw.x + 6, sw.y + 2, 2, 2);
  }
}

/* ---------------------------------- east ---------------------------------- */

function eastBase(ctx: Ctx) {
  // Desk.
  rect(ctx, '#4d2f22', 70, 104, 8, 42);
  rect(ctx, '#4d2f22', 242, 104, 8, 42);
  rect(ctx, '#4d2f22', 66, 106, 188, 6);
  rect(ctx, '#7a4a30', 60, 98, 200, 8);

  // Monitor, keyboard.
  const pc = hotspotRect('east', 'computer');
  const cx = pc.x + pc.w / 2;
  rect(ctx, '#6b7480', cx - 16, pc.y + 48, 32, 4);
  rect(ctx, '#3a4048', cx - 6, pc.y + 40, 12, 8);
  rect(ctx, '#3a4048', pc.x, pc.y, pc.w, 40);
  rect(ctx, '#0b0d18', pc.x + 4, pc.y + 4, pc.w - 8, 32);
  rect(ctx, '#a4adb8', 190, 95, 44, 3);

  // Shelf with books.
  const sh = hotspotRect('east', 'shelf');
  const plankY = sh.y + sh.h - 4;
  rect(ctx, '#7a4a30', sh.x, plankY, sh.w, 4);
  rect(ctx, '#4d2f22', sh.x + 8, plankY + 4, 3, 5);
  rect(ctx, '#4d2f22', sh.x + sh.w - 11, plankY + 4, 3, 5);
  const spines = ['#b8405a', '#1d4a5a', '#94a348', '#4a3a8c', '#d4a56a', '#3a8fa0', '#2e3a1c', '#f07a5a', '#6d4fa8', '#5a6a40'];
  let x = sh.x + 6;
  for (let i = 0; i < spines.length; i++) {
    const w = 4 + Math.floor(hash(i + 7) * 4);
    const h = 14 + Math.floor(hash(i + 31) * 9);
    rect(ctx, spines[i], x, plankY - h, w, h);
    x += w + 1;
  }
}

function eastGlow(ctx: Ctx, s: PaintState) {
  const pc = hotspotRect('east', 'computer');
  const sx = pc.x + 4;
  const sy = pc.y + 4;
  const sw = pc.w - 8;
  if (!s.lit) halo(ctx, pc.x + pc.w / 2, pc.y + 20, 90, '58,143,160', 0.3);
  rect(ctx, '#1d4a5a', sx, sy, sw, 32);
  rect(ctx, '#3a8fa0', sx + 4, sy + 5, 30, 2);
  rect(ctx, '#3a8fa0', sx + 4, sy + 10, 44, 2);
  rect(ctx, '#3a8fa0', sx + 4, sy + 15, 22, 2);
  if (Math.sin(s.t * 4) > 0) rect(ctx, '#7fd4d8', sx + 4, sy + 21, 4, 3);
}

/* ---------------------------------- south --------------------------------- */

function southBase(ctx: Ctx) {
  // Door.
  const d = hotspotRect('south', 'door');
  rect(ctx, '#4d2f22', d.x - 3, d.y - 3, d.w + 6, d.h + 3);
  rect(ctx, '#7a4a30', d.x, d.y, d.w, d.h);
  rect(ctx, '#a8744a', d.x + 8, d.y + 8, d.w - 16, 30);
  rect(ctx, '#a8744a', d.x + 8, d.y + 48, d.w - 16, 34);
  rect(ctx, '#d4a56a', d.x + d.w - 8, d.y + 42, 4, 4);

  // Arcade cabinet.
  const a = hotspotRect('south', 'arcade');
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(a.x - 6, a.y + a.h - 2, a.w + 12, 5);
  rect(ctx, '#1f2350', a.x, a.y, a.w, a.h);
  rect(ctx, '#141833', a.x, a.y, 4, a.h);
  rect(ctx, '#141833', a.x + a.w - 4, a.y, 4, a.h);
  rect(ctx, '#0b0d18', a.x + 6, a.y + 22, a.w - 12, 36);
  rect(ctx, '#4a3a8c', a.x - 2, a.y + 62, a.w + 4, 10);
  rect(ctx, '#3a4048', a.x + 14, a.y + 57, 2, 6);
  rect(ctx, '#b8405a', a.x + 13, a.y + 55, 4, 3);
  rect(ctx, '#f07a5a', a.x + 34, a.y + 64, 4, 3);
  rect(ctx, '#94a348', a.x + 42, a.y + 64, 4, 3);
  rect(ctx, '#0b0d18', a.x + 22, a.y + 80, 16, 14);
  rect(ctx, '#141833', a.x, a.y + a.h - 6, a.w, 6);

  // Toolbox.
  const tb = hotspotRect('south', 'toolbox');
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(tb.x - 3, tb.y + tb.h - 1, tb.w + 6, 4);
  rect(ctx, '#3a4048', tb.x + 16, tb.y, 22, 3);
  rect(ctx, '#3a4048', tb.x + 16, tb.y, 3, 9);
  rect(ctx, '#3a4048', tb.x + 35, tb.y, 3, 9);
  rect(ctx, '#b8405a', tb.x, tb.y + 8, tb.w, tb.h - 8);
  rect(ctx, '#f07a5a', tb.x, tb.y + 8, tb.w, 3);
  rect(ctx, '#2a1a14', tb.x, tb.y + 15, tb.w, 1);
  rect(ctx, '#d4a56a', tb.x + tb.w / 2 - 3, tb.y + 13, 6, 5);
}

function southGlow(ctx: Ctx, s: PaintState) {
  const d = hotspotRect('south', 'door');
  const a = hotspotRect('south', 'arcade');

  if (!s.lit) {
    // Light from the hallway under the door.
    halo(ctx, d.x + d.w / 2, d.y + d.h, 34, '240,217,160', 0.3);
    rect(ctx, '#f0d9a0', d.x + 2, d.y + d.h - 1, d.w - 4, 1);
    halo(ctx, a.x + a.w / 2, a.y + 36, 80, '58,143,160', 0.28);
    halo(ctx, a.x + a.w / 2, a.y + 8, 40, '184,64,90', 0.3);
  }

  // Marquee.
  rect(ctx, '#b8405a', a.x + 4, a.y + 4, a.w - 8, 12);
  rect(ctx, '#f0d9a0', a.x + 10, a.y + 8, 8, 4);
  rect(ctx, '#f0d9a0', a.x + 21, a.y + 8, 14, 4);
  rect(ctx, '#f0d9a0', a.x + 38, a.y + 8, 10, 4);

  // Screen: a ball bouncing, to show the machine is on.
  const sx = a.x + 9;
  const sy = a.y + 25;
  const sw = a.w - 18;
  const sh = 30;
  rect(ctx, '#1d4a5a', sx, sy, sw, sh);
  const tri = (v: number) => Math.abs(((v % 2) + 2) % 2 - 1);
  const bx = sx + 1 + tri(s.t * 0.9) * (sw - 4);
  const by = sy + 1 + tri(s.t * 1.3 + 0.4) * (sh - 8);
  rect(ctx, '#7fd4d8', bx, by, 2, 2);
  rect(ctx, '#f3f7e4', Math.min(sx + sw - 9, Math.max(sx + 1, bx - 3)), sy + sh - 3, 8, 2);

  // Coin slot.
  if (Math.sin(s.t * 1.5) > -0.2) rect(ctx, '#f07a5a', a.x + 28, a.y + 84, 4, 6);
}

/* ---------------------------------- west ---------------------------------- */

function westBase(ctx: Ctx) {
  const c = hotspotRect('west', 'cinema');
  rect(ctx, '#0b0d18', c.x, c.y, c.w, c.h);
  rect(ctx, '#f3f7e4', c.x + 4, c.y + 4, c.w - 8, c.h - 8);

  const hp = hotspotRect('west', 'headphones');
  const cx = hp.x + hp.w / 2;
  rect(ctx, '#6b7480', cx - 1, hp.y, 3, 7);
  ctx.strokeStyle = '#1a1e10';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, hp.y + 19, 11, Math.PI, 0);
  ctx.stroke();
  rect(ctx, '#3a4048', cx - 15, hp.y + 17, 7, 16);
  rect(ctx, '#3a4048', cx + 8, hp.y + 17, 7, 16);
  rect(ctx, '#b8405a', cx - 9, hp.y + 19, 2, 12);
  rect(ctx, '#b8405a', cx + 7, hp.y + 19, 2, 12);
}

function westGlow(ctx: Ctx, s: PaintState) {
  if (s.lit) return;
  const c = hotspotRect('west', 'cinema');
  // The blank screen catches a little light and flickers faintly.
  const flicker = 0.1 + 0.03 * Math.sin(s.t * 9) + 0.02 * Math.sin(s.t * 23);
  ctx.fillStyle = `rgba(164,173,184,${flicker})`;
  ctx.fillRect(c.x + 4, c.y + 4, c.w - 8, c.h - 8);

  const hp = hotspotRect('west', 'headphones');
  const cx = hp.x + hp.w / 2;
  halo(ctx, cx + 11, hp.y + 31, 12, '127,212,216', 0.35);
  if (Math.sin(s.t * 2.4) > -0.3) rect(ctx, '#7fd4d8', cx + 10, hp.y + 30, 2, 2);
}

/* -------------------------------------------------------------------------- */

const BASE: Record<ViewId, (ctx: Ctx, s: PaintState) => void> = {
  north: northBase,
  east: eastBase,
  south: southBase,
  west: westBase,
};

const GLOW: Record<ViewId, (ctx: Ctx, s: PaintState) => void> = {
  north: northGlow,
  east: eastGlow,
  south: southGlow,
  west: westGlow,
};

/** Paint one full wall view at the context's current origin. */
export function paintView(ctx: Ctx, view: ViewId, state: PaintState) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, H);
  ctx.clip();
  shell(ctx);
  BASE[view](ctx, state);
  if (!state.lit) darkness(ctx, state.t);
  GLOW[view](ctx, state);
  ctx.restore();
}
