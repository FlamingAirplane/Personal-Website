'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { bitCrush } from '@/lib/room/palette';
import { paintView } from '@/lib/room/paint';
import {
  ROOM_H,
  ROOM_VIEWS,
  ROOM_W,
  START_VIEW,
  type Hotspot,
  type ViewId,
} from '@/lib/room/room-data';
import { rememberSiteMode } from '@/lib/site-mode';
import { withBase } from '@/lib/site';

const LIT_KEY = 'room-lit';
const TURN_MS = 280;
const IDLE_FRAME_MS = 80; // ~12fps when nothing is sliding: cheap, and it suits the look
const MESSAGE_MS = 4500;

interface Turn {
  from: ViewId;
  to: ViewId;
  /** 1 = turning right, -1 = turning left. */
  dir: 1 | -1;
  start: number;
}

export function RoomCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [viewId, setViewId] = useState<ViewId>(START_VIEW);
  const [lit, setLit] = useState(false);
  const [turning, setTurning] = useState(false);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // What the render loop reads. Kept in a ref so the loop never restarts.
  const live = useRef({
    viewId: START_VIEW as ViewId,
    lit: false,
    hoverId: null as string | null,
    turn: null as Turn | null,
    reducedMotion: false,
  });
  live.current.viewId = viewId;
  live.current.lit = lit;
  live.current.hoverId = hoverId;

  const view = ROOM_VIEWS[viewId];

  // Restore the light switch from the last visit.
  useEffect(() => {
    try {
      if (window.localStorage.getItem(LIT_KEY) === '1') setLit(true);
    } catch {
      /* storage unavailable: start dark */
    }
  }, []);

  // The render loop: paint at low resolution, bit-crush, show.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const buffer = document.createElement('canvas');
    buffer.width = ROOM_W;
    buffer.height = ROOM_H;
    const bctx = buffer.getContext('2d', { willReadFrequently: true });
    if (!bctx) return;
    bctx.imageSmoothingEnabled = false;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => {
      live.current.reducedMotion = motionQuery.matches;
    };
    syncMotion();
    motionQuery.addEventListener('change', syncMotion);

    let raf = 0;
    let lastPaint = 0;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const s = live.current;
      if (!s.turn && now - lastPaint < IDLE_FRAME_MS) return;
      lastPaint = now;

      const paintState = { lit: s.lit, t: s.reducedMotion ? 0 : now / 1000 };

      if (s.turn) {
        const { from, to, dir, start } = s.turn;
        const p = Math.min(1, (now - start) / TURN_MS);
        const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        const offset = Math.round(eased * ROOM_W) * dir;

        bctx.save();
        bctx.translate(-offset, 0);
        paintView(bctx, from, paintState);
        bctx.restore();

        bctx.save();
        bctx.translate(dir * ROOM_W - offset, 0);
        paintView(bctx, to, paintState);
        bctx.restore();

        if (p >= 1) {
          s.turn = null;
          s.viewId = to;
          setViewId(to);
          setTurning(false);
        }
      } else {
        paintView(bctx, s.viewId, paintState);
      }

      const image = bctx.getImageData(0, 0, ROOM_W, ROOM_H);
      bitCrush(image.data, ROOM_W, ROOM_H);
      ctx.putImageData(image, 0, 0);

      // Corner brackets around whatever is hovered or focused.
      if (!s.turn && s.hoverId) {
        const spot = ROOM_VIEWS[s.viewId].hotspots.find((h) => h.id === s.hoverId);
        if (spot) {
          const { x, y, w, h } = spot.rect;
          const x0 = x - 2;
          const y0 = y - 2;
          const x1 = x + w + 1;
          const y1 = y + h + 1;
          const arm = Math.min(5, Math.floor(Math.min(w, h) / 2));
          ctx.fillStyle = '#f3f7e4';
          const corners: [number, number, number, number][] = [
            [x0, y0, 1, 1],
            [x1, y0, -1, 1],
            [x0, y1, 1, -1],
            [x1, y1, -1, -1],
          ];
          for (const [cx, cy, dx, dy] of corners) {
            ctx.fillRect(dx > 0 ? cx : cx - arm + 1, cy, arm, 1);
            ctx.fillRect(cx, dy > 0 ? cy : cy - arm + 1, 1, arm);
          }
        }
      }
    };

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      motionQuery.removeEventListener('change', syncMotion);
    };
  }, []);

  // Spoken lines fade on their own.
  useEffect(() => {
    if (!message) return;
    const id = window.setTimeout(() => setMessage(null), MESSAGE_MS);
    return () => window.clearTimeout(id);
  }, [message]);

  const turn = useCallback((dir: 1 | -1) => {
    const s = live.current;
    if (s.turn) return;
    const from = s.viewId;
    const to = dir === 1 ? ROOM_VIEWS[from].right : ROOM_VIEWS[from].left;
    setHoverId(null);
    setMessage(null);
    if (s.reducedMotion) {
      setViewId(to);
      return;
    }
    s.turn = { from, to, dir, start: performance.now() };
    setTurning(true);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        turn(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        turn(1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [turn]);

  const leave = () => {
    rememberSiteMode('standard');
    window.location.assign(withBase('/'));
  };

  const activate = (spot: Hotspot) => {
    const action = spot.action;
    if (action.type === 'toggle-light') {
      const next = !live.current.lit;
      setLit(next);
      setMessage(next ? 'Lights on.' : 'Lights off.');
      try {
        window.localStorage.setItem(LIT_KEY, next ? '1' : '0');
      } catch {
        /* not remembered, still works */
      }
    } else if (action.type === 'exit') {
      leave();
    } else {
      setMessage(action.line);
    }
  };

  // Swipe to turn on touch screens.
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') swipeStart.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) turn(dx < 0 ? 1 : -1);
  };

  const hovered = hoverId ? view.hotspots.find((h) => h.id === hoverId) : null;
  const caption = message ?? hovered?.label ?? '';

  const turnButton =
    'absolute top-0 z-10 flex h-full w-[7%] items-center justify-center font-mono text-2xl text-[#c8d4a8]/40 transition-colors hover:text-[#f3f7e4] focus-visible:text-[#f3f7e4] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#94a348] sm:text-4xl';

  return (
    <main className="fixed inset-0 flex select-none flex-col items-center justify-center bg-[#05060a] font-mono">
      <h1 className="sr-only">Adine Johnson&apos;s room</h1>

      <div className="mb-2 flex w-[min(100vw,calc((100dvh-6rem)*16/9))] items-center justify-between px-2 text-xs uppercase tracking-widest text-[#5a6a40]">
        <span aria-label={`Facing ${view.id}`}>
          Facing <span className="text-[#94a348]">{view.name}</span>
        </span>
        <button
          type="button"
          onClick={leave}
          className="uppercase tracking-widest text-[#5a6a40] transition-colors hover:text-[#f3f7e4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#94a348]"
        >
          Standard site
        </button>
      </div>

      <div
        className="relative aspect-video w-[min(100vw,calc((100dvh-6rem)*16/9))] touch-pan-y overflow-hidden"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerLeave={() => setHoverId(null)}
      >
        <canvas
          ref={canvasRef}
          width={ROOM_W}
          height={ROOM_H}
          aria-hidden="true"
          className="absolute inset-0 h-full w-full"
          style={{ imageRendering: 'pixelated' }}
        />

        <button type="button" aria-label="Turn left" onClick={() => turn(-1)} className={`${turnButton} left-0`}>
          ‹
        </button>
        <button type="button" aria-label="Turn right" onClick={() => turn(1)} className={`${turnButton} right-0`}>
          ›
        </button>

        {!turning &&
          view.hotspots.map((spot) => (
            <button
              key={`${view.id}-${spot.id}`}
              type="button"
              aria-label={spot.label}
              onClick={() => activate(spot)}
              onMouseEnter={() => setHoverId(spot.id)}
              onMouseLeave={() => setHoverId((id) => (id === spot.id ? null : id))}
              onFocus={() => setHoverId(spot.id)}
              onBlur={() => setHoverId((id) => (id === spot.id ? null : id))}
              className="absolute z-20 cursor-pointer bg-transparent outline-none"
              style={{
                left: `${(spot.rect.x / ROOM_W) * 100}%`,
                top: `${(spot.rect.y / ROOM_H) * 100}%`,
                width: `${(spot.rect.w / ROOM_W) * 100}%`,
                height: `${(spot.rect.h / ROOM_H) * 100}%`,
              }}
            />
          ))}
      </div>

      <p
        aria-live="polite"
        className="mt-2 flex min-h-[2.5rem] w-[min(100vw,calc((100dvh-6rem)*16/9))] items-start justify-center px-4 text-center text-sm text-[#c8d4a8]"
      >
        {caption}
      </p>
    </main>
  );
}
