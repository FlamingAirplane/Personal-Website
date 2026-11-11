'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { buildRoom } from '@/lib/room/build-room';
import { createCrushPass } from '@/lib/room/crush-pass';
import { DEFAULT_WORLD, type WorldId } from '@/lib/room/environments';
import { HOTSPOTS, OBSTACLES, ROOM, START, type Hotspot } from '@/lib/room/room-data';
import { rememberSiteMode } from '@/lib/site-mode';
import { withBase } from '@/lib/site';

const LIT_KEY = 'room-lit';
const MESSAGE_MS = 4500;

// The room is rendered this many pixels along the screen's short side and
// scaled up with hard edges. This is the bit-crushed look.
const SHORT_SIDE = 200;
const LONG_SIDE_MAX = 480;

const WALK_SPEED = 2.6; // metres per second
const KEY_TURN_SPEED = 1.9; // radians per second
const DRAG_LOOK = 0.0045; // radians per pixel dragged
const PITCH_LIMIT = 1.0;
const BODY_RADIUS = 0.3;

/** Where the walk is headed, and what happens on arrival. */
interface Walk {
  x: number;
  z: number;
  yaw?: number;
  pitch?: number;
  onArrive?: () => void;
  stuckFrames: number;
}

/** Controls handed from the 3D loop to the React buttons. */
interface RoomApi {
  visit(spot: Hotspot): void;
  highlight(id: string | null): void;
}

