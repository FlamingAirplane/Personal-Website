'use client';

import { MotionConfig } from 'framer-motion';

/**
 * Makes every framer-motion animation on the site respect the visitor's
 * "reduce motion" system setting: movement is skipped, fades are kept.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
