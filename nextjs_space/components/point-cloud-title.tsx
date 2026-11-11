'use client';

import { useEffect, useRef, useState } from 'react';

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

const DEFAULT_SETTINGS: ParticleSettings = {
  mouseRadius: 70,
  pushForce: 8,
  returnSpeed: 0.06,
  friction: 0.85,
  gap: 3,
  titleText: 'Adine.',
};

export function PointCloudTitle() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const settingsRef = useRef<ParticleSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    let particles: Particle[] = [];
    let mouse = { x: -9999, y: -9999 };
    let frameId = 0;
    let destroyed = false;

    function buildParticles() {
      const displayW = canvas!.clientWidth;
      const displayH = canvas!.clientHeight;
      if (displayW === 0 || displayH === 0) return;

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
              x: x + (Math.random() - 0.5) * 300,
              y: y + (Math.random() - 0.5) * 300,
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
      if (destroyed) return;
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
      buildParticles();
    }

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);
    canvas.addEventListener('touchmove', onTouchMove, { passive: true });
    canvas.addEventListener('touchend', onTouchEnd);
    window.addEventListener('resize', onResize);

    // Delay initialization slightly to ensure layout is settled
    const timer = setTimeout(() => {
      buildParticles();
      frameId = requestAnimationFrame(draw);
    }, 200);

    return () => {
      destroyed = true;
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
      className="w-full"
      style={{ height: '320px', cursor: 'default' }}
    />
  );
}
