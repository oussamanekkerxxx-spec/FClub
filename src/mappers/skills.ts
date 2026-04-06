// Domain boundary: raw Supabase rows → typed UI models.
// All skill fetches must go through mapSkillRow. Never spread a SkillRow
// directly onto a Skill — the shapes diverge (profiles join, nullability, etc.)

import type { Skill } from '@/types/skills';

/** Exact shape returned by Supabase when selecting skills with teacher profile. */
export interface SkillRow {
  id: string;
  slug: string | null;
  teacher_id: string;
  title: string;
  category: string;
  description: string | null;
  philosophy: string | null;
  who_for: string | null;
  what_session_looks_like: string | null;
  price_per_hour: number;
  currency: string;
  format: string | null;
  location: string | null;
  neighborhood: string | null;
  languages: string[] | null;
  level: string | null;
  avg_rating: number;
  reviews_count: number;
  tags: string[] | null;
  cover_gradient: string | null;
  cover_image_url: string | null;
  is_free: boolean;
  is_group: boolean;
  max_headcount: number | null;
  current_headcount: number | null;
  availability_note: string | null;
  is_active: boolean;
  created_at: string;
  /** Joined via profiles!skills_teacher_id_fkey */
  profiles: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    bio: string | null;
    neighborhood: string | null;
    city: string | null;
    trust_tier: number;
    trust_score: number;
    sessions_completed: number | null;
    reviews_count: number | null;
  } | null;
}

export function mapSkillRow(s: SkillRow): Skill {
  const p = s.profiles;
  return {
    id: s.id,
    slug: s.slug ?? s.id,
    teacher_id: s.teacher_id,
    title: s.title,
    category: s.category as Skill['category'],
    description: s.description ?? '',
    philosophy: s.philosophy ?? '',
    who_for: s.who_for ?? '',
    what_session_looks_like: s.what_session_looks_like ?? '',
    price_per_hour: s.price_per_hour,
    currency: s.currency,
    format: (s.format as Skill['format']) ?? 'in-person',
    location: s.location ?? '',
    neighborhood: s.neighborhood ?? '',
    languages: s.languages ?? [],
    level: (s.level as Skill['level']) ?? 'all levels',
    avg_rating: s.avg_rating,
    reviews_count: s.reviews_count,
    tags: s.tags ?? [],
    cover_gradient: s.cover_gradient ?? 'from-blue-500 to-purple-600',
    cover_image_url: s.cover_image_url ?? null,
    is_free: s.is_free,
    is_group: s.is_group,
    max_headcount: s.max_headcount ?? null,
    current_headcount: s.current_headcount ?? 0,
    availability_note: s.availability_note ?? null,
    status: s.is_active ? 'active' : 'paused',
    created_at: s.created_at,
    teacher: {
      id: p?.id ?? '',
      firstName: p?.first_name ?? '',
      lastName: p?.last_name ?? '',
      avatar: p?.avatar_url ?? '',
      bio: p?.bio ?? '',
      location: p?.city
        ? `${p.city}${p.neighborhood ? `, ${p.neighborhood}` : ''}`
        : p?.neighborhood ?? '',
      city: p?.city ?? '',
      trust_tier: (p?.trust_tier ?? 0) as Skill['teacher']['trust_tier'],
      trust_score: p?.trust_score ?? 0,
      archetype: 'mixed',
      what_i_teach: [],
      what_i_learn: [],
      languages: [],
      sessions_completed: p?.sessions_completed ?? 0,
      reviews_count: p?.reviews_count ?? 0,
      joined_at: '',
    },
  };
}
