/**
 * Single source of truth for FightClub application configuration.
 *
 * Brand, trust tiers, and skill categories all live here so that changing a
 * label, color, or gradient requires editing exactly one file.
 *
 * Rule: no component or page may define its own category gradients or tier
 * colors. Import from here or from the thin re-export wrappers in
 * src/constants/ (kept for backwards compatibility during migration).
 */

// ── Brand ────────────────────────────────────────────────────────────────────

export const BRAND = {
  name: 'FightClub',
  tagline: 'Skills shared. Communities built.',
  community: 'the FightClub community',
  /** Used in community-guidelines copy */
  guidelines: "FightClub's community guidelines",
} as const;

// ── Trust tiers ──────────────────────────────────────────────────────────────

export type TrustTierLevel = 0 | 1 | 2 | 3 | 4;

export interface TrustTierConfig {
  label: string;
  bg: string;
  text: string;
  /** Minimum trust_score to reach this tier */
  minScore: number;
  description: string;
}

export const TRUST_TIERS: Record<TrustTierLevel, TrustTierConfig> = {
  0: { label: 'Explorer',   bg: '#EDF2FF', text: '#4C6EF5', minScore: 0,   description: 'New to the community' },
  1: { label: 'Member',     bg: '#E3F2FD', text: '#1976D2', minScore: 10,  description: 'Active community member' },
  2: { label: 'Verified',   bg: '#E8F5EE', text: '#2D7A4F', minScore: 25,  description: 'ID-verified member' },
  3: { label: 'Teacher',    bg: '#FFF3E0', text: '#C4873A', minScore: 50,  description: 'Established skill teacher' },
  4: { label: 'Connector',  bg: '#EDE8F7', text: '#5C3D8F', minScore: 100, description: 'Top community connector' },
};

// ── Skill categories ─────────────────────────────────────────────────────────

export interface CategoryConfig {
  id: string;
  label: string;
  emoji: string;
  gradient: string;
  bg: string;
  text: string;
}

export const SKILL_CATEGORIES: CategoryConfig[] = [
  { id: 'music',        label: 'Music',           emoji: '🎵', gradient: 'from-purple-600 to-pink-500',   bg: '#F3E8FF', text: '#7C3AED' },
  { id: 'languages',    label: 'Languages',       emoji: '🌍', gradient: 'from-blue-500 to-cyan-400',    bg: '#E0F2FE', text: '#0369A1' },
  { id: 'technology',   label: 'Technology',      emoji: '💻', gradient: 'from-indigo-600 to-blue-500',  bg: '#EEF2FF', text: '#4338CA' },
  { id: 'cooking',      label: 'Cooking',         emoji: '🍳', gradient: 'from-orange-400 to-red-500',   bg: '#FEF3C7', text: '#D97706' },
  { id: 'art',          label: 'Art & Craft',     emoji: '🎨', gradient: 'from-amber-500 to-orange-600', bg: '#FFF0F0', text: '#DC2626' },
  { id: 'fitness',      label: 'Fitness',         emoji: '💪', gradient: 'from-green-500 to-teal-400',   bg: '#DCFCE7', text: '#16A34A' },
  { id: 'photography',  label: 'Photography',     emoji: '📷', gradient: 'from-slate-600 to-gray-700',   bg: '#F1F5F9', text: '#475569' },
  { id: 'business',     label: 'Business',        emoji: '📊', gradient: 'from-yellow-500 to-amber-500', bg: '#FEF9C3', text: '#CA8A04' },
  { id: 'writing',      label: 'Writing',         emoji: '✍️', gradient: 'from-violet-500 to-purple-600', bg: '#EDE9FE', text: '#6D28D9' },
  { id: 'crafts',       label: 'Crafts',          emoji: '🧵', gradient: 'from-pink-500 to-rose-500',    bg: '#FDF2F8', text: '#BE185D' },
];

/** Full category set including club-specific channels */
export const ALL_CATEGORIES: CategoryConfig[] = [
  ...SKILL_CATEGORIES,
  { id: 'events',            label: 'Events',                  emoji: '📅', gradient: 'from-orange-500 to-red-600',    bg: '#FFEDD5', text: '#EA580C' },
  { id: 'student',           label: 'Student',                 emoji: '🎓', gradient: 'from-blue-400 to-indigo-600',   bg: '#DBEAFE', text: '#2563EB' },
  { id: 'club_lounge',       label: 'Club Lounge',             emoji: '🛋️', gradient: 'from-rose-400 to-orange-300',   bg: '#FFE4E6', text: '#E11D48' },
  { id: 'deve_sandbox',      label: 'Deve Sandbox',            emoji: '🛠️', gradient: 'from-gray-700 to-gray-900',     bg: '#F3F4F6', text: '#374151' },
  { id: 'wellness_support',  label: 'Wellness & Support Room', emoji: '🧘', gradient: 'from-teal-400 to-emerald-500',  bg: '#CCFBF1', text: '#0D9488' },
  { id: 'connection_lounge', label: 'Connection Lounge',       emoji: '🤝', gradient: 'from-violet-400 to-fuchsia-500', bg: '#F3E8FF', text: '#9333EA' },
];

// ── Derived lookup maps (cached at module load; never recomputed) ─────────────

export const CATEGORY_BY_ID = new Map<string, CategoryConfig>(
  ALL_CATEGORIES.map(c => [c.id, c])
);

/** Gradient string by category id, with fallback. */
export function getCategoryGradient(id: string): string {
  return CATEGORY_BY_ID.get(id)?.gradient ?? 'from-blue-500 to-purple-600';
}

/** { bg, text } badge colors by category id, with fallback. */
export function getCategoryColors(id: string): { bg: string; text: string } {
  const c = CATEGORY_BY_ID.get(id);
  return c ? { bg: c.bg, text: c.text } : { bg: '#EEF2FF', text: '#4338CA' };
}

/** Full config (bg, text, gradient) by category id, with fallback. */
export function getCategoryConfig(id: string): CategoryConfig {
  return CATEGORY_BY_ID.get(id) ?? SKILL_CATEGORIES[0];
}

export function getTierConfig(tier: TrustTierLevel): TrustTierConfig {
  return TRUST_TIERS[tier];
}
