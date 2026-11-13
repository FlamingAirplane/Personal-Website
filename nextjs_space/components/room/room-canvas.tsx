'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { buildRoom } from '@/lib/room/build-room';
import { createCrushPass } from '@/lib/room/crush-pass';
import type { WorldId } from '@/lib/room/environments';
import { createNavigator, type Point } from '@/lib/room/pathfinding';
import { HOTSPOTS, OBSTACLES, ROOM, START, type Hotspot, type PanelId } from '@/lib/room/room-data';
import { applyRoomSettings, RS } from '@/lib/room/room-settings';
import { useSiteContent } from '@/lib/preview';
import { rememberSiteMode } from '@/lib/site-mode';
import { withBase } from '@/lib/site';
import { RoomPanel } from './room-panel';
import { TvPanel } from './tv-panel';
import type { Room } from '@/lib/room/build-room';

const LIT_KEY = 'room-lit';

/** A walk in progress, and what happens on arrival. */
interface Walk {
  /** Points still to walk through, going around furniture; the last is the destination. */
  path: Point[];
  yaw?: number;
  pitch?: number;
  onArrive?: () => void;
  stuckFrames: number;
}

/** Controls handed from the 3D loop to the React buttons. */
interface RoomApi {
  visit(spot: Hotspot): void;
  highlight(id: string | null): void;
  /** Walk to the spot in front of the TV and face it. */
  watchTv(): void;
}