function shortestAngle(from: number, to: number) {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function RoomCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const apiRef = useRef<RoomApi | null>(null);

  const [hoverLabel, setHoverLabel] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'low-power' });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(1);

    const room = buildRoom();
    const crush = createCrushPass();
    const target = new THREE.WebGLRenderTarget(SHORT_SIDE, SHORT_SIDE, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
    });
    crush.setSource(target.texture);

    const camera = new THREE.PerspectiveCamera(62, 1, 0.05, 30);
    camera.rotation.order = 'YXZ';

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Where you are and where you are looking.
    const pose = { x: START.x, z: START.z, yaw: START.yaw, pitch: START.pitch };
    let walk: Walk | null = null;
    let walkPhase = 0;
    let lit = false;
    // The place on the walls when the lights are on: whatever was last inspected.
    let world: WorldId = DEFAULT_WORLD;
    let hoverId: string | null = null;
    const keys = new Set<string>();

    try {
      lit = window.localStorage.getItem(LIT_KEY) === '1';
    } catch {
      /* storage unavailable: start dark */
    }
    room.setState(lit, world, true);

    /* ------------------------------- sizing ------------------------------ */

    const resize = () => {
      const cw = canvas.clientWidth || 1;
      const ch = canvas.clientHeight || 1;
      const aspect = cw / ch;
      const w = aspect >= 1 ? Math.min(LONG_SIDE_MAX, Math.round(SHORT_SIDE * aspect)) : SHORT_SIDE;
      const h = aspect >= 1 ? SHORT_SIDE : Math.min(LONG_SIDE_MAX, Math.round(SHORT_SIDE / aspect));
      renderer.setSize(w, h, false);
      target.setSize(w, h);
      camera.aspect = aspect;
      camera.fov = aspect >= 1 ? 62 : 78; // wider on a phone held upright
      camera.updateProjectionMatrix();
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    /* ------------------------------ movement ----------------------------- */

    const keepInRoom = () => {
      const maxX = ROOM.width / 2 - ROOM.wallMargin;
      const maxZ = ROOM.depth / 2 - ROOM.wallMargin;
      pose.x = Math.max(-maxX, Math.min(maxX, pose.x));
      pose.z = Math.max(-maxZ, Math.min(maxZ, pose.z));
      // Slide around furniture: push out along the shallowest side.
      for (const [x0, x1, z0, z1] of OBSTACLES) {
        const ax0 = x0 - BODY_RADIUS;
        const ax1 = x1 + BODY_RADIUS;
        const az0 = z0 - BODY_RADIUS;
        const az1 = z1 + BODY_RADIUS;
        if (pose.x <= ax0 || pose.x >= ax1 || pose.z <= az0 || pose.z >= az1) continue;
        const pushes: [number, () => void][] = [
          [pose.x - ax0, () => (pose.x = ax0)],
          [ax1 - pose.x, () => (pose.x = ax1)],
          [pose.z - az0, () => (pose.z = az0)],
          [az1 - pose.z, () => (pose.z = az1)],
        ];
        pushes.sort((a, b) => a[0] - b[0]);
        pushes[0][1]();
      }
    };

    const startWalk = (next: Omit<Walk, 'stuckFrames'>) => {
      setShowHint(false);
      if (reducedMotionQuery.matches) {
        // No gliding: arrive at once.
        pose.x = next.x;
        pose.z = next.z;
        if (next.yaw !== undefined) pose.yaw = next.yaw;
        if (next.pitch !== undefined) pose.pitch = next.pitch;
        keepInRoom();
        walk = null;
        next.onArrive?.();
        return;
      }
      walk = { ...next, stuckFrames: 0 };
    };

    const leave = () => {
      rememberSiteMode('standard');
      window.location.assign(withBase('/'));
    };

    const act = (spot: Hotspot) => {
      const action = spot.action;
      if (spot.world && spot.world !== world) {
        world = spot.world;
        room.setState(lit, world);
      }
      if (action.type === 'toggle-light') {
        lit = !lit;
        room.setState(lit, world);
        setMessage(lit ? 'Lights on.' : 'Lights off.');
        try {
          window.localStorage.setItem(LIT_KEY, lit ? '1' : '0');
        } catch {
          /* not remembered, still works */
        }
      } else if (action.type === 'exit') {
        leave();
      } else {
        setMessage(action.line);
      }
    };

    /** Walk up to an object, turn to face it, then use it. */
    const visit = (spot: Hotspot) => {
      const [sx, sz] = spot.stand;
      const dx = spot.center[0] - sx;
      const dy = spot.center[1] - ROOM.eyeHeight;
      const dz = spot.center[2] - sz;
      setMessage(null);
      startWalk({
        x: sx,
        z: sz,
        yaw: Math.atan2(-dx, -dz),
        pitch: Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, Math.atan2(dy, Math.hypot(dx, dz)))),
        onArrive: () => act(spot),
      });
    };

    const highlight = (id: string | null) => {
      if (id === hoverId) return;
      hoverId = id;
      room.setHighlight(id);
      setHoverLabel(id ? (HOTSPOTS.find((h) => h.id === id)?.label ?? null) : null);
    };

    apiRef.current = { visit, highlight };

    /* ------------------------------ pointing ----------------------------- */

    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    const pickTargets: THREE.Object3D[] = [...room.hitVolumes, room.floor];

    const pick = (clientX: number, clientY: number) => {
      const bounds = canvas.getBoundingClientRect();
      pointerNdc.set(
        ((clientX - bounds.left) / bounds.width) * 2 - 1,
        -((clientY - bounds.top) / bounds.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointerNdc, camera);
      const hit = raycaster.intersectObjects(pickTargets, false)[0];
      if (!hit) return null;
      const id = hit.object.userData.hotspotId as string | undefined;
      const spot = id ? HOTSPOTS.find((h) => h.id === id) : undefined;
      return spot ? { spot } : { floor: hit.point };
    };

    let press: { id: number; x: number; y: number; lastX: number; lastY: number; dragging: boolean } | null = null;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      press = { id: e.pointerId, x: e.clientX, y: e.clientY, lastX: e.clientX, lastY: e.clientY, dragging: false };
      canvas.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (press && e.pointerId === press.id) {
        if (!press.dragging && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 6) {
          press.dragging = true;
          walk = null; // looking around takes over from an automatic turn
          highlight(null);
          setShowHint(false);
        }
        if (press.dragging) {
          // Drag the view like grabbing the scene.
          pose.yaw += (e.clientX - press.lastX) * DRAG_LOOK;
          pose.pitch = Math.max(
            -PITCH_LIMIT,
            Math.min(PITCH_LIMIT, pose.pitch + (e.clientY - press.lastY) * DRAG_LOOK),
          );
        }
        press.lastX = e.clientX;
        press.lastY = e.clientY;
        return;
      }
      if (e.pointerType === 'mouse') {
        const hit = pick(e.clientX, e.clientY);
        highlight(hit && 'spot' in hit && hit.spot ? hit.spot.id : null);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!press || e.pointerId !== press.id) return;
      const wasDrag = press.dragging;
      press = null;
      if (wasDrag) return;
      const hit = pick(e.clientX, e.clientY);
      if (!hit) return;
      if ('spot' in hit && hit.spot) {
        visit(hit.spot);
      } else if ('floor' in hit && hit.floor) {
        setMessage(null);
        startWalk({ x: hit.floor.x, z: hit.floor.z });
      }
    };

    const onPointerLeave = () => highlight(null);

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('pointerleave', onPointerLeave);

    const MOVE_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'];
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (!MOVE_KEYS.includes(key) || e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      keys.add(key);
      walk = null;
      setShowHint(false);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key);
    };
    const onBlur = () => keys.clear();
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    /* ------------------------------ the loop ----------------------------- */

    let raf = 0;
    let last = performance.now();

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const reducedMotion = reducedMotionQuery.matches;

      const beforeX = pose.x;
      const beforeZ = pose.z;

      // Keyboard: turn with left/right, walk with up/down.
      const turn =
        (keys.has('ArrowLeft') || keys.has('a') ? 1 : 0) - (keys.has('ArrowRight') || keys.has('d') ? 1 : 0);
      const advance =
        (keys.has('ArrowUp') || keys.has('w') ? 1 : 0) - (keys.has('ArrowDown') || keys.has('s') ? 1 : 0);
      pose.yaw += turn * KEY_TURN_SPEED * dt;
      if (advance) {
        pose.x += -Math.sin(pose.yaw) * advance * WALK_SPEED * dt;
        pose.z += -Math.cos(pose.yaw) * advance * WALK_SPEED * dt;
      }

      if (walk) {
        const dx = walk.x - pose.x;
        const dz = walk.z - pose.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 0.001) {
          // Ease in to the destination.
          const step = Math.min(dist, Math.min(WALK_SPEED, dist * 4 + 0.5) * dt);
          pose.x += (dx / dist) * step;
          pose.z += (dz / dist) * step;
        }
        const ease = 1 - Math.exp(-7 * dt);
        let turning = 0;
        if (walk.yaw !== undefined) {
          const d = shortestAngle(pose.yaw, walk.yaw);
          pose.yaw += d * ease;
          turning = Math.max(turning, Math.abs(d));
        }
        if (walk.pitch !== undefined) {
          const d = walk.pitch - pose.pitch;
          pose.pitch += d * ease;
          turning = Math.max(turning, Math.abs(d));
        }
        keepInRoom();
        const moved = Math.hypot(pose.x - beforeX, pose.z - beforeZ);
        // Furniture in the way: give up on getting closer once we stop making progress.
        walk.stuckFrames = moved < 0.0005 && dist > 0.05 ? walk.stuckFrames + 1 : 0;
        const there = dist < 0.04 || walk.stuckFrames > 12;
        if (there && turning < 0.03) {
          const onArrive = walk.onArrive;
          walk = null;
          onArrive?.();
        }
      } else {
        keepInRoom();
      }

      // A small bob while walking.
      const moved = Math.hypot(pose.x - beforeX, pose.z - beforeZ);
      if (moved > 0.0005 && !reducedMotion) walkPhase += moved * 5.5;
      const bob = reducedMotion ? 0 : Math.sin(walkPhase) * 0.022;

      camera.position.set(pose.x, ROOM.eyeHeight + bob, pose.z);
      camera.rotation.set(pose.pitch, pose.yaw, 0);

      room.update(now / 1000, dt, reducedMotion);

      renderer.setRenderTarget(target);
      renderer.render(room.scene, camera);
      renderer.setRenderTarget(null);
      renderer.render(crush.scene, crush.camera);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      apiRef.current = null;
      resizeObserver.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      room.dispose();
      crush.dispose();
      target.dispose();
      renderer.dispose();
    };
  }, []);

  // Spoken lines fade on their own.
  useEffect(() => {
    if (!message) return;
    const id = window.setTimeout(() => setMessage(null), MESSAGE_MS);
    return () => window.clearTimeout(id);
  }, [message]);

  const leave = () => {
    rememberSiteMode('standard');
    window.location.assign(withBase('/'));
  };

  const caption = message ?? hoverLabel ?? (showHint ? 'Click to walk. Drag to look around.' : '');

  return (
    <main className="fixed inset-0 select-none overflow-hidden bg-[#05060a] font-mono">
      <h1 className="sr-only">Adine Johnson&apos;s room</h1>

      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full touch-none"
        style={{ imageRendering: 'pixelated' }}
      />

      {failed && (
        <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-[#c8d4a8]">
          The room needs WebGL, which this browser has switched off. The standard site has everything too.
        </p>
      )}

      <button
        type="button"
        onClick={leave}
        className="absolute right-3 top-3 z-10 bg-[#05060a]/70 px-3 py-2 text-xs uppercase tracking-widest text-[#c8d4a8] transition-colors hover:text-[#f3f7e4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#94a348]"
      >
        Standard site
      </button>

      {/* The same objects as a list, for keyboards and screen readers.
          Hidden until one of its buttons is focused. */}
      <nav
        aria-label="Things in the room"
        className="absolute left-3 top-3 z-10 flex max-w-[60%] flex-wrap gap-1 opacity-0 focus-within:opacity-100"
      >
        {HOTSPOTS.map((spot) => (
          <button
            key={spot.id}
            type="button"
            onClick={() => apiRef.current?.visit(spot)}
            onFocus={() => apiRef.current?.highlight(spot.id)}
            onBlur={() => apiRef.current?.highlight(null)}
            className="bg-[#05060a]/80 px-2 py-1 text-xs text-[#c8d4a8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#94a348]"
          >
            {spot.label}
          </button>
        ))}
      </nav>

      <p
        aria-live="polite"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex min-h-[3rem] items-center justify-center px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-center text-sm text-[#f3f7e4] [text-shadow:0_1px_0_#05060a,0_0_8px_#05060a]"
      >
        {caption}
      </p>
    </main>
  );
}
