'use client';

import { useEffect, useRef, useState } from 'react';

interface CursorSettings {
  cursorEnabled: boolean;
  cursorSize: number;
  cursorHoverSize: number;
  cursorLag: number;
  cursorColorLight: string;
  cursorColorDark: string;
}

const DEFAULTS: CursorSettings = {
  cursorEnabled: true,
  cursorSize: 12,
  cursorHoverSize: 40,
  cursorLag: 15,
  cursorColorLight: '#0a0c04',
  cursorColorDark: '#c8d4a8',
};

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: -100, y: -100 });
  const target = useRef({ x: -100, y: -100 });
  const [color, setColor] = useState('#94a348');
  const [isHovering, setIsHovering] = useState(false);
  const [visible, setVisible] = useState(false);
  const frameRef = useRef<number>(0);
  const settingsRef = useRef<CursorSettings>(DEFAULTS);
  const [settings, setSettings] = useState<CursorSettings>(DEFAULTS);

  // Fetch cursor settings
  useEffect(() => {
    fetch('/api/site-settings')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.settings) {
          const s: CursorSettings = {
            cursorEnabled: d.settings.cursorEnabled ?? DEFAULTS.cursorEnabled,
            cursorSize: d.settings.cursorSize ?? DEFAULTS.cursorSize,
            cursorHoverSize: d.settings.cursorHoverSize ?? DEFAULTS.cursorHoverSize,
            cursorLag: d.settings.cursorLag ?? DEFAULTS.cursorLag,
            cursorColorLight: d.settings.cursorColorLight ?? DEFAULTS.cursorColorLight,
            cursorColorDark: d.settings.cursorColorDark ?? DEFAULTS.cursorColorDark,
          };
          settingsRef.current = s;
          setSettings(s);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;
    if (!settingsRef.current.cursorEnabled) return;

    setVisible(true);

    const handleMouseMove = (e: MouseEvent) => {
      target.current = { x: e.clientX, y: e.clientY };

      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (el) {
        const bg = getComputedStyle(el).backgroundColor;
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
          const match = bg.match(/\d+/g);
          if (match && match.length >= 3) {
            const r = parseInt(match[0]);
            const g = parseInt(match[1]);
            const b = parseInt(match[2]);
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            if (luminance > 0.5) {
              setColor(settingsRef.current.cursorColorLight);
            } else {
              setColor(settingsRef.current.cursorColorDark);
            }
          }
        }
      }

      const interactive = (el as HTMLElement)?.closest?.('a, button, [role="button"], input, textarea, select, [onclick]');
      setIsHovering(!!interactive);
    };

    const handleMouseLeave = () => {
      target.current = { x: -100, y: -100 };
      pos.current = { x: -100, y: -100 };
    };

    function animate() {
      const lerp = settingsRef.current.cursorLag / 100;
      pos.current.x += (target.current.x - pos.current.x) * lerp;
      pos.current.y += (target.current.y - pos.current.y) * lerp;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px) translate(-50%, -50%)`;
      }

      frameRef.current = requestAnimationFrame(animate);
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    frameRef.current = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(frameRef.current);
    };
  }, [settings]);

  if (!visible || !settings.cursorEnabled) return null;

  const dotSize = isHovering ? settings.cursorHoverSize : settings.cursorSize;

  return (
    <>
      <style jsx global>{`
        *, *::before, *::after {
          cursor: none !important;
        }
      `}</style>
      <div
        ref={dotRef}
        className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference"
        style={{
          width: `${dotSize}px`,
          height: `${dotSize}px`,
          borderRadius: '50%',
          backgroundColor: color,
          transition: 'width 0.25s ease, height 0.25s ease, background-color 0.3s ease',
          opacity: 0.9,
        }}
      />
    </>
  );
}