function shortestAngle(from: number, to: number) {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function leave() {
  rememberSiteMode('standard');
  window.location.assign(withBase('/'));
}

export function RoomCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const apiRef = useRef<RoomApi | null>(null);
  const { roomSettings } = useSiteContent();
  useMemo(() => applyRoomSettings(roomSettings), [roomSettings]);

  const [hoverLabel, setHoverLabel] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [panel, setPanel] = useState<PanelId | null>(null);
  const roomRef = useRef<Room | null>(null);
  const [tvOn, setTvOn] = useState(false);
  const [tvMenu, setTvMenu] = useState(false);
  const tvOnRef = useRef(false);
  tvOnRef.current = tvOn;
  const [showHint, setShowHint] = useState(true);
  const [ready, setReady] = useState(false);
  const [touch, setTouch] = useState(false);
  // "unsupported": no WebGL at all. "lost": the browser took the 3D context away.
  const [problem, setProblem] = useState<null | 'unsupported' | 'lost'>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setTouch(window.matchMedia('(pointer: coarse)').matches);

    const SHORT_SIDE = RS.resolution;
    const LONG_SIDE_MAX = RS.resolutionLongSide;
    const WALK_SPEED = RS.walkSpeed;
    const KEY_TURN_SPEED = RS.turnSpeed;
    const DRAG_LOOK = RS.lookSensitivity / 1000;
    const PITCH_LIMIT = (RS.lookLimit * Math.PI) / 180;
    const IDLE_FRAME_MS = RS.idleFrameMs;
    const BOUNDS = {
      minX: -(ROOM.width / 2 - ROOM.wallMargin),
      maxX: ROOM.width / 2 - ROOM.wallMargin,
      minZ: -(ROOM.depth / 2 - ROOM.wallMargin),
      maxZ: ROOM.depth / 2 - ROOM.wallMargin,
    };
    const navigator2d = createNavigator(OBSTACLES, BOUNDS, ROOM.bodyRadius);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'low-power' });
    } catch {
      setProblem('unsupported');
      return;
    }
    renderer.setPixelRatio(1);

    const room = buildRoom();
    roomRef.current = room;
    const crush = createCrushPass();
    const target = new THREE.WebGLRenderTarget(SHORT_SIDE, SHORT_SIDE, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
    });
    crush.setSource(target.texture);

    const camera = new THREE.PerspectiveCamera(62, 1, 0.05, RS.viewDistance);
    camera.rotation.order = 'YXZ';

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Where you are and where you are looking.
    const pose = { x: START.x, z: START.z, yaw: START.yaw, pitch: START.pitch };
    let walk: Walk | null = null;
    let walkPhase = 0;
    let lit = RS.startLit;
    // The place on the walls when the lights are on: whatever was last inspected.
    let world: WorldId = RS.defaultWorld;
    let hoverId: string | null = null;
    const keys = new Set<string>();

    try {
      const saved = window.localStorage.getItem(LIT_KEY);
      if (saved !== null) lit = saved === '1';
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
      camera.fov = aspect >= 1 ? RS.fovLandscape : RS.fovPortrait; // wider on a phone held upright
      camera.updateProjectionMatrix();
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    /* ------------------------------ movement ----------------------------- */

    // The safety net under the route-finding: whatever moved you, you end up
    // inside the walls and outside the furniture.
    const keepInRoom = () => {
      pose.x = Math.max(BOUNDS.minX, Math.min(BOUNDS.maxX, pose.x));
      pose.z = Math.max(BOUNDS.minZ, Math.min(BOUNDS.maxZ, pose.z));
      // Slide around furniture: push out along the shallowest side.
      for (const [x0, x1, z0, z1] of OBSTACLES) {
        const ax0 = x0 - ROOM.bodyRadius;
        const ax1 = x1 + ROOM.bodyRadius;
        const az0 = z0 - ROOM.bodyRadius;
        const az1 = z1 + ROOM.bodyRadius;
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

    const startWalk = (to: Point, then: Pick<Walk, 'yaw' | 'pitch' | 'onArrive'> = {}) => {
      setShowHint(false);
      const path = navigator2d.route({ x: pose.x, z: pose.z }, to);
      if (reducedMotionQuery.matches) {
        // No gliding: arrive at once.
        const end = path[path.length - 1];
        pose.x = end.x;
        pose.z = end.z;
        if (then.yaw !== undefined) pose.yaw = then.yaw;
        if (then.pitch !== undefined) pose.pitch = then.pitch;
        keepInRoom();
        walk = null;
        then.onArrive?.();
        return;
      }
      walk = { path, ...then, stuckFrames: 0 };
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
        setMessage(lit ? RS.lightsOnLine : RS.lightsOffLine);
        try {
          window.localStorage.setItem(LIT_KEY, lit ? '1' : '0');
        } catch {
          /* not remembered, still works */
        }
      } else if (action.type === 'exit') {
        leave();
      } else if (action.type === 'remote') {
        setMessage(null);
        setPanel(null);
        room.tv.setPower(true);
        setTvOn(true);
        setTvMenu(true);
      } else if (spot.id === 'tv' && tvOnRef.current) {
        setMessage(null);
        setPanel(null);
        setTvMenu(true);
      } else if (spot.panel) {
        setMessage(null);
        setPanel(spot.panel);
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
      setPanel(null);
      setTvMenu(false);
      startWalk(
        { x: sx, z: sz },
        {
          yaw: Math.atan2(-dx, -dz),
          pitch: Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, Math.atan2(dy, Math.hypot(dx, dz)))),
          onArrive: () => act(spot),
        },
      );
    };

    const highlight = (id: string | null) => {
      if (id === hoverId) return;
      hoverId = id;
      room.setHighlight(id);
      // The site's custom cursor grows over anything marked like this.
      canvas.dataset.cursorHover = id ? 'true' : 'false';
      setHoverLabel(id ? (HOTSPOTS.find((h) => h.id === id)?.label ?? null) : null);
    };

    const watchTv = () => {
      const tv = HOTSPOTS.find((h) => h.id === 'tv');
      if (!tv) return;
      const [sx, sz] = tv.stand;
      const dx = tv.center[0] - sx;
      const dz = tv.center[2] - sz;
      startWalk(
        { x: sx, z: sz },
        {
          yaw: Math.atan2(-dx, -dz),
          pitch: Math.atan2(tv.center[1] - ROOM.eyeHeight, Math.hypot(dx, dz)),
        },
      );
    };

    apiRef.current = { visit, highlight, watchTv };

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
    let drawnOnce = false;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);

      // Standing still with nothing changing: no need for every frame.
      const active = walk !== null || keys.size > 0 || (press?.dragging ?? false) || room.busy() || !drawnOnce;
      if (!active && now - last < IDLE_FRAME_MS) return;

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
        const next = walk.path[0];
        const isLast = walk.path.length === 1;
        const dx = next.x - pose.x;
        const dz = next.z - pose.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 0.001) {
          // Full speed around corners; ease in only to the destination.
          const speed = isLast ? Math.min(WALK_SPEED, dist * 4 + 0.5) : WALK_SPEED;
          const step = Math.min(dist, speed * dt);
          pose.x += (dx / dist) * step;
          pose.z += (dz / dist) * step;
        }
        if (!isLast && dist < 0.06) walk.path.shift();

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
        // Something still in the way: give up once we stop making progress.
        walk.stuckFrames = moved < 0.0005 && dist > 0.05 ? walk.stuckFrames + 1 : 0;
        const there = (isLast && dist < 0.04) || walk.stuckFrames > 12;
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
      const bob = reducedMotion ? 0 : Math.sin(walkPhase) * RS.walkBob;

      camera.position.set(pose.x, ROOM.eyeHeight + bob, pose.z);
      camera.rotation.set(pose.pitch, pose.yaw, 0);

      room.update(now / 1000, dt, reducedMotion);

      renderer.setRenderTarget(target);
      renderer.render(room.scene, camera);
      renderer.setRenderTarget(null);
      renderer.render(crush.scene, crush.camera);

      if (!drawnOnce) {
        drawnOnce = true;
        setReady(true);
      }
    };
    raf = requestAnimationFrame(frame);

    // Browsers can take the 3D context away, mostly on phones short of memory.
    const onContextLost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(raf);
      setProblem('lost');
    };
    canvas.addEventListener('webglcontextlost', onContextLost);

    return () => {
      cancelAnimationFrame(raf);
      apiRef.current = null;
      roomRef.current = null;
      resizeObserver.disconnect();
      canvas.removeEventListener('webglcontextlost', onContextLost);
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
    const id = window.setTimeout(() => setMessage(null), RS.messageSeconds * 1000);
    return () => window.clearTimeout(id);
  }, [message]);

  const closeTvMenu = useCallback(() => setTvMenu(false), []);
  const powerOffTv = useCallback(() => {
    roomRef.current?.tv.setPower(false);
    setTvMenu(false);
    setTvOn(false);
  }, []);
  const setTvVideo = useCallback((video: HTMLVideoElement | null) => roomRef.current?.tv.setVideo(video), []);
  const setTvStandby = useCallback((text: string) => roomRef.current?.tv.setStandby(text), []);
  const watchTv = useCallback(() => apiRef.current?.watchTv(), []);

  const hint = touch ? RS.hintTouch : RS.hintMouse;
  const caption = message ?? hoverLabel ?? (showHint && ready ? hint : '');

  return (
    <main className="fixed inset-0 select-none overflow-hidden bg-[#05060a] font-mono">
      <h1 className="sr-only">Adine Johnson&apos;s room</h1>

      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full touch-none"
        style={{ imageRendering: 'pixelated' }}
      />

      {!ready && !problem && (
        <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm uppercase tracking-widest text-[#8a9a70]">
          Loading the room…
        </p>
      )}

      {problem && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 bg-[#05060a] px-6 text-center text-sm text-[#c8d4a8]">
          <p className="max-w-md">
            {problem === 'unsupported'
              ? 'The room needs WebGL, which this browser has switched off. The standard site has everything too.'
              : 'The room lost its connection to the graphics card. Reloading usually brings it back.'}
          </p>
          <div className="flex gap-4">
            {problem === 'lost' && (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="border border-[#94a348] bg-[#94a348] px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#0a0c04]"
              >
                Reload
              </button>
            )}
            <button
              type="button"
              onClick={leave}
              className="border border-[#2e3a1c] px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#c8d4a8]"
            >
              Standard site
            </button>
          </div>
        </div>
      )}

      {panel && <RoomPanel id={panel} onClose={() => setPanel(null)} />}

      {tvOn && (
        <TvPanel
          menuOpen={tvMenu}
          onCloseMenu={closeTvMenu}
          onPowerOff={powerOffTv}
          onVideo={setTvVideo}
          onStandby={setTvStandby}
          onWatch={watchTv}
        />
      )}

      <button
        type="button"
        onClick={leave}
        className="absolute right-3 top-3 z-10 bg-[#05060a]/70 px-3 py-2 text-xs uppercase tracking-widest text-[#c8d4a8] transition-colors hover:text-[#f3f7e4]"
      >
        Standard site
      </button>

      {/* The same objects as a list, for keyboards and screen readers. It is
          invisible, and ignores the mouse, until one of its buttons is focused. */}
      <nav
        aria-label="Things in the room"
        className="pointer-events-none absolute left-3 top-3 z-10 flex max-w-[60%] flex-wrap gap-1 opacity-0 focus-within:pointer-events-auto focus-within:opacity-100"
      >
        {HOTSPOTS.map((spot) => (
          <button
            key={spot.id}
            type="button"
            onClick={() => apiRef.current?.visit(spot)}
            onFocus={() => apiRef.current?.highlight(spot.id)}
            onBlur={() => apiRef.current?.highlight(null)}
            className="bg-[#05060a]/80 px-2 py-1 text-xs text-[#c8d4a8]"
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
