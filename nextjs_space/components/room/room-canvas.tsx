'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { Resolver } from '@/lib/room/assets';
import { buildRoom, type Room, type RuntimeHotspot } from '@/lib/room/build-room';
import type { RoomConfig } from '@/lib/room/config';
import { createCrushPass, type CrushPass } from '@/lib/room/crush-pass';
import { rememberSiteMode } from '@/lib/site-mode';
import { withBase } from '@/lib/site';
import type { PanelId } from '@/lib/room/room-data';
import { RoomPanel } from './room-panel';

const LIT_KEY = 'room-lit';
const MESSAGE_MS = 4500;

/** Settings for the admin preview. */
export interface EditorHooks {
  /** The item to outline in green. */
  selectedId: string | null;
  /** Called when an item is clicked in the preview. */
  onSelect: (id: string) => void;
  /** Change `n` to make the preview walk up to `id`. */
  visit?: { id: string; n: number } | null;
}

interface Props {
  config: RoomConfig;
  /** Turns a file reference from the config into an address. */
  resolve: Resolver;
  editor?: EditorHooks;
}

/** The card shown when you look at an item that has one. */
interface CardView {
  title: string;
  text: string;
  imageUrl: string;
  link: string;
  linkLabel: string;
}

/** A walk in progress, and what happens on arrival. */
interface Walk {
  /** Points still to walk through, going around furniture; the last is the destination. */
  path: { x: number; z: number }[];
  yaw?: number;
  pitch?: number;
  onArrive?: () => void;
  stuckFrames: number;
}

