// Finds a way across the room that goes around the furniture.
//
// Furniture is a list of rectangles on the floor. Each is grown by the
// walker's radius, and a route is the shortest chain of straight lines from
// A to B that only turns at the corners of those grown rectangles.

export interface Point {
  x: number;
  z: number;
}

type Rect = [x0: number, x1: number, z0: number, z1: number];

export interface Navigator {
  /** Move a point to the nearest place the walker can actually stand. */
  clamp(p: Point): Point;
  /** The points to walk through, in order, ending at (a clamped) `to`. */
  route(from: Point, to: Point): Point[];
}

/** How far outside a grown rectangle its corner waypoints sit. */
const CLEARANCE = 0.02;

export function createNavigator(
  obstacles: Rect[],
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number },
  radius: number,
): Navigator {
  const rects: Rect[] = obstacles.map(([x0, x1, z0, z1]) => [x0 - radius, x1 + radius, z0 - radius, z1 + radius]);

  const inBounds = (p: Point) =>
    p.x >= bounds.minX && p.x <= bounds.maxX && p.z >= bounds.minZ && p.z <= bounds.maxZ;

  const insideAny = (p: Point) => rects.some(([x0, x1, z0, z1]) => p.x > x0 && p.x < x1 && p.z > z0 && p.z < z1);

  /** Does the straight line a-b pass through the inside of the rectangle? */
  const crosses = (a: Point, b: Point, [x0, x1, z0, z1]: Rect) => {
    // Shrink a hair, so a line that only touches an edge or corner is allowed.
    const e = 1e-3;
    let t0 = 0;
    let t1 = 1;
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const slabs: [number, number, number, number][] = [
      [dx, a.x, x0 + e, x1 - e],
      [dz, a.z, z0 + e, z1 - e],
    ];
    for (const [d, start, min, max] of slabs) {
      if (Math.abs(d) < 1e-9) {
        if (start <= min || start >= max) return false;
      } else {
        let enter = (min - start) / d;
        let exit = (max - start) / d;
        if (enter > exit) [enter, exit] = [exit, enter];
        t0 = Math.max(t0, enter);
        t1 = Math.min(t1, exit);
        if (t0 >= t1) return false;
      }
    }
    return true;
  };

  const blocked = (a: Point, b: Point) => rects.some((r) => crosses(a, b, r));

  // Waypoints: the corners of every grown rectangle, nudged outwards.
  const corners: Point[] = [];
  for (const [x0, x1, z0, z1] of rects) {
    for (const p of [
      { x: x0 - CLEARANCE, z: z0 - CLEARANCE },
      { x: x1 + CLEARANCE, z: z0 - CLEARANCE },
      { x: x0 - CLEARANCE, z: z1 + CLEARANCE },
      { x: x1 + CLEARANCE, z: z1 + CLEARANCE },
    ]) {
      if (inBounds(p) && !insideAny(p)) corners.push(p);
    }
  }

  const clamp = (point: Point): Point => {
    const p = {
      x: Math.max(bounds.minX, Math.min(bounds.maxX, point.x)),
      z: Math.max(bounds.minZ, Math.min(bounds.maxZ, point.z)),
    };
    // Pushing out of one rectangle can land in another, so try a few times.
    for (let pass = 0; pass < 4 && insideAny(p); pass++) {
      for (const [x0, x1, z0, z1] of rects) {
        if (!(p.x > x0 && p.x < x1 && p.z > z0 && p.z < z1)) continue;
        // Candidate exits through each side that stay inside the room.
        const exits: (Point & { cost: number })[] = [
          { x: x0 - CLEARANCE, z: p.z, cost: p.x - x0 },
          { x: x1 + CLEARANCE, z: p.z, cost: x1 - p.x },
          { x: p.x, z: z0 - CLEARANCE, cost: p.z - z0 },
          { x: p.x, z: z1 + CLEARANCE, cost: z1 - p.z },
        ].filter(inBounds);
        if (exits.length === 0) continue;
        exits.sort((a, b) => a.cost - b.cost);
        p.x = exits[0].x;
        p.z = exits[0].z;
      }
    }
    return p;
  };

  const route = (from: Point, target: Point): Point[] => {
    const to = clamp(target);
    if (!blocked(from, to)) return [to];

    // Shortest path over: start, every corner, goal.
    const nodes = [from, ...corners, to];
    const goal = nodes.length - 1;
    const dist = nodes.map(() => Infinity);
    const prev = nodes.map(() => -1);
    const done = nodes.map(() => false);
    dist[0] = 0;

    for (;;) {
      let current = -1;
      for (let i = 0; i < nodes.length; i++) {
        if (!done[i] && (current === -1 || dist[i] < dist[current])) current = i;
      }
      if (current === -1 || dist[current] === Infinity || current === goal) break;
      done[current] = true;
      for (let i = 0; i < nodes.length; i++) {
        if (done[i] || blocked(nodes[current], nodes[i])) continue;
        const d = dist[current] + Math.hypot(nodes[i].x - nodes[current].x, nodes[i].z - nodes[current].z);
        if (d < dist[i]) {
          dist[i] = d;
          prev[i] = current;
        }
      }
    }

    // No way through (should not happen in this room): walk straight and
    // let the collision check stop us where it must.
    if (dist[goal] === Infinity) return [to];

    const path: Point[] = [];
    for (let i = goal; i > 0; i = prev[i]) path.unshift(nodes[i]);
    return path;
  };

  return { clamp, route };
}
