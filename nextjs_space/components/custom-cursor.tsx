'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const SETTINGS = {
  size: 12,
  hoverSize: 40,
  /** How quickly the dot catches up with the pointer, per frame (0..1). */
  lag: 0.15,
  colorOnLight: '#0a0c04',
  colorOnDark: '#c8d4a8',
};

// Anything matching this makes the dot grow. The room's canvas sets
// data-cursor-hover="true" on itself while the pointer is over an object.
const INTERACTIVE = 'a, button, [role="button"], input, textarea, select, [onclick], [data-cursor-hover="true"]';

/** A dot that follows the pointer, replacing the system cursor on mouse devices. */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const [color, setColor] = useState('#94a348');
  const [isHovering, setIsHovering] = useState(false);
  const [visible, setVisible] = useState(false);
  // The admin page is full of forms, where a normal pointer is easier to use.
  const pathname = usePathname();
  const disabled = pathname?.startsWith('/room/admin') ?? false;

  useEffect(() => {
    if (disabled) {
      setVisible(false);
      return;
    }
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;

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
          setColor(luminance > 0.5 ? SETTINGS.colorOnLight : SETTINGS.colorOnDark);
        }
      }
      setIsHovering(Boolean(el.closest(INTERACTIVE)));
    };

    const animate = () => {
      if (moved) {
        moved = false;
        inspect();
      }
      pos.x += (target.x - pos.x) * SETTINGS.lag;
      pos.y += (target.y - pos.y) * SETTINGS.lag;
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
  }, [disabled]);

  if (!visible || disabled) return null;

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
