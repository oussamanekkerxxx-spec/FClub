// Platform club categories — only these two are available for club creation.
// Other category IDs may still exist in the DB (backward compat); gradients/colors
// maps below cover them so existing clubs render correctly.
export const CATEGORIES = [
  { id: 'technology', label: 'Tech & Dev',  emoji: '💻' },
  { id: 'student',    label: 'Students',    emoji: '🎓' },
] as const;

export type CategoryId = typeof CATEGORIES[number]['id'];

export const CATEGORY_GRADIENTS: Record<string, string> = {
  music:             'from-purple-600 to-pink-500',
  languages:         'from-blue-500 to-cyan-400',
  technology:        'from-indigo-600 to-blue-500',
  cooking:           'from-orange-400 to-red-500',
  art:               'from-amber-500 to-orange-600',
  fitness:           'from-green-500 to-teal-400',
  photography:       'from-slate-600 to-gray-700',
  business:          'from-yellow-500 to-amber-500',
  writing:           'from-violet-500 to-purple-600',
  crafts:            'from-pink-500 to-rose-500',
  events:            'from-orange-500 to-red-600',
  student:           'from-blue-400 to-indigo-600',
  club_lounge:       'from-rose-400 to-orange-300',
  deve_sandbox:      'from-gray-700 to-gray-900',
  wellness_support:  'from-teal-400 to-emerald-500',
  connection_lounge: 'from-violet-400 to-fuchsia-500',
};

export const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  music:             { bg: '#F3E8FF', text: '#7C3AED' },
  languages:         { bg: '#E0F2FE', text: '#0369A1' },
  technology:        { bg: '#EEF2FF', text: '#4338CA' },
  cooking:           { bg: '#FEF3C7', text: '#D97706' },
  art:               { bg: '#FFF0F0', text: '#DC2626' },
  fitness:           { bg: '#DCFCE7', text: '#16A34A' },
  photography:       { bg: '#F1F5F9', text: '#475569' },
  business:          { bg: '#FEF9C3', text: '#CA8A04' },
  writing:           { bg: '#EDE9FE', text: '#6D28D9' },
  crafts:            { bg: '#FDF2F8', text: '#BE185D' },
  events:            { bg: '#FFEDD5', text: '#EA580C' },
  student:           { bg: '#DBEAFE', text: '#2563EB' },
  club_lounge:       { bg: '#FFE4E6', text: '#E11D48' },
  deve_sandbox:      { bg: '#F3F4F6', text: '#374151' },
  wellness_support:  { bg: '#CCFBF1', text: '#0D9488' },
  connection_lounge: { bg: '#F3E8FF', text: '#9333EA' },
};

export const CATEGORY_COLORS_WITH_GRADIENT: Record<string, { bg: string; text: string; gradient: string }> = Object.fromEntries(
  Object.entries(CATEGORY_COLORS).map(([key, val]) => [
    key,
    { ...val, gradient: CATEGORY_GRADIENTS[key] ?? 'from-blue-500 to-purple-600' },
  ])
);
