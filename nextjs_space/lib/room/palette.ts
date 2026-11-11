// The room's one shared palette. Every pixel that reaches the screen is
// snapped to one of these colours with ordered dithering, which is what makes
// mixed source art read as a single bit-crushed scene.

export const PALETTE_HEX = [
  // nebula
  '#05060a', '#0b0d18', '#141833', '#1f2350', '#2e2a6b', '#4a3a8c', '#6d4fa8', '#9a6fc4',
  // brand olive
  '#0a0c04', '#1a1e10', '#2e3a1c', '#5a6a40', '#94a348', '#c8d4a8', '#f3f7e4',
  // wood and lamp
  '#2a1a14', '#4d2f22', '#7a4a30', '#a8744a', '#d4a56a', '#f0d9a0',
  // greys
  '#3a4048', '#6b7480', '#a4adb8',
  // screens
  '#1d4a5a', '#3a8fa0', '#7fd4d8',
  // accents
  '#b8405a', '#f07a5a',
] as const;

const PALETTE_RGB: [number, number, number][] = PALETTE_HEX.map((hex) => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
]);

// 4x4 Bayer matrix.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const DITHER_STRENGTH = 2;

let lut: Uint8Array | null = null;

// Nearest palette colour for every 5-bit-per-channel RGB value, built once.
function buildLut(): Uint8Array {
  const table = new Uint8Array(32 * 32 * 32);
  for (let r = 0; r < 32; r++) {
    for (let g = 0; g < 32; g++) {
      for (let b = 0; b < 32; b++) {
        const R = (r << 3) | 4;
        const G = (g << 3) | 4;
        const B = (b << 3) | 4;
        let best = 0;
        let bestDist = Infinity;
        for (let i = 0; i < PALETTE_RGB.length; i++) {
          const [pr, pg, pb] = PALETTE_RGB[i];
          const dr = R - pr;
          const dg = G - pg;
          const db = B - pb;
          // Weighted towards how the eye sees brightness.
          const dist = dr * dr * 3 + dg * dg * 4 + db * db * 2;
          if (dist < bestDist) {
            bestDist = dist;
            best = i;
          }
        }
        table[(r << 10) | (g << 5) | b] = best;
      }
    }
  }
  return table;
}

function clamp(v: number) {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

/** Snap an RGBA buffer to the room palette in place. */
export function bitCrush(data: Uint8ClampedArray, width: number, height: number) {
  if (!lut) lut = buildLut();
  let p = 0;
  for (let y = 0; y < height; y++) {
    const row = (y & 3) << 2;
    for (let x = 0; x < width; x++) {
      const d = (BAYER[row | (x & 3)] - 7.5) * DITHER_STRENGTH;
      const r = clamp(data[p] + d) >> 3;
      const g = clamp(data[p + 1] + d) >> 3;
      const b = clamp(data[p + 2] + d) >> 3;
      const c = PALETTE_RGB[lut[(r << 10) | (g << 5) | b]];
      data[p] = c[0];
      data[p + 1] = c[1];
      data[p + 2] = c[2];
      data[p + 3] = 255;
      p += 4;
    }
  }
}
