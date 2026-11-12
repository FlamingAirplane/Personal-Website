'use client';

import { useEffect, useRef, useState } from 'react';
import type { SiteSettings } from '@/lib/content';
import { useSiteContent } from '@/lib/preview';

// Set from the admin page (Title, Particles & Cursor).
function cursorSettings(s: SiteSettings) {
  return {
    enabled: s.cursorEnabled,
    size: s.cursorSize,
    hoverSize: s.cursorHoverSize,
    /** How quickly the dot catches up with the pointer, per frame (0..1). */
    lag: s.cursorLag / 100,
    colorOnLight: s.cursorColorLight,
    colorOnDark: s.cursorColorDark,
  };
}

// Anything matching this makes the dot grow. The room's canvas sets
// data-cursor-hover="true" on itself while the pointer is over an object.
const INTERACTIVE = 'a, button, [role="button"], input, textarea, select, [onclick], [data-cursor-hover="true"]';

/** A dot that follows the pointer, replacing the system cursor on mouse devices. */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const [color, setColor] = useState('#94a348');
  const [isHovering, setIsHovering] = useState(false);
  const [visible, setVisible] = useState(false);
  const SETTINGS = cursorSettings(useSiteContent().siteSettings);
  const settingsRef = useRef(SETTINGS);
  settingsRef.current = SETTINGS;

  useEffect(() => {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!SETTINGS.enabled || isTouchDevice) {
      setVisible(false);
      return;
    }

    setVisible(true);

    const pos = { x: -100, y: -100 };
    const target = { x: -100, y: -100 };
    let moved = false;
    let frame = 0;

    const onMouseMove = (e: MouseEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      moved = true;
    };

    const onMouseLeave = () => {
      target.x = target.y = pos.x = pos.y = -100;
    };

    // Looking up what is under the pointer is not free, so it happens here,
    // at most once per frame, instead of on every mouse event.
    const inspect = () => {
      const el = document.elementFromPoint(target.x, target.y) as HTMLElement | null;
      if (!el) return;
      const bg = getComputedStyle(el).backgroundColor;
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
        const match = bg.match(/\d+/g);
        if (match && match.length >= 3) {
          const luminance = (0.299 * +match[0] + 0.587 * +match[1] + 0.114 * +match[2]) / 255;
          setColor(luminance > 0.5 ? settingsRef.current.colorOnLight : settingsRef.current.colorOnDark);
        }
      }
      setIsHovering(Boolean(el.closest(INTERACTIVE)));
    };

    const animate = () => {
      if (moved) {
        moved = false;
        inspect();
      }
      pos.x += (target.x - pos.x) * settingsRef.current.lag;
      pos.y += (target.y - pos.y) * settingsRef.current.lag;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%)`;
      }
      frame = requestAnimationFrame(animate);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', onMouseLeave);
    frame = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      cancelAnimationFrame(frame);
    };
  }, [SETTINGS.enabled]);

  if (!visible) return null;

  const dotSize = isHovering ? SETTINGS.hoverSize : SETTINGS.size;

  return (
    <>
      <style jsx global>{`
        *, *::before, *::after {
          cursor: none !important;
        }
      `}</style>
      <div
        ref={dotRef}
        aria-hidden="true"
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
