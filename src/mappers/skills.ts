// Domain boundary: raw Supabase rows → typed UI models.
// All skill fetches must go through mapSkillRow. Never spread a SkillRow
// directly onto a Skill — the shapes diverge (profiles join, nullability, etc.)

import type { Skill } from '@/types/skills';
import type { Database } from '@/types/db';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

/** skills row + joined profile payload from the select relation */
export type SkillRow = Database['public']['Tables']['skills']['Row'] & {
  profiles: ProfileRow | null;
};

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
