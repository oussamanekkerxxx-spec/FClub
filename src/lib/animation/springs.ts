import type { Transition } from 'framer-motion';

// ── Domain-specific spring presets ──
//
// Physics-based springs using stiffness (tension), damping (friction),
// and mass (weight). Higher stiffness = snappier. Higher damping = less bounce.

export const springs = {
  /** Modal content enter/exit — bouncy but settles quickly */
  modal: {
    type: 'spring',
    stiffness: 380,
    damping: 28,
    mass: 0.8,
  } satisfies Transition,

  /** Modal backdrop fade — subtle, no bounce */
  backdrop: {
    type: 'spring',
    stiffness: 420,
    damping: 36,
  } satisfies Transition,

  /** Page / section transitions — smooth, slightly bouncy */
  page: {
    type: 'spring',
    stiffness: 280,
    damping: 26,
  } satisfies Transition,

  /** Sidebar slide — firm snap, minimal overshoot */
  sidebar: {
    type: 'spring',
    stiffness: 340,
    damping: 32,
  } satisfies Transition,

  /** Message appear / send — quick pop feel */
  message: {
    type: 'spring',
    stiffness: 460,
    damping: 25,
    mass: 0.6,
  } satisfies Transition,

  /** Scroll-to-bottom button — soft, gentle */
  scrollButton: {
    type: 'spring',
    stiffness: 300,
    damping: 24,
  } satisfies Transition,

  /** Dropdown / menu — snappy */
  menu: {
    type: 'spring',
    stiffness: 420,
    damping: 28,
  } satisfies Transition,

  /** Image zoom / fullscreen — smooth, heavier feel */
  image: {
    type: 'spring',
    stiffness: 260,
    damping: 24,
    mass: 0.9,
  } satisfies Transition,

  /** Reply bar / composer slide — medium snap */
  composer: {
    type: 'spring',
    stiffness: 400,
    damping: 28,
    mass: 0.7,
  } satisfies Transition,

  /** Quick fade for small UI toggles */
  fade: {
    type: 'spring',
    stiffness: 500,
    damping: 38,
  } satisfies Transition,
} as const;

export type SpringName = keyof typeof springs;
