'use client';

import { useEffect, useRef } from 'react';

/** Faint dots drifting behind the page. Decorative. */
export function FloatingParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let destroyed = false;
    let frameId = 0;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const particles: Array<{
      x: number; y: number;
      vx: number; vy: number;
      size: number; opacity: number;
      color: string;
    }> = [];

    const colors = ['#94a348', '#a8b850', '#8a9a70', '#2c5463'];

    // The canvas covers the screen, not the whole page: it is fixed in
    // place, so only one screenful is ever visible.
    function init() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      const count = Math.floor((canvas!.width * canvas!.height) / 40000);
      particles.length = 0;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas!.width,
          y: Math.random() * canvas!.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 2 + 0.5,
          opacity: Math.random() * 0.15 + 0.05,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    }

    function draw() {
      if (destroyed || !canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const still = reducedMotion.matches;
      for (const p of particles) {
        if (!still) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0) p.x = canvas.width;
          if (p.x > canvas.width) p.x = 0;
          if (p.y < 0) p.y = canvas.height;
          if (p.y > canvas.height) p.y = 0;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      // With reduced motion the dots are drawn once and left alone.
      if (!still) frameId = requestAnimationFrame(draw);
    }

    const restart = () => {
      cancelAnimationFrame(frameId);
      init();
      frameId = requestAnimationFrame(draw);
    };
    restart();

    // Phones fire "resize" whenever the address bar slides; only a change
    // of width is worth starting over for.
    let lastWidth = window.innerWidth;
    const onResize = () => {
      if (window.innerWidth === lastWidth && window.innerHeight <= canvas.height) return;
      lastWidth = window.innerWidth;
      restart();
    };
    window.addEventListener('resize', onResize);
    reducedMotion.addEventListener('change', restart);

    return () => {
      destroyed = true;
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
      reducedMotion.removeEventListener('change', restart);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
}
