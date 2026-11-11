// The room's one shared palette. Every pixel that reaches the screen is
// snapped to one of these colours (see crush-pass.ts), which is what makes
// mixed source art read as a single bit-crushed scene.

export const PALETTE_HEX = [
  // nebula
  '#05060a', '#0b0d18', '#141833', '#1f2350', '#2e2a6b', '#4a3a8c', '#6d4fa8', '#9a6fc4',
  // brand olive
  '#0a0c04', '#1a1e10', '#2e3a1c', '#5a6a40', '#94a348', '#c8d4a8', '#f3f7e4',
  // wood and lamp
  '#2a1a14', '#4d2f22', '#7a4a30', '#a8744a', '#d4a56a', '#f0d9a0',
  // greys
  '#3a4048', '#6b7480', '#a4adb8',
  // screens
  '#1d4a5a', '#3a8fa0', '#7fd4d8',
  // accents
  '#b8405a', '#f07a5a',
] as const;
