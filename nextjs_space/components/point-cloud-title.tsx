'use client';

import { useEffect, useRef, useState } from 'react';
import type { SiteSettings } from '@/lib/content';
import { useSiteContent } from '@/lib/preview';

interface Particle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  opacity: number;
}

const COLORS = ['#94a348', '#a8b850', '#c8d4a8', '#f3f7e4', '#8a9a70'];

interface ParticleSettings {
  mouseRadius: number;
  pushForce: number;
  returnSpeed: number;
  friction: number;
  gap: number;
  titleText: string;
}

// Set from the admin page (Title, Particles & Cursor). Percentages are stored as whole numbers.
function particleSettings(s: SiteSettings): Omit<ParticleSettings, 'titleText'> {
  return {
    mouseRadius: s.particleMouseRadius,
    pushForce: s.particlePushForce,
    returnSpeed: s.particleReturnSpeed / 100,
    friction: s.particleFriction / 100,
    gap: s.particleGap,
  };
}

/**
 * The big title, drawn as a cloud of dots that scatter away from the pointer.
 * It is a drawing, so `text` is also given to screen readers as its label.
 */
export function PointCloudTitle({ text }: { text: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { siteSettings } = useSiteContent();
  const settingsRef = useRef<ParticleSettings>({ ...particleSettings(siteSettings), titleText: text });
  Object.assign(settingsRef.current, particleSettings(siteSettings), { titleText: text });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    let particles: Particle[] = [];
    let mouse = { x: -9999, y: -9999 };
    let frameId = 0;
    let destroyed = false;
    let visible = true; // on screen?
    let running = false; // is the draw loop scheduled?
    let builtWidth = 0;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    function buildParticles() {
      const displayW = canvas!.clientWidth;
      const displayH = canvas!.clientHeight;
      if (displayW === 0 || displayH === 0) return;
      builtWidth = displayW;
      // With reduced motion the dots start in place instead of flying in.
      const scatter = reducedMotion.matches ? 0 : 300;

      // Always use dpr of 1 for sampling to avoid sub-pixel issues
      canvas!.width = displayW;
      canvas!.height = displayH;
      ctx!.setTransform(1, 0, 0, 1, 0, 0);
      ctx!.clearRect(0, 0, displayW, displayH);

      const cfg = settingsRef.current;
      // Measure and scale text to fit the canvas width
      let fontSize = displayH * 0.7;
      ctx!.font = `900 ${fontSize}px "Noto Sans", "DM Sans", Arial, sans-serif`;
      ctx!.textAlign = 'center';
      ctx!.textBaseline = 'middle';
      const measured = ctx!.measureText(cfg.titleText);
      const maxW = displayW * 0.9;
      if (measured.width > maxW) {
        fontSize = fontSize * (maxW / measured.width);
        ctx!.font = `900 ${fontSize}px "Noto Sans", "DM Sans", Arial, sans-serif`;
      }
      ctx!.fillStyle = '#ffffff';
      ctx!.fillText(cfg.titleText, displayW / 2, displayH / 2);

      const imageData = ctx!.getImageData(0, 0, displayW, displayH);
      const data = imageData.data;
      const newParticles: Particle[] = [];

      const gap = cfg.gap || 3;
      for (let y = 0; y < displayH; y += gap) {
        for (let x = 0; x < displayW; x += gap) {
          const idx = (y * displayW + x) * 4;
          if (data[idx + 3] > 128) {
            newParticles.push({
              x: x + (Math.random() - 0.5) * scatter,
              y: y + (Math.random() - 0.5) * scatter,
              originX: x,
              originY: y,
              vx: 0,
              vy: 0,
              size: Math.random() * 2 + 1,
              color: COLORS[Math.floor(Math.random() * COLORS.length)],
              opacity: Math.random() * 0.5 + 0.5,
            });
          }
        }
      }

      ctx!.clearRect(0, 0, displayW, displayH);
      particles = newParticles;
    }

    function draw() {
      // Stop drawing while the title is scrolled out of view.
      if (destroyed || !visible) {
        running = false;
        return;
      }
      const w = canvas!.width;
      const h = canvas!.height;

      ctx!.setTransform(1, 0, 0, 1, 0, 0);
      ctx!.clearRect(0, 0, w, h);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Mouse repulsion
        const cfg = settingsRef.current;
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const distSq = dx * dx + dy * dy;
        const radiusSq = cfg.mouseRadius * cfg.mouseRadius;

        if (distSq < radiusSq && distSq > 0) {
          const dist = Math.sqrt(distSq);
          const force = (1 - dist / cfg.mouseRadius) * cfg.pushForce;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }

        // Spring back to origin
        p.vx += (p.originX - p.x) * cfg.returnSpeed;
        p.vy += (p.originY - p.y) * cfg.returnSpeed;
        p.vx *= cfg.friction;
        p.vy *= cfg.friction;
        p.x += p.vx;
        p.y += p.vy;

        // Render
        ctx!.globalAlpha = p.opacity;
        ctx!.fillStyle = p.color;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fill();
      }

      ctx!.globalAlpha = 1;
      frameId = requestAnimationFrame(draw);
    }

    // Event handlers
    function onMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouse = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    function onMouseLeave() {
      mouse = { x: -9999, y: -9999 };
    }
    function onTouchMove(e: TouchEvent) {
      if (e.touches.length > 0) {
        const rect = canvas!.getBoundingClientRect();
        mouse = { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
      }
    }
    function onTouchEnd() {
      mouse = { x: -9999, y: -9999 };
    }
    function onResize() {
      // Phones fire "resize" whenever the address bar slides in or out.
      // Only a change of width means the title has to be laid out again.
      if (canvas!.clientWidth !== builtWidth) buildParticles();
    }
    function start() {
      if (running || destroyed) return;
      running = true;
      frameId = requestAnimationFrame(draw);
    }

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && builtWidth > 0) start();
    });
    observer.observe(canvas);

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);
    canvas.addEventListener('touchmove', onTouchMove, { passive: true });
    canvas.addEventListener('touchend', onTouchEnd);
    window.addEventListener('resize', onResize);

    // Delay initialization slightly to ensure layout is settled
    const timer = setTimeout(() => {
      buildParticles();
      start();
    }, 200);

    return () => {
      destroyed = true;
      observer.disconnect();
      clearTimeout(timer);
      cancelAnimationFrame(frameId);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={text}
      className="w-full"
      // Shorter on narrow screens, where the title itself is smaller.
      style={{ height: 'clamp(180px, 46vw, 320px)', cursor: 'default' }}
    />
  );
}