/** Controls handed from the 3D loop to React. */
interface RoomApi {
  apply(config: RoomConfig, resolve: Resolver, editing: boolean): void;
  visit(id: string): void;
  setSelected(id: string | null): void;
  highlight(id: string | null): void;
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

export function RoomCanvas({ config, resolve, editor }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const apiRef = useRef<RoomApi | null>(null);
  // The latest props, for the long-lived handlers inside the effect below.
  const live = useRef({ config, resolve, editor });
  live.current = { config, resolve, editor };

  const [hoverLabel, setHoverLabel] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [card, setCard] = useState<CardView | null>(null);
  const [panel, setPanel] = useState<PanelId | null>(null);
  const [showHint, setShowHint] = useState(true);
  const [ready, setReady] = useState(false);
  const [touch, setTouch] = useState(false);
  const [items, setItems] = useState<{ id: string; label: string }[]>([]);
  // "unsupported": no WebGL at all. "lost": the browser took the 3D context away.
  const [problem, setProblem] = useState<null | 'unsupported' | 'lost'>(null);

  /* -------------------- the renderer, the loop and the controls -------------------- */

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setTouch(window.matchMedia('(pointer: coarse)').matches);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'low-power' });
    } catch {
      setProblem('unsupported');
      return;
    }
    renderer.setPixelRatio(1);

    let cfg = live.current.config;
    let room: Room | null = null;
    let crush: CrushPass | null = null;
    let editing = false;
    let seenRevision = -1;

    const target = new THREE.WebGLRenderTarget(cfg.look.shortSide, cfg.look.shortSide, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
    });
    const camera = new THREE.PerspectiveCamera(62, 1, 0.05, 40);
    camera.rotation.order = 'YXZ';
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Where you are and where you are looking.
    const pose = { x: 0, z: 0, yaw: 0, pitch: 0 };
    let walk: Walk | null = null;
    let walkPhase = 0;
    let lit = false;
    let world = cfg.worlds.defaultWorld;
    let hoverId: string | null = null;
    let selectedId: string | null = null;
    const keys = new Set<string>();

    const pitchLimit = () => THREE.MathUtils.degToRad(cfg.player.pitchLimit);

    /* ------------------------------- sizing ------------------------------ */

    const resize = () => {
      const { shortSide, longSideMax } = cfg.look;
      const cw = canvas.clientWidth || 1;
      const ch = canvas.clientHeight || 1;
      const aspect = cw / ch;
      const w = aspect >= 1 ? Math.min(longSideMax, Math.round(shortSide * aspect)) : shortSide;
      const h = aspect >= 1 ? shortSide : Math.min(longSideMax, Math.round(shortSide / aspect));
      renderer.setSize(w, h, false);
      target.setSize(w, h);
      camera.aspect = aspect;
      camera.fov = aspect >= 1 ? cfg.player.fov : cfg.player.fovPortrait;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    /* ------------------------------ movement ----------------------------- */

    // The safety net under the route-finding: whatever moved you, you end up
    // inside the walls and outside the furniture.
    const keepInRoom = () => {
      if (!room) return;
      const { bounds, obstacles } = room.layout;
      pose.x = Math.max(bounds.minX, Math.min(bounds.maxX, pose.x));
      pose.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, pose.z));
      const r = cfg.room.bodyRadius;
      // Slide around furniture: push out along the shallowest side.
      for (const [x0, x1, z0, z1] of obstacles) {
        const ax0 = x0 - r;
        const ax1 = x1 + r;
        const az0 = z0 - r;
        const az1 = z1 + r;
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

    const startWalk = (to: { x: number; z: number }, then: Pick<Walk, 'yaw' | 'pitch' | 'onArrive'> = {}) => {
      if (!room) return;
      setShowHint(false);
      setCard(null);
      setPanel(null);
      const path = room.layout.navigator.route({ x: pose.x, z: pose.z }, to);
      if (reducedMotionQuery.matches || !cfg.player.glide) {
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

    const act = (spot: RuntimeHotspot) => {
      if (!room) return;
      const action = spot.action;
      if (spot.world && spot.world !== world) {
        world = spot.world;
        room.setState(lit, world);
      }
      if (action.type === 'toggle-light') {
        lit = !lit;
        room.setState(lit, world);
        setMessage(lit ? cfg.text.lightsOn : cfg.text.lightsOff);
        try {
          window.localStorage.setItem(LIT_KEY, lit ? '1' : '0');
        } catch {
          /* not remembered, still works */
        }
      } else if (action.type === 'exit') {
        leave();
      } else if (action.type === 'inspect' && spot.panel && !live.current.editor) {
        // The site's own content (games, work, about...) opens in front of the room.
        setMessage(null);
        setPanel(spot.panel);
      } else if (action.type === 'inspect') {
        if (action.line) setMessage(action.line);
        if (spot.card) {
          setCard({
            title: spot.card.title,
            text: spot.card.text,
            imageUrl: live.current.resolve(spot.card.image),
            link: spot.card.link,
            linkLabel: spot.card.linkLabel,
          });
        }
      }
    };

    /** Walk up to an object, turn to face it, then use it. */
    const visit = (spot: RuntimeHotspot) => {
      const [sx, sz] = spot.stand;
      const dx = spot.center[0] - sx;
      const dy = spot.center[1] - cfg.room.eyeHeight;
      const dz = spot.center[2] - sz;
      setMessage(null);
      live.current.editor?.onSelect(spot.id);
      const limit = pitchLimit();
      startWalk(
        { x: sx, z: sz },
        {
          yaw: Math.atan2(-dx, -dz),
          pitch: Math.max(-limit, Math.min(limit, Math.atan2(dy, Math.hypot(dx, dz)))),
          onArrive: () => act(spot),
        },
      );
    };

    const highlight = (id: string | null) => {
      if (id === hoverId) return;
      hoverId = id;
      room?.setHighlight(hoverId, selectedId);
      // The site's custom cursor grows over anything marked like this.
      canvas.dataset.cursorHover = id ? 'true' : 'false';
      setHoverLabel(id ? (room?.layout.hotspots.find((h) => h.id === id)?.label ?? null) : null);
    };

    /** Build (or rebuild) the room from a config, keeping where you are and where you look. */
    const apply = (next: RoomConfig, resolver: Resolver, editMode: boolean) => {
      const first = room === null;
      const prev = cfg;
      cfg = next;
      editing = editMode;
      room?.dispose();
      crush?.dispose();
      room = buildRoom(next, resolver, { editor: editMode });
      crush = createCrushPass(next.look.palette, next.look.ditherStrength);
      crush.setSource(target.texture);

      if (first) {
        let remembered = false;
        try {
          remembered = window.localStorage.getItem(LIT_KEY) === '1';
        } catch {
          /* storage unavailable: start dark */
        }
        lit = next.light.startLit === 'lit' || (next.light.startLit === 'remember' && remembered);
        world = next.worlds.defaultWorld;
      }
      const p = next.player;
      const moved =
        first || p.startX !== prev.player.startX || p.startZ !== prev.player.startZ || p.startYaw !== prev.player.startYaw;
      if (moved) {
        pose.x = p.startX;
        pose.z = p.startZ;
        pose.yaw = THREE.MathUtils.degToRad(p.startYaw);
        pose.pitch = 0;
      }
      pose.pitch = Math.max(-pitchLimit(), Math.min(pitchLimit(), pose.pitch));

      walk = null;
      seenRevision = -1;
      room.setState(lit, world, true);
      room.setHighlight(hoverId, selectedId);
      resize();
      keepInRoom();
    };

    apiRef.current = {
      apply,
      visit(id) {
        const spot = room?.layout.hotspots.find((h) => h.id === id);
        if (spot) visit(spot);
      },
      setSelected(id) {
        selectedId = id;
        room?.setHighlight(hoverId, selectedId);
      },
      highlight,
    };

    /* ------------------------------ pointing ----------------------------- */

    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();

    const pick = (clientX: number, clientY: number) => {
      if (!room) return null;
      const bounds = canvas.getBoundingClientRect();
      pointerNdc.set(
        ((clientX - bounds.left) / bounds.width) * 2 - 1,
        -((clientY - bounds.top) / bounds.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointerNdc, camera);
      const hit = raycaster.intersectObjects([...room.hitGroup.children, room.floor], false)[0];
      if (!hit) return null;
      const id = hit.object.userData.hotspotId as string | undefined;
      const spot = id ? room.layout.hotspots.find((h) => h.id === id) : undefined;
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
          const limit = pitchLimit();
          pose.yaw += (e.clientX - press.lastX) * cfg.player.lookSpeed;
          pose.pitch = Math.max(-limit, Math.min(limit, pose.pitch + (e.clientY - press.lastY) * cfg.player.lookSpeed));
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
      if (e.key === 'Escape') {
        setCard(null);
        setPanel(null);
      }
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (!MOVE_KEYS.includes(key) || e.metaKey || e.ctrlKey || e.altKey) return;
      // Typing in the admin page's fields must not walk the camera.
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT')) return;
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
      if (!room || !crush) return;

      // Standing still with nothing changing: no need for every frame.
      const active = walk !== null || keys.size > 0 || (press?.dragging ?? false) || room.busy() || !drawnOnce;
      if (!active && now - last < 1000 / cfg.look.idleFps) return;

      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const reducedMotion = reducedMotionQuery.matches;
      const player = cfg.player;

      // Models and pictures arrive after the room is built, which changes what can be clicked.
      if (room.layout.revision !== seenRevision) {
        seenRevision = room.layout.revision;
        setItems(room.layout.hotspots.map((h) => ({ id: h.id, label: h.label })));
      }

      const beforeX = pose.x;
      const beforeZ = pose.z;

      // Keyboard: turn with left/right, walk with up/down.
      const turn =
        (keys.has('ArrowLeft') || keys.has('a') ? 1 : 0) - (keys.has('ArrowRight') || keys.has('d') ? 1 : 0);
      const advance =
        (keys.has('ArrowUp') || keys.has('w') ? 1 : 0) - (keys.has('ArrowDown') || keys.has('s') ? 1 : 0);
      pose.yaw += turn * player.turnSpeed * dt;
      if (advance) {
        pose.x += -Math.sin(pose.yaw) * advance * player.walkSpeed * dt;
        pose.z += -Math.cos(pose.yaw) * advance * player.walkSpeed * dt;
      }

      if (walk) {
        const next = walk.path[0];
        const isLast = walk.path.length === 1;
        const dx = next.x - pose.x;
        const dz = next.z - pose.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 0.001) {
          // Full speed around corners; ease in only to the destination.
          const speed = isLast ? Math.min(player.walkSpeed, dist * 4 + 0.5) : player.walkSpeed;
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
      const bob = reducedMotion ? 0 : Math.sin(walkPhase) * player.bob;

      camera.position.set(pose.x, cfg.room.eyeHeight + bob, pose.z);
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

    // Build the room for the first time.
    apply(live.current.config, live.current.resolve, Boolean(live.current.editor));

    return () => {
      cancelAnimationFrame(raf);
      apiRef.current = null;
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
      room?.dispose();
      crush?.dispose();
      target.dispose();
      renderer.dispose();
      void editing;
    };
  }, []);

  /* ------------------------ reacting to changes from outside ------------------------ */

  const isEditing = Boolean(editor);
  const selectedId = editor?.selectedId ?? null;
  const visitRequest = editor?.visit ?? null;

  // A new config (the admin page edited something): rebuild the room.
  const firstApply = useRef(true);
  useEffect(() => {
    // The first build happens inside the effect above.
    if (firstApply.current) {
      firstApply.current = false;
      return;
    }
    apiRef.current?.apply(config, resolve, isEditing);
  }, [config, resolve, isEditing]);

  useEffect(() => {
    apiRef.current?.setSelected(selectedId);
  }, [selectedId, config]);

  useEffect(() => {
    if (visitRequest) apiRef.current?.visit(visitRequest.id);
  }, [visitRequest]);

  // Spoken lines fade on their own.
  useEffect(() => {
    if (!message) return;
    const id = window.setTimeout(() => setMessage(null), MESSAGE_MS);
    return () => window.clearTimeout(id);
  }, [message]);

  const hint = touch ? config.text.hintTouch : config.text.hintMouse;
  const caption = message ?? hoverLabel ?? (showHint && ready ? hint : '');
  const rootClass = editor ? 'absolute inset-0' : 'fixed inset-0';

  return (
    <main className={`${rootClass} select-none overflow-hidden bg-[#05060a] font-mono`}>
      {!editor && <h1 className="sr-only">Adine Johnson&apos;s room</h1>}

      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full touch-none"
        style={{ imageRendering: 'pixelated' }}
      />

      {!ready && !problem && (
        <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm uppercase tracking-widest text-[#8a9a70]">
          {config.text.loading}
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
            {!editor && (
              <button
                type="button"
                onClick={leave}
                className="border border-[#2e3a1c] px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#c8d4a8]"
              >
                {config.text.standardSite}
              </button>
            )}
          </div>
        </div>
      )}

      {!editor && (
        <button
          type="button"
          onClick={leave}
          className="absolute right-3 top-3 z-10 bg-[#05060a]/70 px-3 py-2 text-xs uppercase tracking-widest text-[#c8d4a8] transition-colors hover:text-[#f3f7e4]"
        >
          {config.text.standardSite}
        </button>
      )}

      {/* The same objects as a list, for keyboards and screen readers. It is
          invisible, and ignores the mouse, until one of its buttons is focused. */}
      {!editor && (
        <nav
          aria-label="Things in the room"
          className="pointer-events-none absolute left-3 top-3 z-10 flex max-w-[60%] flex-wrap gap-1 opacity-0 focus-within:pointer-events-auto focus-within:opacity-100"
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => apiRef.current?.visit(item.id)}
              onFocus={() => apiRef.current?.highlight(item.id)}
              onBlur={() => apiRef.current?.highlight(null)}
              className="bg-[#05060a]/80 px-2 py-1 text-xs text-[#c8d4a8]"
            >
              {item.label}
            </button>
          ))}
        </nav>
      )}

      {panel && <RoomPanel id={panel} onClose={() => setPanel(null)} />}

      {card && (
        <aside
          aria-label={card.title || 'About this'}
          className="absolute bottom-16 left-3 right-3 z-20 max-h-[60%] max-w-sm overflow-y-auto border border-[#2e3a1c] bg-[#05060a]/92 p-4 text-[#f3f7e4] shadow-lg sm:right-auto"
        >
          <button
            type="button"
            onClick={() => setCard(null)}
            aria-label="Close"
            className="absolute right-2 top-2 px-2 py-1 text-sm text-[#c8d4a8] hover:text-[#f3f7e4]"
          >
            ✕
          </button>
          {card.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={card.imageUrl} alt="" className="mb-3 max-h-48 w-full object-cover" />
          )}
          {card.title && <h2 className="pr-8 text-lg font-bold tracking-tight">{card.title}</h2>}
          {card.text && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#c8d4a8]">{card.text}</p>}
          {card.link && (
            <a
              href={card.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block border border-[#94a348] bg-[#94a348] px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#0a0c04] hover:bg-[#c8d4a8]"
            >
              {card.linkLabel || 'Open'}
            </a>
          )}
        </aside>
      )}

      <p
        aria-live="polite"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex min-h-[3rem] items-center justify-center px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-center text-sm text-[#f3f7e4] [text-shadow:0_1px_0_#05060a,0_0_8px_#05060a]"
      >
        {caption}
      </p>
    </main>
  );
}
